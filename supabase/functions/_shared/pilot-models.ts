export type Provider = 'openai' | 'gemini';
export interface ModelConfig {
  provider: Provider;
  model: string;
  weight: number;
  reasoning: 'low' | 'medium' | 'high';
  inputPricePerMillion?: number | null;
  outputPricePerMillion?: number | null;
  priceVerifiedAt?: string;
  priceExpiresAt?: string;
}
export const TARGET_MODELS: ModelConfig[] = [
  { provider: 'openai', model: 'gpt-5.6-luna', weight: 50, reasoning: 'medium', inputPricePerMillion: 0.2, outputPricePerMillion: 1.2, priceVerifiedAt: '2026-09-27' },
  { provider: 'gemini', model: 'gemini-3.8-flash', weight: 50, reasoning: 'medium', inputPricePerMillion: 0.75, outputPricePerMillion: 3.75, priceVerifiedAt: '2026-09-27', priceExpiresAt: '2026-12-31' },
];

export class PilotError extends Error {
  code: string;
  status: number;
  transient: boolean;
  constructor(code: string, status = 400, transient = false) {
    super(code); this.name = 'PilotError'; this.code = code; this.status = status; this.transient = transient;
  }
}
export function validateModel(value: unknown): ModelConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PilotError('INVALID_MODEL');
  const m = value as Record<string, unknown>;
  const provider = m.provider;
  if (provider !== 'openai' && provider !== 'gemini') throw new PilotError('INVALID_PROVIDER');
  if (typeof m.model !== 'string' || !/^[a-z0-9][a-z0-9._-]{2,100}$/.test(m.model)) throw new PilotError('INVALID_MODEL');
  // Future selectable text models still have to appear in the provider's authenticated catalogue and pass a test.
  if (provider === 'openai' && (!/^gpt-5\.[6-9][a-z0-9._-]*$|^gpt-[6-9][a-z0-9._-]*$/.test(m.model) || /audio|image|transcribe|realtime|tts/.test(m.model))) throw new PilotError('MODEL_ADAPTER_UNSUPPORTED');
  if (provider === 'gemini' && (!/^gemini-[3-9][a-z0-9._-]*(flash|pro)[a-z0-9._-]*$/.test(m.model) || /image|audio|tts|live|robotics/.test(m.model))) throw new PilotError('MODEL_ADAPTER_UNSUPPORTED');
  if (!Number.isInteger(m.weight) || Number(m.weight) < 1 || Number(m.weight) > 100) throw new PilotError('INVALID_WEIGHT');
  if (!['low','medium','high'].includes(String(m.reasoning))) throw new PilotError('INVALID_REASONING');
  for (const field of ['inputPricePerMillion','outputPricePerMillion']) {
    if (m[field] != null && (typeof m[field] !== 'number' || !Number.isFinite(m[field]) || Number(m[field]) < 0 || Number(m[field]) > 1000)) throw new PilotError('INVALID_PRICE');
  }
  return { provider, model: m.model, weight: Number(m.weight), reasoning: m.reasoning as ModelConfig['reasoning'],
    inputPricePerMillion: m.inputPricePerMillion == null ? null : Number(m.inputPricePerMillion),
    outputPricePerMillion: m.outputPricePerMillion == null ? null : Number(m.outputPricePerMillion),
    ...(typeof m.priceVerifiedAt === 'string' ? {priceVerifiedAt:m.priceVerifiedAt.slice(0,10)} : {}),
    ...(typeof m.priceExpiresAt === 'string' ? {priceExpiresAt:m.priceExpiresAt.slice(0,10)} : {}),
  };
}

type KeyReader = (name: string) => string | undefined;
export interface ModelResult {
  text: string; provider: Provider; model: string; durationMs: number;
  inputTokens: number | null; outputTokens: number | null; cachedTokens: number | null;
  estimatedCostUsd: number | null; priceVerifiedAt?: string; priceExpired: boolean;
}
async function providerFetch(url: string, init: RequestInit, fetcher = fetch): Promise<Record<string, unknown>> {
  let response: Response;
  try { response = await fetcher(url, { ...init, signal: AbortSignal.timeout(150_000) }); }
  catch { throw new PilotError('PROVIDER_UNAVAILABLE', 503, true); }
  if (!response.ok) {
    // Provider bodies may echo user data, keys or signed URLs. Never forward or log them.
    const code = response.status === 429 ? 'PROVIDER_RATE_LIMIT' : response.status === 401 || response.status === 403 ? 'PROVIDER_AUTH' : response.status === 404 ? 'MODEL_UNAVAILABLE' : response.status >= 500 ? 'PROVIDER_UNAVAILABLE' : 'PROVIDER_REQUEST_REJECTED';
    throw new PilotError(code, 503, response.status === 429 || response.status >= 500);
  }
  try { return await response.json(); }
  catch { throw new PilotError('INVALID_PROVIDER_RESPONSE', 502); }
}
const integer = (value: unknown): number | null => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;

