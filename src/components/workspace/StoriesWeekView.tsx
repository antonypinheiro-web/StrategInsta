import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentFeedback, ContentOrigin, StoriesDay, StoriesWeek, StoryFrame } from '@/types/workspace';
import { storiesDayToText, storyToText } from '@/lib/content-text';
import { CopyButton } from './CopyButton';
import { FeedbackButton, ManualEditor } from './WorkspaceControls';

const goalLabels = { retain: 'Reter', engage: 'Engajar', convert: 'Converter' };
const storyFormatLabels = { video: 'Vídeo', photo: 'Foto', text: 'Tela de texto' };
const upperFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const dayTab = (value: string) => upperFirst(new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).replace('.', ''));
const dayTitle = (value: string) => upperFirst(new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }));
const localToday = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };

interface StoriesWeekViewProps {
  week: StoriesWeek; unavailable?: boolean;
  onOpenGenerator: (origin: ContentOrigin, item: StoryFrame | StoriesDay | StoriesWeek) => void;
  onEdit: (origin: ContentOrigin, story: StoryFrame) => Promise<void>;
  onFeedback?: (feedback: ContentFeedback) => Promise<void>;
}

/** One day at a time: tabs for the week, compact stories that expand into the full script. */
export function StoriesWeekView({ week, unavailable, onOpenGenerator, onEdit, onFeedback }: StoriesWeekViewProps) {
  const initialDay = useMemo(() => week.days.find(day => day.date === localToday())?.id ?? week.days.find(day => day.stories.length)?.id ?? week.days[0]?.id, [week]);
  const [selected, setSelected] = useState(initialDay);
  const [expanded, setExpanded] = useState<string>();
  useEffect(() => { setSelected(current => week.days.some(day => day.id === current) ? current : initialDay); }, [week, initialDay]);
  const day = week.days.find(item => item.id === selected) ?? week.days[0];
  if (!day) return null;
  return <div className="space-y-4">
    <div role="tablist" aria-label="Dias da semana" className="flex gap-2 overflow-x-auto pb-1">
      {week.days.map(item => <button key={item.id} type="button" role="tab" aria-selected={item.id === day.id} onClick={() => { setSelected(item.id); setExpanded(undefined); }}
        className={`shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${item.id === day.id ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-muted/40'}`}>
        <span className="block">{dayTab(item.date)}</span>
        <span className="block text-xs font-normal text-muted-foreground">{item.stories.length ? `${item.stories.length} ${item.stories.length === 1 ? 'story' : 'stories'}` : item.requestedCount ? 'a gerar' : 'livre'}</span>
      </button>)}
    </div>
    <article role="tabpanel" className="rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold">{dayTitle(day.date)}</h4>
        {day.stories.length > 0 && <div className="flex flex-wrap gap-2">
          <CopyButton label="Copiar o dia" getText={() => storiesDayToText(day)} />
          <Button size="sm" variant="ghost" disabled={unavailable} onClick={() => onOpenGenerator({ kind: 'day', id: day.id, weekId: week.id, dayId: day.id }, day)}>Ajustar este dia</Button>
        </div>}
      </div>
      {day.stories.length ? <ol className="mt-4 space-y-2">{day.stories.map(story => {
        const origin: ContentOrigin = { kind: 'story', id: story.id, weekId: week.id, dayId: day.id };
        const open = expanded === story.id;
        return <li key={story.id} className="rounded-lg border bg-card">
          <div className="flex items-start gap-3 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{story.position}</span>
            <button type="button" className="min-w-0 flex-1 text-left" aria-expanded={open} onClick={() => setExpanded(open ? undefined : story.id)}>
              <span className="flex flex-wrap gap-1.5 text-[11px] font-medium uppercase tracking-wide">
                <span className="text-primary">{goalLabels[story.goal]}</span>
                <span className="text-muted-foreground">· {storyFormatLabels[story.format ?? 'video']}</span>
                {story.tool && story.tool !== 'nenhum' && <span className="normal-case text-muted-foreground">· {story.tool}</span>}
              </span>
              <span className="mt-1 line-clamp-2 block text-sm">{story.narrative}</span>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <CopyButton variant="ghost" label="" ariaLabel={`Copiar story ${story.position}`} getText={() => storyToText(story)} />
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={open ? 'Recolher roteiro' : 'Ver roteiro'} onClick={() => setExpanded(open ? undefined : story.id)}><ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></Button>
            </div>
          </div>
          {open && <div className="border-t p-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">{[['O que gravar', story.scene], ['Fala sugerida', story.speech], ['Texto na tela', story.onScreen], ['Recursos do Instagram', story.tool !== 'nenhum' ? story.tool : ''], ['Próximo passo', story.cta], ['Conexão com o feed', story.feedConnection]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{value}</dd></div>)}</dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={unavailable} onClick={() => onOpenGenerator(origin, story)}><Film className="mr-1 h-3.5 w-3.5" />Abrir no gerador</Button>
              <ManualEditor title={`Editar story ${story.position}`} disabled={unavailable} fields={[{ key: 'scene', label: 'Cena', value: story.scene, maxLength: 1500 }, { key: 'speech', label: 'Fala', value: story.speech, maxLength: 1500, required: false }, { key: 'onScreen', label: 'Texto na tela', value: story.onScreen, maxLength: 300, required: false }]} onSave={values => onEdit(origin, { ...story, ...values })} />
              <FeedbackButton contentId={story.id} versionId={story.versionId} disabled={unavailable} onFeedback={onFeedback} />
            </div>
          </div>}
        </li>;
      })}</ol> : <p className="mt-3 text-sm text-muted-foreground">{day.requestedCount ? 'Este dia ainda não foi gerado. Sua rotina está preservada.' : 'Sem publicação planejada para este dia.'}</p>}
    </article>
  </div>;
}
