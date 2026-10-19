import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUTH_PT_BR } from '@/lib/auth-pt-br';
import { clearRecovery, markRecovery, recoveryPending } from '@/lib/auth-recovery';
import logo from '@/assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(recoveryPending);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { markRecovery(); setRecovery(true); return; }
      // During recovery the user is signed in by the link but must set the new password first.
      if (session && !recoveryPending()) navigate('/app');
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-lg border border-border">
        <div className="flex flex-col items-center text-center mb-6 space-y-2">
          <img src={logo} alt="Logo" className="h-16 w-auto logo-theme-aware" />
          <p className="text-lg font-semibold text-foreground">{recovery ? 'Criar nova senha' : 'Bem-vindo'}</p>
        </div>
        {recovery ? <NewPasswordForm onDone={() => { clearRecovery(); setRecovery(false); navigate('/app'); }} /> : <>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            localization={AUTH_PT_BR}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--secondary))',
                    brandButtonText: 'hsl(var(--primary-foreground))',
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    anchorTextColor: 'hsl(var(--primary))',
                    anchorTextHoverColor: 'hsl(var(--secondary))',
                  },
                },
              },
            }}
            theme="light"
            // Confirmation and recovery links come back to /login, where the recovery step lives.
            redirectTo={`${window.location.origin}/login`}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">Se aparecer "Invalid login credentials", o e-mail ou a senha não conferem. Use "Esqueci minha senha" para criar uma nova.</p>
        </>}
      </div>
    </div>
  );
}

function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('As duas senhas não são iguais.'); return; }
    setSaving(true); setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) { setError('Não foi possível salvar. O link pode ter expirado: peça um novo em "Esqueci minha senha".'); return; }
    toast.success('Senha atualizada. Use a nova senha nos próximos acessos.');
    onDone();
  };
  return <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save(); }}>
    <p className="text-sm text-muted-foreground">Escolha a senha que você vai usar para entrar no app.</p>
    <label className="block space-y-1.5 text-sm"><span className="font-medium">Nova senha</span><Input type="password" autoComplete="new-password" autoCapitalize="none" value={password} onChange={event => setPassword(event.target.value)} /></label>
    <label className="block space-y-1.5 text-sm"><span className="font-medium">Repita a nova senha</span><Input type="password" autoComplete="new-password" autoCapitalize="none" value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Salvando...' : 'Salvar nova senha'}</Button>
  </form>;
}
