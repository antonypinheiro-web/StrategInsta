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
      bar: 'bg-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: <Sparkles className="w-4 h-4" />,
      message:
        planType === 'free'
          ? `${strategiesRemaining} de ${strategiesLimit} estratégias gratuitas restantes`
          : `${strategiesRemaining} estratégias restantes este mês`,
    },
    half: {
      bar: 'bg-yellow-500',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: <AlertTriangle className="w-4 h-4" />,
      message: `Metade dos créditos usados — ${strategiesRemaining} estratégias restantes`,
    },
    last: {
      bar: 'bg-orange-500',
      bg: 'bg-orange-500/10 border-orange-500/20',
      text: 'text-orange-600 dark:text-orange-400',
      icon: <AlertTriangle className="w-4 h-4" />,
      message:
        planType === 'free'
          ? '⚠️ Esta é sua última estratégia gratuita. Assine para continuar criando.'
          : '⚠️ Último crédito do mês. Considere fazer upgrade.',
    },
    blocked: {
      bar: 'bg-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
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
      <span className={`flex items-center gap-1.5 flex-1 font-medium ${config.text}`}>
        {config.icon}
        {config.message}
      </span>

      {/* Barra de progresso */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs tabular-nums ${config.text}`}>
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
          className="shrink-0 h-7 px-3 text-xs bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white border-0"
        >
          <Zap className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  );
};
