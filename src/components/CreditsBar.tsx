// StrategInsta — Barra de Créditos
import React from 'react';
import { Sparkles, AlertTriangle, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlanType } from '@/types/plans';
import { PLANS } from '@/types/plans';

interface CreditsBarProps {
  planType: PlanType;
  strategiesUsed: number;
  strategiesLimit: number;
  strategiesRemaining: number;
  alertLevel: 'none' | 'half' | 'last' | 'blocked';
  onUpgrade: () => void;
}

export const CreditsBar: React.FC<CreditsBarProps> = ({
  planType,
  strategiesUsed,
  strategiesLimit,
  strategiesRemaining,
  alertLevel,
  onUpgrade,
}) => {
  const plan = PLANS[planType];
  const pct = Math.min(100, Math.round((strategiesUsed / strategiesLimit) * 100));

  // ─── Cores e mensagens por nível de alerta ────────────────────────────────

  const config = {
    none: {
      bar: 'status-success',
      bg: 'status-success-bg',
      icon: <Sparkles className="w-4 h-4" />,
      message:
        planType === 'free'
          ? `${strategiesRemaining} de ${strategiesLimit} estratégias gratuitas restantes`
          : `${strategiesRemaining} estratégias restantes este mês`,
    },
    half: {
      bar: 'status-warning',
      bg: 'status-warning-bg',
      icon: <AlertTriangle className="w-4 h-4" />,
      message: `Metade dos créditos usados — ${strategiesRemaining} estratégias restantes`,
    },
    last: {
      bar: 'status-caution',
      bg: 'status-caution-bg',
      icon: <AlertTriangle className="w-4 h-4" />,
      message:
        planType === 'free'
          ? '⚠️ Esta é sua última estratégia gratuita. Assine para continuar criando.'
          : '⚠️ Último crédito do mês. Considere fazer upgrade.',
    },
    blocked: {
      bar: 'status-danger',
      bg: 'status-danger-bg',
      icon: <XCircle className="w-4 h-4" />,
      message:
        planType === 'free'
          ? 'Você usou todas as estratégias gratuitas. Assine para continuar.'
          : 'Limite mensal atingido. Faça upgrade para continuar.',
    },
  }[alertLevel];

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${config.bg}`}>
      {/* Ícone + mensagem */}
      <span className={`flex items-center gap-1.5 flex-1 font-medium`}>
        {config.icon}
        {config.message}
      </span>

      {/* Barra de progresso */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: `hsl(var(--status-${alertLevel === 'none' ? 'success' : alertLevel === 'half' ? 'warning' : alertLevel === 'last' ? 'caution' : 'danger'}))`,
            }}
          />
        </div>
        <span className={`text-xs tabular-nums ${config.bg}`}>
          {strategiesUsed}/{strategiesLimit}
        </span>
      </div>

      {/* Badge do plano */}
      <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-foreground/10 text-foreground/60">
        {plan.name}
      </span>

      {/* Botão de upgrade (só para free ou alertas altos) */}
      {(planType === 'free' || alertLevel === 'last' || alertLevel === 'blocked') && (
        <Button
          size="sm"
          onClick={onUpgrade}
          variant="gradient"
          className="shrink-0 h-7 px-3 text-xs"
        >
          <Zap className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  );
};
