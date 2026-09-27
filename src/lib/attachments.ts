import type { AttachmentExtraction, AttachmentKind } from '../types/briefing.ts';

export const ATTACHMENT_LIMITS = Object.freeze({ documentBytes: 50 * 1024 * 1024, imageBytes: 10 * 1024 * 1024,
  briefingBytes: 100 * 1024 * 1024, count: 5, pdfPages: 100, extractedCharacters: 120_000, summaryCharacters: 6000 });
export const ATTACHMENT_ACCEPT = '.pdf,.docx,.txt,.jpg,.jpeg,.png,.webp';
const kinds: Record<string, AttachmentKind> = { pdf: 'pdf', docx: 'docx', txt: 'txt', jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp' };
const imageKinds = ['jpeg', 'png', 'webp'];
export const isImageAttachment = (kind: AttachmentKind) => imageKinds.includes(kind);

export function validateAttachmentSelection(file: Pick<File, 'name' | 'size'>,
  existing: { size: number }[] = []): AttachmentKind {
  const kind = kinds[file.name.split('.').at(-1)?.toLowerCase() ?? ''];
  if (!kind) throw new Error('Use PDF, DOCX, TXT, JPEG, PNG ou WebP.');
  if (!Number.isSafeInteger(file.size) || file.size <= 0) throw new Error('O arquivo está vazio ou tem tamanho inválido.');
  if (existing.length >= ATTACHMENT_LIMITS.count) throw new Error('O briefing aceita até cinco arquivos.');
  if (file.size > (isImageAttachment(kind) ? ATTACHMENT_LIMITS.imageBytes : ATTACHMENT_LIMITS.documentBytes))
    throw new Error(isImageAttachment(kind) ? 'Cada imagem pode ter até 10 MB.' : 'Cada documento pode ter até 50 MB.');
  if (existing.reduce((total, item) => total + item.size, file.size) > ATTACHMENT_LIMITS.briefingBytes)
    throw new Error('Os arquivos deste briefing podem somar até 100 MB.');
  return kind;
}

function matches(bytes: Uint8Array, expected: number[], start = 0) {
  return expected.every((value, index) => bytes[start + index] === value);
}

export function validateAttachmentSignature(kind: AttachmentKind, bytes: Uint8Array) {
  const ascii = new TextDecoder('latin1').decode(bytes.slice(0, 16));
  const valid = kind === 'pdf' ? ascii.startsWith('%PDF-')
    : kind === 'docx' ? matches(bytes, [0x50, 0x4b, 0x03, 0x04])
    : kind === 'jpeg' ? matches(bytes, [0xff, 0xd8, 0xff])
    : kind === 'png' ? matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    : kind === 'webp' ? ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
    : !bytes.includes(0) && !matches(bytes, [0x4d, 0x5a]) && !ascii.startsWith('%PDF-') && !ascii.startsWith('PK');
  if (!valid) throw new Error('O conteúdo do arquivo não corresponde ao formato informado.');
}

export interface DocxEntry { name: string; compressedSize: number; uncompressedSize: number; method: number; offset: number }
/** Inspect the ZIP directory before decompression. Never accept arbitrary ZIPs as DOCX. */
export function validateDocxArchive(bytes: Uint8Array): DocxEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index--) {
    if (view.getUint32(index, true) === 0x06054b50) { end = index; break; }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('DOCX inválido ou dividido em volumes.');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  if (count > 2000 || count === 0 || count === 0xffff || offset >= end) throw new Error('DOCX excede os limites de processamento.');
  const entries: DocxEntry[] = [];
  let totalUncompressed = 0;
  for (let index = 0; index < count; index++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('Estrutura de DOCX inválida.');
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > end || localOffset >= offset || flags & 1 || ![0, 8].includes(method)) throw new Error('DOCX protegido ou com compressão não suportada.');
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    if (name.includes('..') || name.startsWith('/') || name.includes('\\') || entries.some((entry) => entry.name === name)) throw new Error('Estrutura de DOCX inválida.');
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > 100 * 1024 * 1024 || (name.endsWith('.xml') && uncompressedSize > 10 * 1024 * 1024)
      || uncompressedSize / Math.max(1, compressedSize) > 200) throw new Error('DOCX expande além do limite seguro. Exporte um PDF ou TXT menor.');
    entries.push({ name, compressedSize, uncompressedSize, method, offset: localOffset });
    offset = next;
  }
  if (!entries.some((entry) => entry.name === 'word/document.xml') || !entries.some((entry) => entry.name === '[Content_Types].xml'))
    throw new Error('O arquivo não contém um documento DOCX válido.');
  return entries;
}

/** Verify actual inflated lengths as well as untrusted ZIP directory declarations. */
async function verifyDocxExpansion(bytes: Uint8Array, entries: DocxEntry[], signal?: AbortSignal) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (const entry of entries) {
    signal?.throwIfAborted();
    if (entry.offset + 30 > bytes.length || view.getUint32(entry.offset, true) !== 0x04034b50) throw new Error('Estrutura de DOCX inválida.');
    const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
    if (start + entry.compressedSize > bytes.length) throw new Error('DOCX incompleto.');
    const compressed = bytes.slice(start, start + entry.compressedSize);
    if (entry.method === 0) {
      if (compressed.length !== entry.uncompressedSize) throw new Error('Tamanho interno de DOCX inválido.');
      continue;
    }
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    const reader = stream.getReader();
    let actual = 0;
    try {
      while (true) {
        signal?.throwIfAborted();
        const chunk = await reader.read();
        if (chunk.done) break;
        actual += chunk.value.byteLength;
        if (actual > entry.uncompressedSize || actual > 100 * 1024 * 1024) throw new Error('DOCX expande além do tamanho declarado.');
      }
      if (actual !== entry.uncompressedSize) throw new Error('DOCX incompleto ou inválido.');
    } finally { await reader.cancel().catch(() => undefined); }
  }
}

