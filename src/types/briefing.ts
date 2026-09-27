export type AttachmentKind = 'pdf' | 'docx' | 'txt' | 'jpeg' | 'png' | 'webp';

export interface ProfileBaseline {
  source: 'manual';
  sourceDescription: string;
  capturedAt: string;
  periodStart?: string;
  periodEnd?: string;
  timezone: string;
  metrics: Partial<Record<'followers' | 'reach' | 'profileVisits' | 'websiteClicks' | 'leads' | 'sales', number>>;
  notes?: string;
}

/** Only reviewed excerpts go into AI context. Originals remain in private storage. */
export interface ApprovedAttachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  size: number;
  sha256: string;
  storagePath: string;
  summary: string;
  reviewedAt: string;
  pages?: number[];
  totalPages?: number;
  extraction: 'text' | 'ocr' | 'manual';
  limited: boolean;
}

export interface AttachmentExtraction {
  text: string;
  pages?: number[];
  totalPages?: number;
  extraction: 'text' | 'ocr' | 'manual';
  limited: boolean;
  notices: string[];
}

export interface AttachmentUploadMetadata {
  id: string;
  briefingId: string;
  kind: AttachmentKind;
  sha256: string;
}

/** Supplied by the authenticated application; no provider keys reach the browser. */
export interface BriefingAttachmentService {
  upload(file: File, metadata: AttachmentUploadMetadata, signal: AbortSignal,
    onProgress: (percent: number) => void): Promise<{ storagePath: string }>;
  remove?(storagePath: string): Promise<void>;
  discard?(attachmentId: string): Promise<void>;
  /** Must display and charge the server quote before requesting OCR. */
  extractImage?(file: File, storagePath: string, signal: AbortSignal): Promise<AttachmentExtraction>;
  imageExtractionCost?: number;
}
