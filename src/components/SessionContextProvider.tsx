import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Começa como true
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let authListener: any = null; // Para armazenar a inscrição do listener

    const initializeAuth = async () => {
      // 1. Buscar a sessão inicial
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsLoading(false); // O carregamento inicial está completo

      // 2. Lidar com a navegação inicial com base na sessão
      const isLoginPage = location.pathname === '/login';
      if (initialSession && isLoginPage) {
        navigate('/', { replace: true }); // Usar replace para evitar problemas com o botão 'voltar'
      } else if (!initialSession && !isLoginPage) {
        navigate('/login', { replace: true }); // Usar replace
      }

      // 3. Configurar o listener para futuras mudanças no estado de autenticação
      authListener = supabase.auth.onAuthStateChange((event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // Re-verificar o caminho atual no momento do evento
        const isLoginPageOnEvent = location.pathname === '/login'; 

        if (currentSession && isLoginPageOnEvent) {
          navigate('/', { replace: true });
        } else if (!currentSession && !isLoginPageOnEvent) {
          navigate('/login', { replace: true });
        }
      });
    };

    initializeAuth();

    return () => {
      // Limpar o listener quando o componente for desmontado
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, location.pathname]); // Dependências: navigate e location.pathname

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Verificando sessão..." />
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

// Hook para consumir o contexto da sessão
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};