import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ATTACHMENT_ACCEPT, ATTACHMENT_LIMITS, extractAttachmentText, inspectAttachment, isImageAttachment, PageSelectionRequired } from '@/lib/attachments';
import type { ApprovedAttachment, AttachmentExtraction, AttachmentKind, BriefingAttachmentService } from '@/types/briefing';

interface AttachmentDraft {
  id: string; name: string; size: number; kind?: AttachmentKind; sha256?: string; file?: File; storagePath?: string; briefingId?: string;
  status: 'loading' | 'selection' | 'review' | 'approved' | 'error'; progress: number;
  summary: string; extraction?: AttachmentExtraction; pageSelection: string; totalPages?: number; message?: string;
  approved?: ApprovedAttachment;
}

interface Props {
  value?: ApprovedAttachment[];
  service?: BriefingAttachmentService;
  onChange: (value: ApprovedAttachment[]) => void;
  onPendingChange?: (pending: boolean) => void;
  disabled?: boolean;
}
function restoredAttachment(item: ApprovedAttachment): AttachmentDraft {
  return { ...item, approved: item, status: 'approved', progress: 100, pageSelection: item.pages?.join(', ') ?? '',
    extraction: { text: item.summary, extraction: item.extraction, pages: item.pages, totalPages: item.totalPages, limited: item.limited, notices: [] } };
}
export function AttachmentsPanel({ value = [], service, onChange, onPendingChange, disabled }: Props) {
  const [items, setItems] = useState<AttachmentDraft[]>(() => value.map(restoredAttachment));
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const briefingId = useRef(crypto.randomUUID());
  const selecting = useRef(false);
  const controllers = useRef(new Map<string, AbortController>());
  const latest = useRef(items);
  latest.current = items;
  const incoming = useRef(value);
  const pending = items.some((item) => item.status !== 'approved');
  const busy = items.some((item) => item.status === 'loading');
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);
  useEffect(() => () => { for (const controller of controllers.current.values()) controller.abort(); }, []);
  useEffect(() => {
    if (incoming.current === value) return;
    incoming.current = value;
    const currentApproved = latest.current.filter((item) => item.approved).map((item) => item.approved);
    if (JSON.stringify(currentApproved) === JSON.stringify(value)) return;
    setItems((current) => [...value.map(restoredAttachment),
      ...current.filter((item) => !item.approved && !value.some((approved) => approved.id === item.id))]);
  }, [value]);
  function patch(id: string, delta: Partial<AttachmentDraft>) { setItems((current) => current.map((item) => item.id === id ? { ...item, ...delta } : item)); }
  function emit(itemsToUse: AttachmentDraft[]) { onChange(itemsToUse.flatMap((item) => item.approved ? [item.approved] : [])); }
  async function process(draft: AttachmentDraft, retryExtraction = false) {
    if (!draft.file || !draft.kind) return;
    const controller = new AbortController(); controllers.current.set(draft.id, controller);
    patch(draft.id, { status: 'loading', message: '' });
    try {
      let path = draft.storagePath;
      if (!path && service) {
        const uploaded = await service.upload(draft.file, { id: draft.id, briefingId: draft.briefingId ?? briefingId.current, kind: draft.kind, sha256: draft.sha256! }, controller.signal,
          (progress) => patch(draft.id, { progress }));
        path = uploaded.storagePath;
        patch(draft.id, { storagePath: path, progress: 100 });
      }
      if (isImageAttachment(draft.kind)) {
        if (retryExtraction && service?.extractImage && path) {
          const extraction = await service.extractImage(draft.file, path, controller.signal);
          patch(draft.id, { extraction, summary: extraction.text.slice(0, ATTACHMENT_LIMITS.summaryCharacters), status: 'review' });
        } else patch(draft.id, { status: 'review', message: 'Descreva a imagem com suas palavras ou solicite a leitura do texto. A descrição será usada como informação declarada por você.',
          extraction: { text: '', extraction: 'manual', limited: false, notices: [] } });
        return;
      }
      const others = latest.current.filter((item) => item.id !== draft.id);
      const remainingPages = ATTACHMENT_LIMITS.pdfPages - others.reduce((sum, item) => sum + (item.extraction?.pages?.length ?? item.approved?.pages?.length ?? 0), 0);
      const characterBudget = ATTACHMENT_LIMITS.extractedCharacters - others.reduce((sum, item) => sum + (item.extraction?.text.length ?? item.summary.length), 0);
      const extraction = await extractAttachmentText(draft.file, draft.kind,
        { pages: draft.pageSelection, remainingPages, characterBudget, signal: controller.signal });
      patch(draft.id, { extraction, summary: extraction.text.slice(0, ATTACHMENT_LIMITS.summaryCharacters), status: 'review', storagePath: path });
    } catch (failure) {
      if (controller.signal.aborted) { patch(draft.id, { status: 'error', message: retryExtraction && isImageAttachment(draft.kind)
        ? 'A solicitação foi interrompida nesta tela. Confira no histórico se a leitura com IA foi concluída e qual foi o consumo antes de solicitar outra.'
        : 'Processamento interrompido. Você pode tentar novamente.' }); return; }
      if (failure instanceof PageSelectionRequired) patch(draft.id, { status: 'selection', totalPages: failure.totalPages, message: failure.message });
      else patch(draft.id, { status: 'error', message: failure instanceof Error ? failure.message : 'Não foi possível ler o arquivo. Tente novamente.' });
    } finally { controllers.current.delete(draft.id); }
  }
  async function selectFiles(files: File[]) {
    if (busy || disabled || selecting.current) return;
    selecting.current = true;
    setMessage('');
    const existing = [...latest.current];
    for (const file of files) {
      try {
        const metadata = await inspectAttachment(file, existing);
        const draft: AttachmentDraft = { id: crypto.randomUUID(), briefingId: briefingId.current, file, ...metadata, name: file.name, size: file.size,
          status: 'loading', progress: 0, summary: '', pageSelection: '' };
        existing.push(draft); setItems((current) => [...current, draft]);
        await process(draft);
      } catch (failure) { setMessage(`${file.name}: ${failure instanceof Error ? failure.message : 'Não foi possível selecionar.'}`); }
    }
    if (fileInput.current) fileInput.current.value = '';
    selecting.current = false;
  }
  function approve(draft: AttachmentDraft) {
    if (!draft.summary.trim()) { patch(draft.id, { message: 'Selecione os trechos ou descreva o que deve ser considerado.' }); return; }
    if (!draft.storagePath || !draft.sha256 || !draft.kind || !draft.extraction) { patch(draft.id, { message: 'O envio privado precisa ser concluído antes de usar esta fonte na estratégia.' }); return; }
    const approved: ApprovedAttachment = { id: draft.id, name: draft.name, size: draft.size, kind: draft.kind, sha256: draft.sha256,
      storagePath: draft.storagePath, summary: draft.summary.trim(), reviewedAt: new Date().toISOString(),
      pages: draft.extraction.pages, totalPages: draft.extraction.totalPages, extraction: draft.extraction.extraction,
      limited: draft.extraction.limited || draft.extraction.text.length > draft.summary.length };
    const next = latest.current.map((item): AttachmentDraft => item.id === draft.id ? { ...item, approved, status: 'approved', message: '' } : item);
    setItems(next); emit(next);
  }
  async function remove(draft: AttachmentDraft) {
    controllers.current.get(draft.id)?.abort();
    // Removing a briefing reference does not delete an original used by saved versions.
    try {
      if (service?.discard) await service.discard(draft.id);
      else if (draft.storagePath && service?.remove) await service.remove(draft.storagePath);
    } catch {
      patch(draft.id, { message: 'Não foi possível retirar esta fonte agora. Tente novamente; o original e as revisões foram preservados.' });
      return;
    }
    const next = latest.current.filter((item) => item.id !== draft.id); setItems(next); emit(next);
  }
  return <section className="space-y-4 rounded-xl border border-border p-5" aria-label="Documentos e imagens do briefing">
    <div className="flex items-center gap-2"><Paperclip className="h-5 w-5 text-primary" /><h2 className="font-semibold">Documentos e imagens (opcional)</h2></div>
    <p className="text-sm leading-6 text-muted-foreground">Até 5 arquivos e 100 MB no total. PDF, DOCX ou TXT até 50 MB; JPEG, PNG ou WebP até 10 MB. Revise os trechos que a estratégia deverá considerar.</p>
    {!service && <p className="rounded-lg bg-muted/40 p-3 text-sm">A leitura local está disponível para prévia. O envio privado ainda precisa estar conectado para incluir fontes na geração.</p>}
    <input ref={fileInput} type="file" multiple accept={ATTACHMENT_ACCEPT} className="sr-only" id="briefing-attachments" onChange={(event) => void selectFiles(Array.from(event.target.files ?? []))} disabled={busy || disabled || items.length >= 5} />
    <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={busy || disabled || items.length >= 5}><Paperclip className="mr-2 h-4 w-4" />Selecionar arquivos</Button>
    <span className="ml-3 text-xs text-muted-foreground">{items.length}/5 · {(items.reduce((sum, item) => sum + item.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    {items.map((item) => <article key={item.id} className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="flex items-center gap-2 break-all text-sm font-semibold"><FileText className="h-4 w-4 shrink-0" />{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{(item.size / 1024 / 1024).toFixed(1)} MB · {item.status === 'approved' ? 'Fonte revisada e incluída' : item.status === 'loading' ? 'Processando...' : 'Revisão pendente'}</p></div>
        <Button variant="ghost" size="icon" aria-label={'Retirar ' + item.name + ' do briefing'} onClick={() => void remove(item)}><X className="h-4 w-4" /></Button></div>
      {item.status === 'loading' && <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{item.progress < 100 && service ? `Enviando arquivo: ${Math.round(item.progress)}%` : 'Lendo o conteúdo...'}<Button variant="ghost" size="sm" onClick={() => controllers.current.get(item.id)?.abort()}>Interromper</Button></div>}
      {item.message && <p role="status" className="text-sm text-muted-foreground">{item.message}</p>}
      {item.extraction?.notices.map((notice) => <p key={notice} className="rounded-lg bg-muted/40 p-3 text-xs leading-5">{notice}</p>)}
      {item.file && (item.status === 'selection' || (item.kind === 'pdf' && item.extraction?.limited && item.status !== 'loading')) && <div className="space-y-2"><label className="block text-sm font-medium" htmlFor={'pages-' + item.id}>Páginas que deseja ler</label><Input id={'pages-' + item.id} value={item.pageSelection} onChange={(event) => patch(item.id, { pageSelection: event.target.value })} placeholder="Ex.: 1-5, 8, 12-15" /><Button variant="outline" onClick={() => void process(item)}>Ler páginas selecionadas</Button></div>}
      {(item.status === 'review' || item.status === 'approved') && <>
        {item.extraction?.text && <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-xs font-medium">Conferir texto extraído e páginas</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-xs leading-6">{item.extraction.text}</pre></details>}
        <label className="block text-sm font-medium" htmlFor={'summary-' + item.id}>Informações desta fonte para a estratégia</label>
        <Textarea id={'summary-' + item.id} value={item.summary} maxLength={ATTACHMENT_LIMITS.summaryCharacters} disabled={item.status === 'approved'} className="min-h-36" onChange={(event) => patch(item.id, { summary: event.target.value, message: '' })} placeholder="Resuma ou selecione os trechos relevantes. Em imagens, descreva apenas o que aparece e o que você conhece." />
        <p className="text-xs text-muted-foreground">{item.summary.length}/{ATTACHMENT_LIMITS.summaryCharacters} caracteres. {item.extraction?.text.length > item.summary.length ? 'A seleção inicial contém apenas o começo do texto. Substitua pelos trechos relevantes antes de aprovar.' : 'Somente este texto revisado será enviado à IA.'}</p>
        {item.status === 'approved' ? <Button variant="outline" size="sm" onClick={() => { const next = latest.current.map((draft): AttachmentDraft => draft.id === item.id ? { ...draft, approved: undefined, status: 'review' } : draft); setItems(next); emit(next); }}>Revisar fonte</Button>
          : <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => approve(item)} disabled={!item.storagePath || disabled}>Aprovar fonte para a estratégia</Button>
            {item.file && item.kind && isImageAttachment(item.kind) && service?.extractImage && <Button variant="outline" onClick={() => void process(item, true)} disabled={!item.storagePath || disabled}>Ler texto com IA · {service.imageExtractionCost ?? 2} créditos</Button>}</div>}
      </>}
      {item.status === 'error' && item.file && <Button variant="outline" onClick={() => void process(item)}>Tentar novamente</Button>}
    </article>)}
    {pending && <p className="text-sm text-muted-foreground">Aprove ou retire as fontes pendentes antes de gerar. Selecionar um arquivo não confirma que seu conteúdo foi lido.</p>}
  </section>;
}