export async function inspectAttachment(file: File, existing: { size: number; sha256?: string }[] = []) {
  const kind = validateAttachmentSelection(file, existing);
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateAttachmentSignature(kind, bytes.slice(0, 1024));
  if (kind === 'docx') validateDocxArchive(bytes);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('');
  if (existing.some((item) => item.sha256 === sha256)) throw new Error('Este arquivo já está no briefing.');
  return { kind, sha256 };
}

export function parsePageSelection(value: string, totalPages: number, budget: number = ATTACHMENT_LIMITS.pdfPages): number[] {
  const pages = new Set<number>();
  if (!value.trim()) {
    if (totalPages > budget) throw new Error(`Selecione até ${budget} páginas deste PDF antes de extrair.`);
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  for (const part of value.split(',')) {
    const match = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(part);
    if (!match) throw new Error('Use páginas como 1-5, 8, 12-15.');
    const first = Number(match[1]), last = Number(match[2] ?? match[1]);
    if (first < 1 || last < first || last > totalPages || last - first + 1 > budget) throw new Error('Confira o intervalo e o limite de páginas.');
    for (let number = first; number <= last; number++) pages.add(number);
    if (pages.size > budget) throw new Error(`O briefing aceita até ${budget} páginas adicionais de PDF.`);
  }
  return [...pages].sort((a, b) => a - b);
}

export function limitExtractedText(text: string, characterBudget: number = ATTACHMENT_LIMITS.extractedCharacters) {
  const normalized = text.split(String.fromCharCode(0)).join('').replace(/\r\n?/g, '\n').trim();
  return { text: normalized.slice(0, Math.max(0, characterBudget)), limited: normalized.length > characterBudget };
}

export class PageSelectionRequired extends Error {
  totalPages: number;
  constructor(totalPages: number, remaining: number) {
    super(`Este PDF tem ${totalPages} páginas. Selecione até ${remaining} páginas para este briefing.`);
    this.totalPages = totalPages;
  }
}

export async function extractAttachmentText(file: File, kind: AttachmentKind,
  options: { pages?: string; remainingPages?: number; characterBudget?: number; signal?: AbortSignal } = {}): Promise<AttachmentExtraction> {
  const { signal } = options;
  signal?.throwIfAborted();
  if (isImageAttachment(kind)) throw new Error('Esta imagem precisa de leitura de texto ou de uma descrição revisada.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  validateAttachmentSignature(kind, bytes.slice(0, 1024));
  let text = '', pages: number[] | undefined, totalPages: number | undefined;
  let stoppedForBudget = false;
  const notices: string[] = [];
  const budget = Math.min(ATTACHMENT_LIMITS.extractedCharacters, options.characterBudget ?? ATTACHMENT_LIMITS.extractedCharacters);
  if (budget <= 0) throw new Error('O limite de texto do briefing foi atingido. Remova uma fonte ou selecione menos trechos.');
  if (kind === 'txt') {
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw new Error('O TXT precisa estar salvo em UTF-8.'); }
    if (text.includes('\u0000')) throw new Error('Este TXT contém dados binários.');
  } else if (kind === 'docx') {
    const entries = validateDocxArchive(bytes);
    await verifyDocxExpansion(bytes, entries, signal);
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    text = result.value;
    notices.push('DOCX: texto e tabelas extraídos. Imagens, diagramação e objetos incorporados não foram interpretados.');
  } else {
    const pdfjs = await import('pdfjs-dist');
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const task = pdfjs.getDocument({ data: bytes, useSystemFonts: false, stopAtErrors: true });
    const abort = () => { void task.destroy(); };
    signal?.addEventListener('abort', abort, { once: true });
    try {
      const document = await task.promise;
      totalPages = document.numPages;
      const remaining = Math.min(ATTACHMENT_LIMITS.pdfPages, options.remainingPages ?? ATTACHMENT_LIMITS.pdfPages);
      if (!options.pages?.trim() && totalPages > remaining) throw new PageSelectionRequired(totalPages, remaining);
      const selected = parsePageSelection(options.pages ?? '', totalPages, remaining);
      pages = [];
      for (const number of selected) {
        signal?.throwIfAborted();
        const page = await document.getPage(number);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('').trim();
        text += `\n\n[Página ${number}]\n${pageText}`;
        pages.push(number);
        page.cleanup();
        if (text.length > budget) { stoppedForBudget = true; break; }
      }
      if (!text.replace(/\[Página \d+\]/g, '').trim()) throw new Error('Não foi encontrado texto neste PDF. Ele pode ser escaneado; envie as páginas necessárias como imagens para revisar o texto.');
      if (pages.length < totalPages) notices.push(`Foram extraídas as páginas ${pages.join(', ')} de ${totalPages}. As demais não serão usadas.`);
    } catch (failure) {
      if (failure instanceof Error && failure.name === 'PasswordException') throw new Error('Este PDF é protegido por senha. Envie uma cópia desbloqueada.');
      throw failure;
    } finally { signal?.removeEventListener('abort', abort); await task.destroy(); }
  }
  signal?.throwIfAborted();
  const bounded = limitExtractedText(text, budget);
  if (!bounded.text) throw new Error('O arquivo não contém texto legível.');
  if (bounded.limited || stoppedForBudget) notices.push('O texto excede o orçamento de leitura deste briefing (120 mil caracteres, aproximadamente 30 mil tokens). Revise os trechos ou reduza a seleção; o restante não será usado.');
  return { ...bounded, limited: bounded.limited || stoppedForBudget || !!(totalPages && pages && pages.length < totalPages),
    extraction: 'text', pages, totalPages, notices };
}
