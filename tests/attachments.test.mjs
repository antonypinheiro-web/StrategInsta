import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTACHMENT_LIMITS, validateAttachmentSelection, validateAttachmentSignature, validateDocxArchive, inspectAttachment, parsePageSelection, limitExtractedText, extractAttachmentText } from '../src/lib/attachments.ts';

test('attachment budgets enforce real format, per file, count and briefing limits before extraction', () => {
  assert.equal(validateAttachmentSelection({ name: 'Business.PDF', size: 50 * 1024 * 1024 }), 'pdf');
  assert.throws(() => validateAttachmentSelection({ name: 'image.png', size: 11 * 1024 * 1024 }), /10 MB/);
  assert.throws(() => validateAttachmentSelection({ name: 'doc.pdf', size: 51 * 1024 * 1024 }), /50 MB/);
  assert.throws(() => validateAttachmentSelection({ name: 'video.mp4', size: 100 }), /Use PDF/);
  assert.throws(() => validateAttachmentSelection({ name: 'doc.txt', size: 1 }, Array.from({ length: 5 }, () => ({ size: 1 }))), /cinco/);
  assert.throws(() => validateAttachmentSelection({ name: 'doc.txt', size: 1 }, [{ size: ATTACHMENT_LIMITS.briefingBytes }]), /100 MB/);
  assert.throws(() => validateAttachmentSignature('pdf', new TextEncoder().encode('<html>')));
  assert.throws(() => validateAttachmentSignature('png', new Uint8Array([0xff, 0xd8, 0xff])));
  assert.throws(() => validateAttachmentSignature('txt', new Uint8Array([65, 0, 66])));
});

test('content hash detects duplicate content even when the filename changes', async () => {
  const first = new File(['Nossa oferta é uma mentoria.'], 'offer.txt', { type: 'text/plain' });
  const inspected = await inspectAttachment(first);
  assert.match(inspected.sha256, /^[a-f0-9]{64}$/);
  await assert.rejects(inspectAttachment(new File(['Nossa oferta é uma mentoria.'], 'other.txt'), [{ size: first.size, sha256: inspected.sha256 }]), /já está/);
});

test('page selection is explicit above budget, deduplicated and never silently truncates ranges', () => {
  assert.deepEqual(parsePageSelection('3, 1-3, 8', 10), [1, 2, 3, 8]);
  assert.deepEqual(parsePageSelection('', 3), [1, 2, 3]);
  assert.throws(() => parsePageSelection('', 101), /Selecione/);
  assert.throws(() => parsePageSelection('1-101', 200), /limite/);
  assert.throws(() => parsePageSelection('1-5', 5, 4), /limite/);
  assert.throws(() => parsePageSelection('3-1', 5));
  assert.throws(() => parsePageSelection('0', 5));
  assert.throws(() => parsePageSelection('1<script>', 5));
});

test('actual UTF-8 extraction keeps facts, rejects binary text and marks every budget cut', async () => {
  const result = await extractAttachmentText(new File(['Olá!\r\nOferta: vasos artesanais.'], 'briefing.txt'), 'txt');
  assert.equal(result.text, 'Olá!\nOferta: vasos artesanais.');
  assert.equal(result.extraction, 'text');
  assert.equal(result.limited, false);
  const bounded = await extractAttachmentText(new File(['A'.repeat(101)], 'long.txt'), 'txt', { characterBudget: 100 });
  assert.equal(bounded.text.length, 100);
  assert.equal(bounded.limited, true);
  assert.match(bounded.notices.join(' '), /restante não será usado/);
  await assert.rejects(extractAttachmentText(new File([new Uint8Array([0xff, 0xff])], 'invalid.txt'), 'txt'), /UTF-8/);
  await assert.rejects(extractAttachmentText(new File([''], 'empty.txt'), 'txt'), /legível/);
  assert.deepEqual(limitExtractedText('12345', 3), { text: '123', limited: true });
});

function zipDirectory(entries) {
  const local = Buffer.alloc(60); local.writeUInt32LE(0x04034b50, 0);
  const directory = entries.map((entry) => {
    const name = Buffer.from(entry.name);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(entry.flags ?? 0, 8);
    header.writeUInt16LE(8, 10);
    header.writeUInt32LE(entry.compressed ?? 100, 20);
    header.writeUInt32LE(entry.uncompressed ?? 200, 24);
    header.writeUInt16LE(name.length, 28);
    return Buffer.concat([header, name]);
  });
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(Buffer.concat(directory).length, 12); end.writeUInt32LE(local.length, 16);
  return new Uint8Array(Buffer.concat([local, ...directory, end]));
}
test('DOCX inspection rejects ordinary ZIPs, encrypted entries, expansion bombs and traversal before conversion', () => {
  const expected = [{ name: '[Content_Types].xml' }, { name: 'word/document.xml' }];
  assert.equal(validateDocxArchive(zipDirectory(expected)).length, 2);
  assert.throws(() => validateDocxArchive(zipDirectory([{ name: 'other.txt' }])), /DOCX válido/);
  assert.throws(() => validateDocxArchive(zipDirectory([...expected, { name: '../escape.xml' }])), /inválida/);
  assert.throws(() => validateDocxArchive(zipDirectory([{ name: '[Content_Types].xml' }, { name: 'word/document.xml', flags: 1 }])), /protegido/);
  assert.throws(() => validateDocxArchive(zipDirectory([{ name: '[Content_Types].xml' }, { name: 'word/document.xml', uncompressed: 20_000_000 }])), /expande/);
  assert.throws(() => validateDocxArchive(new Uint8Array([80, 75, 3, 4])), /inválido/);
});
