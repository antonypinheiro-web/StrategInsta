import { z } from 'zod';

const text = z.string().trim().min(1);
const contentItem = z.object({ type: text, description: text, example: text, frequency: text });
export const outputSchemas = {
  storiesStrategy: z.array(z.object({ dayOfWeek: text, objective: text, contentType: text, example: text, tips: text })).length(7),
  contentTable: z.object({ topOfFunnel: z.array(contentItem).min(3), middleOfFunnel: z.array(contentItem).min(3), bottomOfFunnel: z.array(contentItem).min(3) }),
  editorialCalendar: z.array(z.object({ day: z.number().int().min(1).max(30), weekday: text, contentType: text, topic: text, caption: text, hashtags: z.array(text).max(6), stories: z.array(text).optional() })).length(30).refine(days => new Set(days.map(day => day.day)).size === 30),
  actionPlan: z.array(z.object({ week: z.number().int().min(1).max(4), tasks: z.array(z.object({ task: text, description: text, priority: z.enum(['high', 'medium', 'low']), completed: z.boolean().optional() })).min(1) })).length(4).refine(weeks => new Set(weeks.map(week => week.week)).size === 4),
};

// Delimiters inside quoted JSON strings are content, not structure.
export function parseStrategyOutput<T>(raw: string, schema: z.ZodType<T>): T {
  try {
    const source = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? raw;
    const start = source.search(/[[{]/);
    if (start < 0) throw new Error();
    const stack: string[] = [];
    let quoted = false;
    let escaped = false;
    for (let i = start; i < source.length; i++) {
      const char = source[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quoted = false;
        continue;
      }
      if (char === '"') quoted = true;
      else if (char === '[' || char === '{') stack.push(char);
      else if (char === ']' || char === '}') {
        if (stack.pop() !== (char === ']' ? '[' : '{')) throw new Error();
        if (!stack.length) return schema.parse(JSON.parse(source.slice(start, i + 1)));
      }
    }
    throw new Error();
  } catch {
    throw new Error('A IA retornou uma seção incompleta ou inválida. Tente gerar esta etapa novamente.');
  }
}
