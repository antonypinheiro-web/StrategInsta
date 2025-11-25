import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Se o usuário já estiver logado, redireciona para a página principal
        navigate('/');
      }
    });

    // Limpa o listener quando o componente é desmontado
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-lg border border-border">
        <h2 className="text-3xl font-bold text-center text-foreground mb-6">Bem-vindo ao StrategInsta</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Não estamos usando provedores de terceiros (Google, Facebook) por enquanto
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
          theme="light" // Usando o tema claro
          redirectTo={window.location.origin} // Redireciona para a raiz após login/cadastro
        />
      </div>
    </div>
  );
}