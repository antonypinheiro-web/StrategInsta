// StrategInsta — Modal de Planos e Upgrade
import React, { useState } from 'react';
import { Check, Zap, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { PlanType } from '@/types/plans';
import { PLANS, PLAN_ORDER } from '@/types/plans';
import { createCheckoutSession } from '@/services/stripeService';

interface PlansModalProps {
  open: boolean;
  currentPlan: PlanType;
  onClose: () => void;
  onSelectPlan?: (plan: PlanType, billing: 'monthly' | 'yearly') => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  open,
  currentPlan,
  onClose,
  onSelectPlan,
}) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const { toast } = useToast();

  const handleSelectPlan = async (planId: PlanType) => {
    if (planId === 'free') return;
    if (onSelectPlan) { onSelectPlan(planId, billing); return; }

    setLoadingPlan(planId);
    try {
      const interval = billing === 'monthly' ? 'month' : 'year';
      await createCheckoutSession(planId as 'individual' | 'professional' | 'agency', interval);
    } catch (err) {
      toast({
        title: 'Erro ao abrir checkout',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
      setLoadingPlan(null);
    }
  };

  if (!open) return null;

  const yearlyDiscount = (plan: PlanType) => {
    const p = PLANS[plan];
    if (p.price === 0) return 0;
    const yearlyMonthly = p.price * 12;
    return Math.round(((yearlyMonthly - p.yearlyPrice) / yearlyMonthly) * 100);
  };

  const displayPrice = (plan: PlanType) => {
    const p = PLANS[plan];
    if (p.price === 0) return 'Grátis';
    if (billing === 'yearly') {
      return `R$${Math.round(p.yearlyPrice / 12)}/mês`;
    }
    return `R$${p.price}/mês`;
  };

  const displayBilledAs = (plan: PlanType) => {
    const p = PLANS[plan];
    if (p.price === 0 || billing === 'monthly') return null;
    return `cobrado R$${p.yearlyPrice}/ano`;
  };

  const featureList = (plan: PlanType) => {
    const p = PLANS[plan];
    const items: { label: string; included: boolean }[] = [
      {
        label:
          plan === 'free'
            ? '2 estratégias (vitalício)'
            : `${p.strategiesPerMonth} estratégias/mês`,
        included: true,
      },
      {
        label:
          p.refinementsPerStrategy === -1
            ? 'Refinamentos ilimitados'
            : `${p.refinementsPerStrategy} refinamentos por estratégia`,
        included: true,
      },
      {
        label:
          p.profileSlots === -1
            ? 'Clientes ilimitados'
            : `Até ${p.profileSlots} perfil${p.profileSlots > 1 ? 'is' : ''}`,
        included: true,
      },
      {
        label:
          p.historyDays === -1
            ? 'Histórico ilimitado'
            : `Histórico por ${p.historyDays} dias`,
        included: true,
      },
      { label: 'Export PDF e texto', included: p.price > 0 },
      { label: 'White-label no export', included: p.whiteLabel },
      { label: 'Acesso à API', included: p.apiAccess },
      { label: 'Suporte prioritário', included: p.prioritySupport },
      { label: 'Modelo IA premium (GPT-4.1)', included: p.premiumModel },
    ];
    return items;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-1">Escolha seu plano</h2>
          <p className="text-white/80 text-sm">
            Estratégias personalizadas por IA para o seu Instagram
          </p>

          {/* Toggle mensal/anual */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setBilling('monthly')}
              className={`text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'text-white' : 'text-white/50'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                billing === 'yearly' ? 'bg-white' : 'bg-white/30'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-purple-600 transition-transform ${
                  billing === 'yearly' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`text-sm font-medium transition-colors ${
                billing === 'yearly' ? 'text-white' : 'text-white/50'
              }`}
            >
              Anual
              <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full font-bold">
                -30%
              </span>
            </button>
          </div>
        </div>

        {/* Cards de planos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {PLAN_ORDER.map(planId => {
            const p = PLANS[planId];
            const isCurrent = planId === currentPlan;
            const isPopular = p.badge === 'Mais popular';
            const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(currentPlan);

            return (
              <div
                key={planId}
                className={`relative flex flex-col rounded-xl border p-5 transition-all ${
                  isPopular
                    ? 'border-purple-500 shadow-lg shadow-purple-500/10'
                    : 'border-border'
                } ${isCurrent ? 'bg-primary/5' : 'bg-card hover:border-purple-400'}`}
              >
                {/* Badge */}
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    Seu plano atual
                  </span>
                )}

                {/* Nome e preço */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                  <p className="text-xs text-foreground/50 mb-3">{p.description}</p>
                  <p className="text-3xl font-extrabold text-foreground">
                    {displayPrice(planId)}
                  </p>
                  {displayBilledAs(planId) && (
                    <p className="text-xs text-foreground/40 mt-0.5">{displayBilledAs(planId)}</p>
                  )}
                  {billing === 'yearly' && p.price > 0 && (
                    <p className="text-xs text-emerald-500 font-medium mt-1">
                      Economia de {yearlyDiscount(planId)}% ao ano
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2 mb-5">
                  {featureList(planId).map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-xs ${
                        f.included ? 'text-foreground/80' : 'text-foreground/30 line-through'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          f.included ? 'text-emerald-500' : 'text-foreground/20'
                        }`}
                      />
                      {f.label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(planId)}
                  disabled={isCurrent || isDowngrade || planId === 'free' || loadingPlan !== null}
                  className="w-full text-sm font-semibold"
                  variant={isPopular && !isCurrent ? 'gradient' : 'outline'}
                >
                  {loadingPlan === planId ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Abrindo...</>
                  ) : isCurrent ? 'Plano atual'
                    : isDowngrade ? 'Downgrade'
                    : planId === 'free' ? 'Grátis'
                    : (
                      <><Zap className="w-3.5 h-3.5 mr-1.5" />Assinar {p.name}</>
                    )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-foreground/40">
            Pagamento seguro via Stripe · Cancele a qualquer momento · Sem taxas ocultas
          </p>
        </div>
      </div>
    </div>
  );
};
