// "Uso" in the account menu: TPs spent per month and per kind of generation, from the generation history.
export const OPERATION_NAMES: Record<string, string> = {
  full_strategy: 'Estratégia completa', section: 'Seções da estratégia', monetization_plan: 'Plano de monetização',
  idea: 'Novas ideias', variation: 'Variações', refine_short: 'Ajustes rápidos', script: 'Conteúdos (storyboard)',
  stories_day: 'Stories do dia', stories_week: 'Stories da semana', attachment_ocr: 'Leitura de anexos',
};

interface GenerationLike { operation: string; status: string; credits: number; created_at: string }
export interface UsageSummary { month: string; total: number; count: number; byOperation: { name: string; credits: number; count: number }[] }

const monthKey = (value: string | Date) => { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };

/** Only completed generations count: failed or canceled ones return their TPs to the balance. */
export function summarizeUsage(generations: GenerationLike[], month: Date): UsageSummary {
  const key = monthKey(month);
  const done = generations.filter(item => item.status === 'completed' && monthKey(item.created_at) === key);
  const groups = new Map<string, { credits: number; count: number }>();
  for (const item of done) {
    const name = OPERATION_NAMES[item.operation] ?? 'Outras gerações';
    const group = groups.get(name) ?? { credits: 0, count: 0 };
    group.credits += Number(item.credits) || 0; group.count += 1; groups.set(name, group);
  }
  const byOperation = [...groups.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.credits - a.credits);
  return { month: key, total: byOperation.reduce((sum, item) => sum + item.credits, 0), count: done.length, byOperation };
}
