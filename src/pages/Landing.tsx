import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Zap, Instagram, Sparkles, Target, Calendar, TrendingUp, Users, BookOpen, ChevronDown, ChevronUp, ArrowRight, Star } from "lucide-react";
import { PLANS, PLAN_ORDER } from "@/types/plans";
import logo from "@/assets/logo.png";

// ─── Dados ────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Conta sobre o seu negócio",
    description: "Responde um chat rápido (menos de 3 minutos) com perguntas sobre seu nicho, público, produtos e objetivos.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    step: "02",
    title: "A IA cria sua estratégia",
    description: "Nossa IA analisa suas respostas e gera uma estratégia completa e personalizada — perfil de cliente, bio, calendário, plano de ação e mais.",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    step: "03",
    title: "Execute e cresça",
    description: "Você recebe um plano pronto para executar: o que postar, quando, como escrever a legenda e qual CTA usar.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
];

const FEATURES = [
  { icon: <Target className="w-6 h-6" />, title: "Perfil do Cliente Ideal", description: "Entenda profundamente quem é o seu cliente, o que ele sente, o que quer e como falar com ele." },
  { icon: <Instagram className="w-6 h-6" />, title: "Bio Otimizada", description: "4 opções de bio personalizadas para o seu nicho, com CTA estratégico para converter visitantes em seguidores." },
  { icon: <BookOpen className="w-6 h-6" />, title: "Estratégia de Stories", description: "Plano de 7 dias de stories com objetivo, tipo de conteúdo e dicas de execução para cada dia da semana." },
  { icon: <Calendar className="w-6 h-6" />, title: "Calendário de 30 Dias", description: "Cada dia com formato, tópico, legenda completa e hashtags. Chega de bloqueio criativo." },
  { icon: <TrendingUp className="w-6 h-6" />, title: "Ideias de Monetização", description: "Estratégias de receita personalizadas para o seu nicho, com projeção de preços e como apresentar suas ofertas." },
  { icon: <Zap className="w-6 h-6" />, title: "Plano de Ação Semanal", description: "4 semanas de tarefas priorizadas, adaptadas ao seu nível de experiência no Instagram." },
];

const PERSONAS = [
  {
    emoji: "👤",
    title: "Empreendedor",
    description: "Você tem um negócio incrível mas não tem tempo para planejar o Instagram. O StrategInsta faz isso por você em minutos.",
    cta: "Plano Individual a partir de R$47/mês",
  },
  {
    emoji: "📱",
    title: "Social Media Manager",
    description: "Você gerencia múltiplos clientes e precisa de eficiência. Entregue estratégias profissionais em fração do tempo.",
    cta: "Plano Professional a partir de R$97/mês",
    highlight: true,
  },
  {
    emoji: "🏢",
    title: "Agência de Marketing",
    description: "Escale sua produção sem escalar sua equipe. Estratégias ilimitadas para todos os seus clientes.",
    cta: "Plano Agency a partir de R$247/mês",
  },
];

const TESTIMONIALS = [
  {
    name: "Carla Mendes",
    role: "Confeiteira artesanal",
    avatar: "CM",
    text: "Eu gastava horas pensando no que postar e mesmo assim não tinha resultados. Com o StrategInsta, recebi um calendário completo de 30 dias em 3 minutos. Meu engajamento aumentou 40% no primeiro mês.",
    stars: 5,
  },
  {
    name: "Rafael Torres",
    role: "Social Media Manager",
    avatar: "RT",
    text: "Gerencio 8 clientes e o StrategInsta virou essencial. O que antes levava um dia inteiro de trabalho agora faço em 20 minutos. A qualidade das estratégias é impressionante — os clientes adoram.",
    stars: 5,
  },
  {
    name: "Ana Lucia Ferreira",
    role: "Coach de Carreira",
    avatar: "AL",
    text: "O diferencial é a personalização. Não é conteúdo genérico — é uma estratégia que entende o meu nicho, meu tom de voz e meus objetivos. Parece que foi feito por um estrategista humano.",
    stars: 5,
  },
];

