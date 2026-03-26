import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Send, SkipForward, X, Instagram, ChevronRight } from "lucide-react";
import type { UserInput, FunnelFocus, ProficiencyLevel, PostingFrequency } from "../types";
import { funnelOptions, proficiencyLevelOptions, postingFrequencyOptions } from "../types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  onStart: (data: UserInput) => void;
  initialValues?: UserInput | null;
  error?: string | null;
  isAuthenticated: boolean;
}

type QuestionType = 'text' | 'textarea' | 'select';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface ChatQuestion {
  id: keyof UserInput;
  block: number;
  blockName: string;
  question: string;
  subtext?: string;
  placeholder?: string;
  type: QuestionType;
  options?: SelectOption[];
  required: boolean;
  skippable?: boolean;
  prefix?: string;
}

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  isBlock?: boolean;
}

// ─── Perguntas do Chat ────────────────────────────────────────────────────────

const QUESTIONS: ChatQuestion[] = [
  // Bloco 1 — Sobre o Negócio
  {
    id: 'username',
    block: 1, blockName: 'Sobre o Negócio',
    question: 'Qual é o seu @ no Instagram?',
    subtext: 'Vou usar para personalizar sua estratégia.',
    placeholder: 'seuusername',
    type: 'text',
    required: true,
    prefix: '@',
  },
  {
    id: 'niche',
    block: 1, blockName: 'Sobre o Negócio',
    question: 'Qual é o nicho ou segmento do seu negócio?',
    subtext: 'Quanto mais específico, melhor a estratégia.',
    placeholder: 'Ex: Fitness para mães, confeitaria artesanal, marketing digital...',
    type: 'text',
    required: true,
  },
  {
    id: 'productsAndServices',
    block: 1, blockName: 'Sobre o Negócio',
    question: 'Quais são seus principais produtos ou serviços?',
    subtext: 'Liste o que você vende ou oferece.',
    placeholder: 'Ex: Curso de yoga online; Consultoria de marketing; E-book de receitas...',
    type: 'textarea',
    required: true,
  },

  // Bloco 2 — Posicionamento
  {
    id: 'brandVoice',
    block: 2, blockName: 'Posicionamento',
    question: 'Como você quer que as pessoas se sintam ao ver sua marca?',
    subtext: 'Descreva o tom de voz e a personalidade da sua comunicação.',
    placeholder: 'Ex: Inspirador e próximo, com humor leve. Ou: técnico e objetivo...',
    type: 'text',
    required: false,
    skippable: true,
  },
  {
    id: 'competitorsAndInspirations',
    block: 2, blockName: 'Posicionamento',
    question: 'Tem algum perfil de referência ou concorrente que admira?',
    subtext: 'Me ajuda a entender o estilo que você quer alcançar.',
    placeholder: 'Ex: @perfil_x (gosto da estética), @concorrente_y (quero ser diferente deles)...',
    type: 'text',
    required: false,
    skippable: true,
  },

  // Bloco 3 — Público-Alvo
  {
    id: 'audience',
    block: 3, blockName: 'Público-Alvo',
    question: 'Descreva seu cliente ideal — quem é essa pessoa?',
    subtext: 'Inclua idade, perfil, dores, desejos e sonhos.',
    placeholder: 'Ex: Mulheres de 28-40 anos, empreendedoras, que querem organizar a rotina e crescer no digital...',
    type: 'textarea',
    required: true,
  },

  // Bloco 4 — Conteúdo
  {
    id: 'contentPillars',
    block: 4, blockName: 'Conteúdo',
    question: 'Quais são os temas principais do seu conteúdo?',
    subtext: 'Os pilares que você sempre aborda, de 3 a 5 temas.',
    placeholder: 'Ex: Bem-estar, alimentação saudável, mindfulness, rotina produtiva...',
    type: 'text',
    required: false,
    skippable: true,
  },
  {
    id: 'existingContentInsights',
    block: 4, blockName: 'Conteúdo',
    question: 'O que já funcionou (ou não) no seu conteúdo?',
    subtext: 'Compartilhe insights sobre seus posts anteriores, se tiver.',
    placeholder: 'Ex: Reels curtos de dicas têm muito alcance. Textos longos não performam bem...',
    type: 'textarea',
    required: false,
    skippable: true,
  },
  {
    id: 'desiredPostingFrequency',
    block: 4, blockName: 'Conteúdo',
    question: 'Com que frequência você consegue postar no feed?',
    type: 'select',
    options: postingFrequencyOptions,
    required: true,
  },
  {
    id: 'availableResources',
    block: 4, blockName: 'Conteúdo',
    question: 'Quanto tempo por semana você dedica à criação de conteúdo?',
    placeholder: 'Ex: 3-4 horas por semana, um dia inteiro, pouco tempo...',
    type: 'text',
    required: false,
    skippable: true,
  },

  // Bloco 5 — Objetivos
  {
    id: 'goals',
    block: 5, blockName: 'Objetivos',
    question: 'Qual é o seu principal objetivo com o Instagram agora?',
    subtext: 'Seja específico — isso define toda a estratégia.',
    placeholder: 'Ex: Vender meu curso, construir autoridade, crescer para 10k seguidores...',
    type: 'text',
    required: true,
  },
  {
    id: 'funnelFocus',
    block: 5, blockName: 'Objetivos',
    question: 'Em qual etapa da jornada do cliente quero focar a estratégia?',
    type: 'select',
    options: funnelOptions,
    required: true,
  },
  {
    id: 'instagramProficiencyLevel',
    block: 5, blockName: 'Objetivos',
    question: 'Qual é o seu nível de experiência no Instagram?',
    subtext: 'Isso ajusta o plano de ação para o seu momento.',
    type: 'select',
    options: proficiencyLevelOptions,
    required: true,
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;

// ─── Estado inicial ───────────────────────────────────────────────────────────

const EMPTY_FORM: UserInput = {
  niche: '',
  audience: '',
  username: '',
  goals: '',
  funnelFocus: 'balanced',
  brandVoice: '',
  productsAndServices: '',
  existingContentInsights: '',
  competitorsAndInspirations: '',
  contentPillars: '',
  desiredPostingFrequency: '3x_semana',
  availableResources: '',
  instagramProficiencyLevel: 'intermediario',
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onStart,
  initialValues,
  error,
  isAuthenticated,
}) => {
  const [formData, setFormData] = useState<UserInput>({
    ...EMPTY_FORM,
    ...(initialValues ?? {}),
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = Math.round((currentIndex / TOTAL_QUESTIONS) * 100);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Init — primeira mensagem ────────────────────────────────────────────────

  useEffect(() => {
    const greeting: ChatMessage = {
      id: 'greeting',
      role: 'bot',
      content: '👋 Olá! Sou o assistente do StrategInsta.\n\nVou te fazer algumas perguntas para criar uma estratégia de conteúdo totalmente personalizada para o seu Instagram.\n\nSão rápidas — menos de 3 minutos. Vamos lá?',
    };
    setMessages([greeting]);

    setTimeout(() => {
      pushBotMessage(QUESTIONS[0]);
    }, 800);
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function pushBotMessage(question: ChatQuestion, prevBlock?: number) {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => {
        const next: ChatMessage[] = [];

        // Separador de bloco
        if (prevBlock === undefined || question.block !== prevBlock) {
          next.push({
            id: `block-${question.block}`,
            role: 'bot',
            content: `— Bloco ${question.block} de 5: **${question.blockName}**`,
            isBlock: true,
          });
        }

        next.push({
          id: `q-${question.id}`,
          role: 'bot',
          content: question.question + (question.subtext ? `\n\n_${question.subtext}_` : ''),
        });

        return [...prev, ...next];
      });
    }, 600);
  }

  function pushUserMessage(content: string) {
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content },
    ]);
  }

  function saveAnswer(questionId: keyof UserInput, value: string) {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  }

  function advance(answer: string, displayValue?: string) {
    const q = QUESTIONS[currentIndex];
    saveAnswer(q.id, answer);
    pushUserMessage(displayValue ?? answer);
    setInputValue('');

    const nextIndex = currentIndex + 1;

    if (nextIndex >= TOTAL_QUESTIONS) {
      // Todas as perguntas respondidas → arquivo opcional
      setCurrentIndex(nextIndex);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: 'files-msg',
            role: 'bot',
            content: '✅ Ótimo! Tenho tudo que preciso.\n\nSe quiser, você pode enviar arquivos de referência (briefing, identidade visual, posts anteriores...) para enriquecer ainda mais a estratégia. É opcional.',
          },
        ]);
        setShowFileUpload(true);
      }, 600);
    } else {
      setCurrentIndex(nextIndex);
      pushBotMessage(QUESTIONS[nextIndex], q.block);
    }
  }

  function handleSkip() {
    const q = QUESTIONS[currentIndex];
    saveAnswer(q.id, '');
    pushUserMessage('_(pulei esta pergunta)_');
    setInputValue('');

    const nextIndex = currentIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      setCurrentIndex(nextIndex);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: 'files-msg',
            role: 'bot',
            content: '✅ Perfeito! Tenho tudo que preciso.\n\nSe quiser, envie arquivos de referência para enriquecer a estratégia. Mas pode pular se preferir.',
          },
        ]);
        setShowFileUpload(true);
      }, 600);
    } else {
      setCurrentIndex(nextIndex);
      pushBotMessage(QUESTIONS[nextIndex], q.block);
    }
  }

  function handleTextSubmit() {
    const val = inputValue.trim();
    if (!val && currentQuestion?.required) return;
    if (!val && !currentQuestion?.required) {
      handleSkip();
      return;
    }
    advance(val);
  }

  function handleSelectOption(option: SelectOption) {
    advance(option.value, option.label);
  }

  function handleGenerate() {
    setIsDone(true);
    onStart(formData);
  }

  function handleSkipFiles() {
    setShowFileUpload(false);
    setIsDone(true);
    setMessages(prev => [
      ...prev,
      { id: 'u-skipfiles', role: 'user', content: '_(sem arquivos)_' },
      {
        id: 'ready',
        role: 'bot',
        content: '🚀 Tudo pronto! Clique em **Gerar Minha Estratégia** para criar seu plano personalizado.',
      },
    ]);
  }

  // ─── File handlers ───────────────────────────────────────────────────────────

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files)
      .filter(f => {
        const types = ['text/plain', 'text/markdown', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
        return types.includes(f.type) && f.size <= 2 * 1024 * 1024;
      })
      .slice(0, 5);
    setFormData(prev => ({ ...prev, files: valid }));
    setShowFileUpload(false);
    setIsDone(true);
    setMessages(prev => [
      ...prev,
      { id: 'u-files', role: 'user', content: `📎 ${valid.length} arquivo(s) enviado(s)` },
      {
        id: 'ready',
        role: 'bot',
        content: '🚀 Perfeito! Clique em **Gerar Minha Estratégia** para criar seu plano personalizado.',
      },
    ]);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const isSelectQuestion = currentQuestion?.type === 'select';
  const isSkippable = currentQuestion?.skippable && !currentQuestion?.required;
  const canSend = inputValue.trim().length > 0 || isSkippable;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col h-[90vh] max-h-[750px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">StrategInsta</p>
            <p className="text-white/70 text-xs">Assistente de Estratégia</p>
          </div>
          {currentIndex > 0 && (
            <div className="text-right">
              <p className="text-white/80 text-xs mb-1">{progress}% concluído</p>
              <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Mensagens ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.isBlock ? (
                <div className="w-full flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-foreground/40 font-medium whitespace-nowrap px-2">
                    {msg.content.replace('**', '').replace('**', '')}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              ) : (
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'bot'
                      ? 'bg-muted text-foreground rounded-tl-sm'
                      : 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-tr-sm'
                  }`}
                >
                  {msg.content
                    .split(/(\*\*.*?\*\*|_.*?_)/g)
                    .map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**'))
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                      if (part.startsWith('_') && part.endsWith('_'))
                        return <em key={i} className="opacity-70">{part.slice(1, -1)}</em>;
                      return part;
                    })}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
                <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Área de Input ── */}
        {!isTyping && (
          <div className="border-t border-border p-4 bg-card">

            {/* Select options */}
            {isSelectQuestion && currentQuestion && !showFileUpload && !isDone && (
              <div className="space-y-2 mb-2">
                {currentQuestion.options?.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-border hover:border-purple-500 hover:bg-purple-500/5 transition-all group flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      {opt.description && (
                        <p className="text-xs text-foreground/50 mt-0.5">{opt.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-purple-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* File upload */}
            {showFileUpload && (
              <div className="space-y-3">
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragOver ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-purple-400'
                  }`}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files); }}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 mx-auto mb-2 text-foreground/40" />
                  <p className="text-sm text-purple-500 font-medium">Clique para enviar arquivos</p>
                  <p className="text-xs text-foreground/40 mt-1">TXT, PDF, PNG, JPG, WEBP — até 2MB, máx. 5 arquivos</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp" onChange={e => handleFileSelect(e.target.files)} className="hidden" />
                <Button variant="ghost" size="sm" className="w-full text-foreground/50" onClick={handleSkipFiles}>
                  Pular, não tenho arquivos agora
                </Button>
              </div>
            )}

            {/* Botão gerar estratégia */}
            {isDone && (
              <Button
                onClick={handleGenerate}
                disabled={!isAuthenticated}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 text-white font-bold py-3 rounded-xl text-base transition-all shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar Minha Estratégia
              </Button>
            )}

            {/* Input de texto */}
            {!isSelectQuestion && !showFileUpload && !isDone && currentQuestion && (
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  {currentQuestion.prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50 text-sm z-10">
                      {currentQuestion.prefix}
                    </span>
                  )}
                  {currentQuestion.type === 'textarea' ? (
                    <Textarea
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleTextSubmit();
                        }
                      }}
                      placeholder={currentQuestion.placeholder}
                      className="resize-none min-h-[80px] rounded-xl pr-4"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <Input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                      placeholder={currentQuestion.placeholder}
                      className={`rounded-xl ${currentQuestion.prefix ? 'pl-7' : ''}`}
                      autoFocus
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    onClick={handleTextSubmit}
                    disabled={!canSend}
                    size="icon"
                    className="bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-xl w-10 h-10 hover:opacity-90 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  {isSkippable && (
                    <Button
                      onClick={handleSkip}
                      size="icon"
                      variant="ghost"
                      className="rounded-xl w-10 h-10 text-foreground/30 hover:text-foreground/60"
                      title="Pular esta pergunta"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Hint de atalho */}
            {!isSelectQuestion && !showFileUpload && !isDone && currentQuestion?.type === 'text' && (
              <p className="text-xs text-foreground/30 text-center mt-2">Enter para enviar{isSkippable ? ' · ↷ para pular' : ''}</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
