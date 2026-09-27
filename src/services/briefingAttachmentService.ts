import { Upload } from 'tus-js-client';
import { supabase, supabaseUrl } from '@/integrations/supabase/client';
import { invokePilot, pilotService, PilotRequestError } from '@/services/pilotService';
import type { GenerationRequest, Wallet } from '@/services/pilotService';
import type { UserInput } from '@/types';
import type { AttachmentExtraction, AttachmentKind, BriefingAttachmentService } from '@/types/briefing';

const mimeTypes: Record<AttachmentKind, string> = { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const isImage = (kind: AttachmentKind) => ['jpeg', 'png', 'webp'].includes(kind);
interface PreparedUpload { storagePath: string; bucket: string; status: 'uploading' | 'ready'; }

/** All uploads use TUS, including small files, so cancellation/retry has one path. */
export function createBriefingAttachmentService(businessId: string, userId: string,
  getInput?: () => UserInput | null | undefined, onWalletChanged?: (wallet: Wallet) => void): BriefingAttachmentService {
  const operations = new Map<string, { request: GenerationRequest; attempted: boolean }>();
  const transferCompleted = new Set<string>();
  const preparedIds = new Set<string>();
  const extractions = new Map<string, AttachmentExtraction>();
  return {
    async upload(file, metadata, signal, onProgress) {
      signal.throwIfAborted();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== userId) throw new Error('Entre novamente na sua conta antes de enviar arquivos.');
      const contentType = mimeTypes[metadata.kind];
      const prepared = await invokePilot<PreparedUpload>('prepareUpload', { businessId, briefingId: metadata.briefingId, id: metadata.id, name: file.name.slice(0, 200),
        kind: isImage(metadata.kind) ? 'image' : metadata.kind, mimeType: contentType, size: file.size, sha256: metadata.sha256 });
      preparedIds.add(metadata.id);
      signal.throwIfAborted();
      if (!prepared.storagePath.startsWith(`${userId}/${businessId}/`) || prepared.bucket !== 'briefing-files')
        throw new Error('O servidor retornou um destino de arquivo inválido.');
      if (prepared.status === 'ready') { onProgress(100); return { storagePath: prepared.storagePath }; }
      if (!transferCompleted.has(prepared.storagePath)) await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true; signal.removeEventListener('abort', abort);
          if (error) reject(error); else resolve();
        };
        const upload = new Upload(file, {
          endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000], chunkSize: 6 * 1024 * 1024,
          uploadDataDuringCreation: true, removeFingerprintOnSuccess: true,
          headers: { authorization: `Bearer ${session.access_token}`, 'x-upsert': 'false' },
          metadata: { bucketName: prepared.bucket, objectName: prepared.storagePath, contentType, cacheControl: '3600' },
          fingerprint: async () => `strateginsta:${userId}:${businessId}:${metadata.id}:${metadata.sha256}`,
          async onBeforeRequest(request) {
            const { data: { session: current } } = await supabase.auth.getSession();
            if (!current || current.user.id !== userId) throw new Error('Sessão indisponível para continuar o envio.');
            request.setHeader('authorization', `Bearer ${current.access_token}`);
          },
          onProgress: (uploaded, total) => onProgress(total > 0 ? uploaded / total * 100 : 0),
          onError: () => finish(new Error('O envio foi interrompido. Tente novamente para retomar o arquivo.')),
          onSuccess: () => finish(),
        });
        const abort = () => { void upload.abort(false).catch(() => undefined); finish(new DOMException('Envio interrompido.', 'AbortError')); };
        signal.addEventListener('abort', abort, { once: true });
        void upload.findPreviousUploads().then((previous) => {
          if (signal.aborted) { abort(); return; }
          if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        }).catch(() => finish(new Error('Não foi possível preparar o envio retomável neste navegador.')));
      });
      transferCompleted.add(prepared.storagePath);
      signal.throwIfAborted();
      const complete = await invokePilot<{ storagePath: string; status: string }>('completeUpload', { businessId, id: metadata.id });
      if (complete.status !== 'ready' || complete.storagePath !== prepared.storagePath) throw new Error('O envio ainda não foi validado. Tente novamente.');
      onProgress(100); return { storagePath: complete.storagePath };
    },
    async discard(attachmentId) {
      if (!preparedIds.has(attachmentId)) {
        // A reference restored from a saved strategy can still be detached safely.
        const reference = getInput?.()?.attachments?.find((item) => item.id === attachmentId);
        if (!reference) return;
      }
      await invokePilot('removeAttachment', { businessId, id: attachmentId });
      preparedIds.delete(attachmentId);
    },
    imageExtractionCost: 2,
    ...(getInput ? {
      async extractImage(_file: File, storagePath: string, signal: AbortSignal) {
        signal.throwIfAborted();
        const cached = extractions.get(storagePath);
        if (cached) return cached;
        const input = getInput();
        if (!input) throw new Error('Conclua as respostas do briefing antes de solicitar a leitura com IA.');
        let operation = operations.get(storagePath);
        if (!operation) {
          operation = { request: { operation: 'attachment_ocr', idempotencyKey: crypto.randomUUID(), businessId,
            input, parameters: { storagePath } }, attempted: false };
          operations.set(storagePath, operation);
        }
        const quote = await pilotService.quote(operation.request);
        onWalletChanged?.(quote.wallet);
        if (quote.credits !== 0 && quote.credits !== 2) throw new Error(`O custo de leitura mudou para ${quote.credits} créditos. Atualize o app para revisar o novo custo antes de gerar.`);
        if (quote.availableAfter < 0) throw new PilotRequestError('INSUFFICIENT_CREDITS');
        signal.throwIfAborted();
        const retry = operation.attempted; operation.attempted = true;
        const result = await pilotService.generate({ ...operation.request, retry });
        onWalletChanged?.(result.wallet);
        if (signal.aborted) {
          if (result.generation.status !== 'completed') await pilotService.cancel(result.generation.id);
          throw new Error('A leitura foi interrompida nesta tela. Consulte o histórico para conferir o resultado e o consumo.');
        }
        const output = result.generation.output as { text?: unknown; notices?: unknown; limited?: unknown };
        if (!output || typeof output.text !== 'string' || !Array.isArray(output.notices) || typeof output.limited !== 'boolean')
          throw new Error('A leitura retornou um formato inválido. Consulte o histórico antes de tentar novamente.');
        const extraction = { text: output.text, extraction: 'ocr' as const, limited: output.limited,
          notices: output.notices.filter((notice): notice is string => typeof notice === 'string') };
        extractions.set(storagePath, extraction);
        return extraction;
      },
    } : {}),
  };
}
