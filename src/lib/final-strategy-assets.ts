import type { UserInput, GeneratedStrategy } from '../types';

type FinalKey = 'contentTable' | 'editorialCalendar' | 'actionPlan';
type Generators = { [K in FinalKey]: (input: UserInput, strategy: Partial<GeneratedStrategy>) => Promise<GeneratedStrategy[K]> };

export async function generateFinalStrategyAssets(
  input: UserInput,
  reviewed: Partial<GeneratedStrategy>,
  generators: Generators,
  onProgress: (strategy: Partial<GeneratedStrategy>) => void,
  isCancelled: () => boolean,
) {
  const current = { ...reviewed };
  for (const key of ['contentTable', 'editorialCalendar', 'actionPlan'] as const) {
    if (isCancelled()) throw new Error('Geração interrompida.');
    if (current[key]) continue;
    const result = await generators[key](input, { ...current });
    if (isCancelled()) throw new Error('Geração interrompida.');
    Object.assign(current, { [key]: result });
    onProgress({ ...current });
  }
  return current as GeneratedStrategy;
}