const FAQS = [
  {
    question: "Preciso ter conhecimento de marketing para usar?",
    answer: "Não. O chat de onboarding guia você passo a passo com perguntas simples. Se você souber descrever o seu negócio, a IA cuida do resto.",
  },
  {
    question: "A estratégia realmente é personalizada para o meu negócio?",
    answer: "Sim. Cada estratégia é gerada a partir das suas respostas específicas — seu nicho, público, tom de voz, produtos e objetivos. Não usamos templates genéricos.",
  },
  {
    question: "Quanto tempo leva para gerar uma estratégia completa?",
    answer: "O chat de inputs leva cerca de 3 minutos. A geração da estratégia pela IA leva mais 2-3 minutos. No total, em menos de 5 minutos você tem tudo pronto.",
  },
  {
    question: "Posso usar para mais de um perfil do Instagram?",
    answer: "Sim. Os planos Professional e Agency permitem criar estratégias para múltiplos perfis/clientes. Cada estratégia gerada fica salva no seu histórico.",
  },
  {
    question: "Como funciona o plano gratuito?",
    answer: "O plano gratuito dá acesso a 2 estratégias completas, sem prazo de validade. Não precisa de cartão de crédito para começar.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim. Todos os planos pagos podem ser cancelados a qualquer momento, sem multa ou taxa de cancelamento.",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const goToApp = () => navigate("/login");

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={logo} alt="StrategInsta" className="h-8 w-auto logo-theme-aware" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={goToApp}>Entrar</Button>
            <Button size="sm" variant="gradient" onClick={goToApp}>
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Gradient blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-6 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Gemini AI + ChatGPT
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Sua estratégia completa{" "}
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              de Instagram
            </span>
            <br />em menos de 5 minutos
          </h1>

          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Para de perder horas tentando planejar o que postar. A IA do StrategInsta analisa
            o seu negócio e entrega um plano de conteúdo completo, personalizado e pronto para executar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Button size="lg" variant="gradient" onClick={goToApp}
              className="text-base px-8 h-13 shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 mr-2" />
              Criar minha estratégia grátis
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-base px-8 h-13">
              Como funciona
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Social proof numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { value: "7 seções", label: "de estratégia geradas" },
              { value: "30 dias", label: "de calendário editorial" },
              { value: "< 5 min", label: "para gerar tudo" },
              { value: "100%", label: "personalizado para você" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs text-foreground/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como Funciona ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-6 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-foreground/60 max-w-xl mx-auto">Simples, rápido e sem complicação. Três passos para você ter uma estratégia profissional.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="relative bg-card border border-border rounded-2xl p-8 text-center hover:border-purple-400 transition-colors">
                <div className="text-6xl font-black text-foreground/5 absolute top-4 right-6">{step.step}</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-5">
                  {step.icon}
                </div>
                <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">dominar o Instagram</span>
            </h2>
            <p className="text-foreground/60 max-w-xl mx-auto">Uma estratégia completa em 7 seções, cada uma gerada com IA e 100% personalizada para o seu negócio.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-elevated p-6 hover:border-purple-400 transition-all">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quem é ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Para quem é o StrategInsta?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PERSONAS.map((p, i) => (
              <div key={i} className={`rounded-2xl p-8 border transition-all ${p.highlight
                ? 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 text-white border-transparent shadow-xl shadow-purple-500/30'
                : 'bg-card border-border hover:border-purple-400'}`}>
                <div className="text-4xl mb-4">{p.emoji}</div>
                <h3 className={`font-bold text-xl mb-3 ${p.highlight ? 'text-white' : ''}`}>{p.title}</h3>
                <p className={`text-sm leading-relaxed mb-6 ${p.highlight ? 'text-white/80' : 'text-foreground/60'}`}>{p.description}</p>
                <p className={`text-xs font-semibold ${p.highlight ? 'text-white/70' : 'text-purple-600 dark:text-purple-400'}`}>{p.cta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ─────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos e preços</h2>
            <p className="text-foreground/60 mb-8">Comece grátis. Faça upgrade quando precisar de mais.</p>

            {/* Toggle mensal/anual */}
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1">
              <button onClick={() => setBilling("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billing === "monthly" ? "bg-card shadow text-foreground" : "text-foreground/50"}`}>
                Mensal
              </button>
              <button onClick={() => setBilling("yearly")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${billing === "yearly" ? "bg-card shadow text-foreground" : "text-foreground/50"}`}>
                Anual
                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-bold">-30%</span>
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLAN_ORDER.map((planId) => {
              const p = PLANS[planId];
              const isPopular = p.badge === "Mais popular";
              const monthlyPrice = billing === "yearly" && p.price > 0
                ? Math.round(p.yearlyPrice / 12)
                : p.price;

              return (
                <div key={planId} className={`relative flex flex-col rounded-2xl border p-6 ${isPopular
                  ? "border-purple-500 shadow-xl shadow-purple-500/10 bg-gradient-to-b from-purple-500/5 to-transparent"
                  : "border-border bg-card"}`}>
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                      Mais popular
                    </span>
                  )}

                  <div className="mb-5">
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-xs text-foreground/50 mb-3">{p.description}</p>
                    <div className="text-3xl font-extrabold">
                      {p.price === 0 ? "Grátis" : `R$${monthlyPrice}/mês`}
                    </div>
                    {billing === "yearly" && p.price > 0 && (
                      <p className="text-xs text-foreground/40 mt-0.5">cobrado R${p.yearlyPrice}/ano</p>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2 mb-6 text-sm">
                    {[
                      planId === "free" ? "2 estratégias (vitalício)" : `${p.strategiesPerMonth} estratégias/mês`,
                      p.refinementsPerStrategy === -1 ? "Refinamentos ilimitados" : `${p.refinementsPerStrategy} refinamentos`,
                      p.profileSlots === -1 ? "Clientes ilimitados" : `Até ${p.profileSlots} perfil${p.profileSlots > 1 ? "is" : ""}`,
                      ...(p.whiteLabel ? ["White-label no export"] : []),
                      ...(p.apiAccess ? ["Acesso à API"] : []),
                      ...(p.premiumModel ? ["Modelo IA premium"] : []),
                    ].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-foreground/70">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button onClick={goToApp}
                    variant={isPopular ? "gradient" : "outline"}
                    size="sm">
                    {p.price === 0 ? "Começar grátis" : `Assinar ${p.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que dizem nossos usuários</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-foreground/50">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm">{faq.question}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-foreground/40 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-foreground/40 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-foreground/60 leading-relaxed border-t border-border pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-12 shadow-2xl shadow-purple-500/20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Pronto para ter uma estratégia que realmente funciona?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Crie sua primeira estratégia grátis agora. Sem cartão de crédito.
            </p>
            <Button size="lg" onClick={goToApp}
              className="bg-white text-purple-600 hover:bg-white/90 font-bold text-base px-10 h-13 shadow-lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Começar grátis agora
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logo} alt="StrategInsta" className="h-7 w-auto logo-theme-aware" />
          <p className="text-sm text-foreground/40 text-center">
            Desenvolvido por{" "}
            <a href="https://www.instagram.com/antonypinheiro.eu" target="_blank" rel="noopener noreferrer"
              className="text-purple-500 hover:underline">
              Antony Pinheiro
            </a>{" "}
            · © {new Date().getFullYear()} StrategInsta
          </p>
          <div className="flex gap-4 text-sm text-foreground/40">
            <button onClick={goToApp} className="hover:text-foreground transition-colors">Entrar</button>
            <span>·</span>
            <button onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-foreground transition-colors">Planos</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