export async function listProviderModels(provider: Provider, keys: KeyReader, fetcher = fetch): Promise<string[]> {
  const key = keys(provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY');
  if (!key) throw new PilotError('PROVIDER_KEY_MISSING', 503);
  const ids: string[] = [];
  let page: string | undefined;
  for (let count=0; count<10; count++) {
    const url = provider === 'openai' ? 'https://api.openai.com/v1/models' : `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`;
    const data = await providerFetch(url,{headers: provider === 'openai' ? {Authorization:`Bearer ${key}`} : {'x-goog-api-key':key}},fetcher);
    const rows = (provider === 'openai' ? data.data : data.models) as Record<string, unknown>[] | undefined;
    for (const row of rows ?? []) {
      if (provider === 'gemini' && !(row.supportedGenerationMethods as string[] | undefined)?.includes('generateContent')) continue;
      const id = String(provider === 'openai' ? row.id : row.name).replace(/^models\//,'');
      try { validateModel({provider,model:id,weight:50,reasoning:'medium'}); ids.push(id); } catch { /* Unsupported adapters are not selectable. */ }
    }
    page = typeof data.nextPageToken === 'string' ? data.nextPageToken : undefined;
    if (!page || provider === 'openai') break;
  }
  return [...new Set(ids)].sort();
}

export async function runModel(config: ModelConfig, system: string, user: string, keys: KeyReader,
  options: {maxOutputTokens?: number; image?: {mimeType:string; data:string}; fetcher?: typeof fetch} = {}): Promise<ModelResult> {
  const key = keys(config.provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY');
  if (!key) throw new PilotError('PROVIDER_KEY_MISSING', 503);
  const start = Date.now();
  const maxOutputTokens = options.maxOutputTokens ?? 12_000;
  let text: string; let inputTokens: number | null; let outputTokens: number | null; let cachedTokens: number | null;
  if (config.provider === 'openai') {
    const content: Record<string, unknown>[] = [{type:'input_text',text:user}];
    if (options.image) content.push({type:'input_image',image_url:`data:${options.image.mimeType};base64,${options.image.data}`,detail:'auto'});
    const data = await providerFetch('https://api.openai.com/v1/responses', {
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
      body:JSON.stringify({model:config.model,instructions:system,input:[{role:'user',content}],store:false,
        reasoning:{effort:config.reasoning},max_output_tokens:maxOutputTokens,text:{format:{type:'json_object'}}}),
    },options.fetcher);
    if (data.status !== 'completed') throw new PilotError('OUTPUT_INCOMPLETE',502);
    const output = data.output as {type:string;content?:{type:string;text?:string}[]}[] | undefined;
    text = (output ?? []).flatMap(item => item.type === 'message' ? item.content ?? [] : []).filter(item=>item.type==='output_text').map(item=>item.text ?? '').join('');
    const usage = data.usage as Record<string,unknown> | undefined;
    inputTokens=integer(usage?.input_tokens); outputTokens=integer(usage?.output_tokens);
    cachedTokens=integer((usage?.input_tokens_details as Record<string,unknown>|undefined)?.cached_tokens);
  } else {
    const parts: Record<string,unknown>[]=[{text:user}];
    if(options.image) parts.push({inlineData:{mimeType:options.image.mimeType,data:options.image.data}});
    const data=await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
      body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],
        generationConfig:{responseMimeType:'application/json',maxOutputTokens,thinkingConfig:{thinkingLevel:config.reasoning.toUpperCase()}}}),
    },options.fetcher);
    const candidate=(data.candidates as {finishReason?:string;content?:{parts?:{text?:string;thought?:boolean}[]}}[]|undefined)?.[0];
    if(candidate?.finishReason !== 'STOP') throw new PilotError('OUTPUT_INCOMPLETE',502);
    text=(candidate?.content?.parts ?? []).filter(part=>!part.thought).map(part=>part.text ?? '').join('');
    const usage=data.usageMetadata as Record<string,unknown>|undefined;
    inputTokens=integer(usage?.promptTokenCount);
    const visible=integer(usage?.candidatesTokenCount); const thoughts=integer(usage?.thoughtsTokenCount);
    outputTokens=visible===null ? null : visible+(thoughts??0); cachedTokens=integer(usage?.cachedContentTokenCount);
  }
  if(!text.trim()) throw new PilotError('EMPTY_OUTPUT',502);
  const priceExpired=Boolean(config.priceExpiresAt && new Date(`${config.priceExpiresAt}T23:59:59Z`).getTime()<Date.now());
  const estimatedCostUsd=!priceExpired && inputTokens!==null && outputTokens!==null && config.inputPricePerMillion!=null && config.outputPricePerMillion!=null
    ? (inputTokens*config.inputPricePerMillion+outputTokens*config.outputPricePerMillion)/1_000_000 : null;
  return {text,provider:config.provider,model:config.model,durationMs:Date.now()-start,inputTokens,outputTokens,cachedTokens,
    estimatedCostUsd,priceVerifiedAt:config.priceVerifiedAt,priceExpired};
}
