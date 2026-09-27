import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  description,
  label,
  placeholder,
  initialValue = '',
  confirmText = 'Salvar',
  cancelText = 'Cancelar',
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitting = React.useRef(false);

  useEffect(() => {
    setInputValue(initialValue);
    setSubmitError(null);
  }, [initialValue, isOpen]);

  const submit = async (action: () => void | Promise<void>) => {
    if (submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await action();
      onClose();
    } catch (error) {
      // Capture only the error category, never the strategy or session payload.
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN';
      console.warn('[strategy-completion]', code);
      setSubmitError('Não foi possível concluir. Tente novamente. Seus dados continuam aqui.');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !submitting.current && !onCancel) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]" hideClose={!!onCancel || isSubmitting}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label htmlFor="input-field">
              {label}
            </Label>
            <Input
              id="input-field"
              value={inputValue}
              disabled={isSubmitting}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder}
              className="w-full"
            />
          </div>
        </div>
        {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={isSubmitting} onClick={() => onCancel ? void submit(onCancel) : onClose()}>
            {cancelText}
          </Button>
          <Button onClick={() => void submit(() => onConfirm(inputValue.trim()))} disabled={isSubmitting || !inputValue.trim()}>
            {isSubmitting ? 'Salvando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
