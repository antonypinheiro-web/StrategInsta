import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/adminService';

export function AccountViewSwitch({ current, compact = false }: { current: 'user' | 'admin'; compact?: boolean }) {
  const { user } = useSession();
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (current === 'admin' || !user?.id) return;
    let disposed = false;
    setVerifiedUserId(null);
    void adminService.me().then(({ admin }) => {
      if (!disposed && admin.user_id === user.id && admin.active && admin.role === 'admin') {
        setVerifiedUserId(user.id);
      }
    }).catch(() => {
      if (!disposed) setVerifiedUserId(null);
    });
    return () => { disposed = true; };
  }, [current, user?.id]);

  // Navigation only: every admin operation still checks membership on the server.
  if (!user || (current === 'user' && verifiedUserId !== user.id)) return null;

  return (
    <div className={compact ? 'text-sm' : 'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm'}>
      {!compact && <div>
        <p className="font-medium">{current === 'user' ? 'App do usuário' : 'Área administrativa'}</p>
        <p className="text-xs text-muted-foreground">
          {current === 'user' ? 'Seu plano e seus créditos continuam valendo normalmente.' : 'Teste o app com seu plano e o mesmo login.'}
        </p>
      </div>}
      <Button asChild variant="outline" size="sm">
        <a href={current === 'user' ? '/admin' : '/app'} target="_blank" rel="noopener noreferrer">
          {current === 'user' ? 'Abrir painel admin' : 'Usar app como usuário'}
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </Button>
    </div>
  );
}
