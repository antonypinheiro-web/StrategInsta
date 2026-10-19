import type { ActionPlanItem } from '@/types';
import { CostButton, ManualEditor } from './WorkspaceControls';

const PRIORITY = { high: { label: 'Alta', className: 'bg-red-500/10 text-red-600 dark:text-red-400' }, medium: { label: 'Média', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' }, low: { label: 'Baixa', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' } } as const;

interface ActionPlanPanelProps {
  plan: ActionPlanItem[]; busy?: boolean;
  onSaveTask: (week: number, index: number, values: Record<string, string | boolean>) => Promise<void>;
  /** Generates the plan alone, for strategies saved before the final stage. */
  onGenerate?: () => Promise<unknown>;
}

/** Weekly tasks with edit and "done" on the task itself. */
export function ActionPlanPanel({ plan, busy, onSaveTask, onGenerate }: ActionPlanPanelProps) {
  if (!plan.length) return <div className="space-y-3 rounded-xl border p-5"><p className="text-sm text-muted-foreground">Esta estratégia ainda não tem o plano de ação de 4 semanas.</p>{onGenerate && <CostButton credits={3} busy={busy} onClick={() => { void onGenerate().catch(() => undefined); }}>Gerar plano de ação</CostButton>}</div>;
  const total = plan.reduce((sum, week) => sum + week.tasks.length, 0);
  const done = plan.reduce((sum, week) => sum + week.tasks.filter(task => task.completed).length, 0);
  return <section className="space-y-5" aria-label="Plano de ação">
    <div><p className="text-xs font-medium uppercase tracking-wider text-primary">O que fazer em cada semana</p><h2 className="mt-2 text-2xl font-semibold">Plano de ação</h2><p className="mt-2 text-sm text-muted-foreground">{done} de {total} tarefas concluídas.</p></div>
    {plan.map(week => <div key={week.week} className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Semana {week.week}</h3>
      <ul className="space-y-2">{week.tasks.map((task, index) => {
        const priority = PRIORITY[task.priority] ?? PRIORITY.medium;
        return <li key={index} className={`flex items-start gap-3 rounded-xl border bg-card p-3 ${task.completed ? 'opacity-70' : ''}`}>
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]" checked={!!task.completed} disabled={busy} aria-label={`Marcar "${task.task}" como concluída`} onChange={event => void onSaveTask(week.week, index, { completed: event.target.checked })} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.task}</p><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priority.className}`}>{priority.label}</span></div>
            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
          </div>
          <ManualEditor title="Editar tarefa" disabled={busy} fields={[{ key: 'task', label: 'Tarefa', value: task.task, maxLength: 300 }, { key: 'description', label: 'Como fazer', value: task.description, maxLength: 2500 }]} onSave={values => onSaveTask(week.week, index, values)} />
        </li>;
      })}</ul>
    </div>)}
  </section>;
}
