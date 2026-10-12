import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// In-page replacement for window.prompt/confirm: embedded browsers (such as the desktop app pane)
// throw "prompt() is not supported", which silently aborted admin actions.
export interface AskField {
  name: string;
  label: string;
  defaultValue?: string;
  type?: 'text' | 'number' | 'textarea';
  options?: { value: string; label: string }[];
}
export interface AskOptions {
  title: string;
  description?: string;
  fields?: AskField[];
  confirmLabel?: string;
  destructive?: boolean;
}
type Pending = AskOptions & { resolve: (values: Record<string, string> | null) => void };

export function useAskDialog() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const pendingRef = useRef<Pending | null>(null);

  const ask = useCallback((options: AskOptions) => new Promise<Record<string, string> | null>(resolve => {
    pendingRef.current?.resolve(null);
    const next = { ...options, resolve };
    pendingRef.current = next;
    setValues(Object.fromEntries((options.fields ?? []).map(field => [field.name, field.defaultValue ?? field.options?.[0]?.value ?? ''])));
    setPending(next);
  }), []);

  const close = (result: Record<string, string> | null) => {
    pendingRef.current?.resolve(result);
    pendingRef.current = null;
    setPending(null);
  };

  const dialog = (
    <Dialog open={pending !== null} onOpenChange={open => { if (!open) close(null); }}>
      <DialogContent className="sm:max-w-md">
        {pending && (
          <form onSubmit={event => { event.preventDefault(); close(values); }} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{pending.title}</DialogTitle>
              {pending.description && <DialogDescription>{pending.description}</DialogDescription>}
            </DialogHeader>
            {(pending.fields ?? []).map((field, index) => {
              const id = `ask-${field.name}`;
              const common = { id, value: values[field.name] ?? '', autoFocus: index === 0 };
              return (
                <div key={field.name} className="space-y-1.5">
                  <label htmlFor={id} className="text-sm font-medium">{field.label}</label>
                  {field.options ? (
                    <select {...common} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))}>
                      {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <Textarea {...common} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />
                  ) : (
                    <Input {...common} type={field.type ?? 'text'} inputMode={field.type === 'number' ? 'numeric' : undefined} onChange={event => setValues(current => ({ ...current, [field.name]: event.target.value }))} />
                  )}
                </div>
              );
            })}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => close(null)}>Cancelar</Button>
              <Button type="submit" variant={pending.destructive ? 'destructive' : 'default'}>{pending.confirmLabel ?? 'Confirmar'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  return { ask, dialog };
}
