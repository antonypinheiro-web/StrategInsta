import { Button } from '@/components/ui/button';
import type { CalendarDay } from '@/types';
import type { GeneratedContent } from '@/types/workspace';
import { FORMAT_NAMES } from '@/lib/content-text';
import { calendarFormat } from './workspace-model';
import { CopyButton } from './CopyButton';
import { CostButton, ManualEditor } from './WorkspaceControls';

const dayText = (day: CalendarDay) => [`Dia ${day.day} (${day.weekday})`, `Formato: ${formatName(day.contentType)}`, `Ideia: ${day.topic}`, day.caption && `Legenda: ${day.caption}`, day.hashtags?.length ? day.hashtags.join(' ') : ''].filter(Boolean).join('\n');
const formatName = (value: string) => { const format = calendarFormat(value); return format ? FORMAT_NAMES[format] : value; };

interface CalendarPanelProps {
  calendar: CalendarDay[]; scripts: GeneratedContent[]; busy?: boolean;
  onCreate: (day: CalendarDay) => void;
  onSaveDay: (day: CalendarDay, values: Record<string, string>) => Promise<void>;
  /** Generates the calendar alone, for strategies saved before the final stage. */
  onGenerate?: () => Promise<unknown>;
}

/** 30 days in compact rows grouped by week: format, idea, production status and actions on the row itself. */
export function CalendarPanel({ calendar, scripts, busy, onCreate, onSaveDay, onGenerate }: CalendarPanelProps) {
  if (!calendar.length) return <div className="space-y-3 rounded-xl border p-5"><p className="text-sm text-muted-foreground">Esta estratégia ainda não tem o calendário de 30 dias. Ele usa o seu briefing, a matriz e as oportunidades escolhidas.</p>{onGenerate && <CostButton credits={5} busy={busy} onClick={() => { void onGenerate().catch(() => undefined); }}>Gerar calendário de 30 dias</CostButton>}</div>;
  const weeks = Array.from({ length: Math.ceil(calendar.length / 7) }, (_, index) => calendar.filter(day => Math.ceil(day.day / 7) === index + 1));
  const contentFor = (day: CalendarDay) => [...scripts].reverse().find(script => script.origin.kind === 'calendar' && script.origin.id === `calendar-day-${day.day}`);
  return <section className="space-y-5" aria-label="Calendário de 30 dias">
    <div><p className="text-xs font-medium uppercase tracking-wider text-primary">Sugestão do app para o mês</p><h2 className="mt-2 text-2xl font-semibold">Calendário de 30 dias</h2><p className="mt-2 text-sm text-muted-foreground">Cada dia traz o formato e a ideia. "Criar conteúdo" gera o storyboard já no formato do dia.</p></div>
    {weeks.filter(week => week.length).map((week, index) => <div key={index} className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Semana {index + 1}</h3>
      <ul className="space-y-2">{week.map(day => {
        const content = contentFor(day);
        return <li key={day.day} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <div className="w-20 shrink-0 text-sm"><p className="font-semibold">Dia {day.day}</p><p className="text-xs text-muted-foreground">{day.weekday}</p></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{formatName(day.contentType)}</span>{content && <span className={`rounded-full px-2 py-0.5 font-medium ${content.status === 'posted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{content.status === 'posted' ? 'Postado' : 'Gerado'}</span>}</div>
            <p className="mt-1 text-sm font-medium">{day.topic}</p>
            {day.caption && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{day.caption}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <Button size="sm" variant={content ? 'outline' : 'secondary'} disabled={busy} onClick={() => onCreate(day)}>{content ? 'Abrir conteúdo' : 'Criar conteúdo'}</Button>
            <CopyButton variant="ghost" label="" ariaLabel={`Copiar dia ${day.day}`} getText={() => dayText(day)} />
            <ManualEditor title={`Editar dia ${day.day}`} disabled={busy} fields={[{ key: 'topic', label: 'Ideia', value: day.topic, maxLength: 500 }, { key: 'caption', label: 'Orientação da legenda', value: day.caption, maxLength: 2200 }]} onSave={values => onSaveDay(day, values)} />
          </div>
        </li>;
      })}</ul>
    </div>)}
  </section>;
}
