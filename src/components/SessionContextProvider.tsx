import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';
import { trackUsageEvent } from '@/services/usageService';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location); // Armazena a referência da localização

  // Atualiza a referência da localização sempre que a localização muda
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    let disposed = false;
    let previousUserId: string | null = null;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    // INITIAL_SESSION delivers the initial state through this same subscription.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (disposed) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setIsLoading(false);

        if (event === 'SIGNED_IN' && currentSession?.user?.id && currentSession.user.id !== previousUserId) {
          const timer = setTimeout(() => {
            timers.delete(timer);
            if (!disposed) void trackUsageEvent('login', 'auth', {
              provider: currentSession.user.app_metadata?.provider ?? 'email',
            }, currentSession.user.id);
          }, 0);
          timers.add(timer);
        }
        previousUserId = currentSession?.user.id ?? null;

        // Re-verificar o caminho atual no momento do evento usando a referência
        const pathOnEvent = locationRef.current.pathname;
        const isLoginPageOnEvent = pathOnEvent === '/login';

        if (currentSession && isLoginPageOnEvent) {
          navigate('/app', { replace: true });
        } else if (!currentSession && !isLoginPageOnEvent) {
          navigate('/login', { replace: true });
        }
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, [navigate]); // Removido location.pathname das dependências para evitar re-execuções desnecessárias

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
