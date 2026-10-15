import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';
import { copyText } from '@/lib/content-text';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> { getText: () => string; label?: string; ariaLabel?: string; }

export function CopyButton({ getText, label = 'Copiar', ariaLabel, size = 'sm', variant = 'outline', ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 2000); return () => window.clearTimeout(timer); }, [copied]);
  return <Button {...props} size={size} variant={variant} aria-label={ariaLabel ?? label} onClick={async () => {
    try { await copyText(getText()); setCopied(true); } catch (reason) { toast.error(reason instanceof Error ? reason.message : 'Não foi possível copiar.'); }
  }}>{copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}{copied ? 'Copiado' : label}</Button>;
}
