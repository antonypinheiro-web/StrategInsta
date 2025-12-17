import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location); // Armazena a referência da localização

  // Atualiza a referência da localização sempre que a localização muda
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    let authListener: any = null;

    const initializeAuth = async () => {
      // 1. Buscar a sessão inicial
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setIsLoading(false); // O carregamento inicial está completo

      // 2. Lidar com a navegação inicial com base na sessão
      const currentPath = locationRef.current.pathname; // Usa a referência para o caminho atual
      const isLoginPage = currentPath === '/login';

      if (initialSession && isLoginPage) {
        navigate('/', { replace: true });
      } else if (!initialSession && !isLoginPage) {
        navigate('/login', { replace: true });
      }

      // 3. Configurar o listener para futuras mudanças no estado de autenticação
      authListener = supabase.auth.onAuthStateChange((event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // Re-verificar o caminho atual no momento do evento usando a referência
        const pathOnEvent = locationRef.current.pathname; 
        const isLoginPageOnEvent = pathOnEvent === '/login'; 

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