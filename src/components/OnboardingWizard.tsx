import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, HelpCircle, User, Users, Instagram, Target, Filter, Sparkles, Volume2, ShoppingBag, Lightbulb, TrendingUp, LayoutGrid, Clock, Hourglass, Award } from "lucide-react";
import type { UserInput, FunnelFocus, ProficiencyLevel, PostingFrequency } from "../types";
import { funnelOptions, proficiencyLevelOptions, postingFrequencyOptions } from "../types";

interface OnboardingWizardProps {
  onStart: (data: UserInput) => void;
  initialValues?: UserInput | null;
  error?: string | null;
}

const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({ children, content }) => {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute z-10 invisible group-hover:visible bg-card border border-border rounded-lg p-2 text-xs text-foreground shadow-lg -top-2 left-6 w-64 transform -translate-y-full">
        {content}
        <div className="absolute top-full left-4 w-2 h-2 bg-card border-r border-b border-border transform rotate-45 -translate-y-1"></div>
      </div>
    </div>
  );
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ 
  onStart, 
  initialValues, 
  error 
}) => {
  const [formData, setFormData] = useState<UserInput>({
    niche: initialValues?.niche || '',
    audience: initialValues?.audience || '',
    username: initialValues?.username || '',
    goals: initialValues?.goals || '',
    funnelFocus: initialValues?.funnelFocus || 'balanced',
    files: initialValues?.files || undefined,
    brandVoice: initialValues?.brandVoice || '',
    productsAndServices: initialValues?.productsAndServices || '',
    existingContentInsights: initialValues?.existingContentInsights || '',
    competitorsAndInspirations: initialValues?.competitorsAndInspirations || '',
    contentPillars: initialValues?.contentPillars || '',
    desiredPostingFrequency: initialValues?.desiredPostingFrequency || '3x_semana',
    availableResources: initialValues?.availableResources || '',
    instagramProficiencyLevel: initialValues?.instagramProficiencyLevel || 'intermediario',
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFormData = (field: keyof UserInput, value: string | FunnelFocus | File[] | ProficiencyLevel | PostingFrequency) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['text/plain', 'text/markdown', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    }).slice(0, 5);

    updateFormData('files', validFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    if (formData.files) {
      const newFiles = formData.files.filter((_, i) => i !== index);
      updateFormData('files', newFiles);
    }
  };

  const canSubmit = formData.niche.trim() && formData.audience.trim() && formData.username.trim() && formData.goals.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onStart(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl shadow-xl border-border bg-card">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Vamos Começar</h2>
            <p className="text-foreground/70">
              Preencha os campos abaixo para que nossa IA possa criar sua estratégia personalizada.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nicho */}
            <div>
              <Label htmlFor="niche" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <User className="w-4 h-4" />
                Qual é o seu nicho?
                <Tooltip content="O nicho é a área específica do mercado em que você atua. Quanto mais específico, melhor a IA poderá criar sua estratégia.">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Input
                id="niche"
                type="text"
                value={formData.niche}
                onChange={(e) => updateFormData('niche', e.target.value)}
                placeholder="Ex: Fitness para mães, confeitaria vegana..."
                className="w-full"
                required
              />
            </div>

            {/* Público-alvo */}
            <div>
              <Label htmlFor="audience" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Users className="w-4 h-4" />
                Descreva seu público-alvo
                <Tooltip content="Descreva em detalhes para quem você cria conteúdo. Inclua dados demográficos, interesses, dores e desejos mais profundos do seu público.">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Textarea
                id="audience"
                value={formData.audience}
                onChange={(e) => updateFormData('audience', e.target.value)}
                placeholder="Ex: Mulheres de 25-35 anos, que trabalham em casa, buscam equilíbrio e bem-estar, sonham em ter mais tempo para si e para a família."
                className="w-full resize-none"
                rows={3}
                required
              />
            </div>

            {/* Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                  <Instagram className="w-4 h-4" />
                  Seu @username do Instagram
                  <Tooltip content="Seu nome de usuário no Instagram ajuda a IA a entender o contexto do seu perfil.">
                    <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                  </Tooltip>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/60">@</span>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateFormData('username', e.target.value)}
                    placeholder="seuusername"
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="goals" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                  <Target className="w-4 h-4" />
                  Qual seu principal objetivo?
                  <Tooltip content="O que você mais deseja alcançar com seu perfil? (Ex: aumentar vendas, ganhar seguidores, construir autoridade).">
                    <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                  </Tooltip>
                </Label>
                <Input
                  id="goals"
                  type="text"
                  value={formData.goals}
                  onChange={(e) => updateFormData('goals', e.target.value)}
                  placeholder="Ex: Vender meu curso online de yoga para iniciantes..."
                  required
                />
              </div>
            </div>

            {/* Ênfase da Estratégia */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Filter className="w-4 h-4" />
                Ênfase da Estratégia
                <Tooltip content="Selecione em qual parte do funil de vendas você quer focar. Topo (atrair novos seguidores), Meio (criar conexão e autoridade) ou Fundo (converter em vendas).">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Select value={formData.funnelFocus} onValueChange={(value: FunnelFocus) => updateFormData('funnelFocus', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {funnelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-foreground/60">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Novos Campos */}
            {/* Tom de Voz */}
            <div>
              <Label htmlFor="brandVoice" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Volume2 className="w-4 h-4" />
                Tom de Voz e Personalidade da Marca
                <Tooltip content="Descreva como sua marca se comunica. É formal, divertida, inspiradora, técnica, amigável? Isso ajuda a IA a criar legendas e textos alinhados.">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Input
                id="brandVoice"
                type="text"
                value={formData.brandVoice}
                onChange={(e) => updateFormData('brandVoice', e.target.value)}
                placeholder="Ex: Inspirador e motivacional, com um toque de humor."
                className="w-full"
              />
            </div>

            {/* Produtos e Serviços */}
            <div>
              <Label htmlFor="productsAndServices" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <ShoppingBag className="w-4 h-4" />
                Seus Principais Produtos/Serviços
                <Tooltip content="Liste e descreva brevemente o que você oferece. Ex: 'Curso online de fotografia para iniciantes', 'Consultoria de marketing digital 1:1'.">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Textarea
                id="productsAndServices"
                value={formData.productsAndServices}
                onChange={(e) => updateFormData('productsAndServices', e.target.value)}
                placeholder="Ex: E-book 'Guia Completo de Alimentação Saudável' (ajuda a emagrecer com saúde); Mentoria 'Descomplique seu Instagram' (para empreendedores digitais)."
                className="w-full resize-none"
                rows={2}
              />
            </div>

            {/* Insights de Conteúdo Existente */}
            <div>
              <Label htmlFor="existingContentInsights" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Lightbulb className="w-4 h-4" />
                Insights de Conteúdo Anterior (Opcional)
                <Tooltip content="O que funcionou bem ou não no seu conteúdo passado? Quais tipos de posts geram mais engajamento? (Ex: 'Vídeos curtos de dicas rápidas viralizam', 'Carrosséis educativos têm bom salvamento').">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Textarea
                id="existingContentInsights"
                value={formData.existingContentInsights}
                onChange={(e) => updateFormData('existingContentInsights', e.target.value)}
                placeholder="Ex: Meus tutoriais em vídeo têm muito engajamento, mas posts de texto puro não performam bem."
                className="w-full resize-none"
                rows={2}
              />
            </div>

            {/* Concorrentes e Inspirações */}
            <div>
              <Label htmlFor="competitorsAndInspirations" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <TrendingUp className="w-4 h-4" />
                Perfis de Referência/Concorrentes (Opcional)
                <Tooltip content="Liste 2-3 perfis do Instagram que você admira ou considera concorrentes, e o que você gosta/não gosta neles.">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Textarea
                id="competitorsAndInspirations"
                value={formData.competitorsAndInspirations}
                onChange={(e) => updateFormData('competitorsAndInspirations', e.target.value)}
                placeholder="Ex: @perfil_inspirador (gosto da estética), @concorrente_x (não gosto do tom de voz muito formal)."
                className="w-full resize-none"
                rows={2}
              />
            </div>

            {/* Pilares de Conteúdo */}
            <div>
              <Label htmlFor="contentPillars" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <LayoutGrid className="w-4 h-4" />
                Seus Pilares de Conteúdo (Opcional)
                <Tooltip content="Quais são os 3-5 temas principais que você sempre aborda em seu conteúdo? (Ex: 'Receitas saudáveis', 'Dicas de produtividade', 'Histórias de superação').">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Textarea
                id="contentPillars"
                value={formData.contentPillars}
                onChange={(e) => updateFormData('contentPillars', e.target.value)}
                placeholder="Ex: Bem-estar, Alimentação Consciente, Mindfulness, Rotina Saudável."
                className="w-full resize-none"
                rows={2}
              />
            </div>

            {/* Frequência de Postagem Desejada */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Clock className="w-4 h-4" />
                Frequência de Postagem Desejada
                <Tooltip content="Com que frequência você gostaria de postar no feed do Instagram?">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Select value={formData.desiredPostingFrequency} onValueChange={(value: PostingFrequency) => updateFormData('desiredPostingFrequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {postingFrequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-foreground/60">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recursos e Tempo Disponível */}
            <div>
              <Label htmlFor="availableResources" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Hourglass className="w-4 h-4" />
                Tempo/Recursos Disponíveis (Opcional)
                <Tooltip content="Quanto tempo você pode dedicar à criação de conteúdo por semana? (Ex: '2-3 horas', 'um dia inteiro', 'pouco tempo, preciso de algo simples').">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Input
                id="availableResources"
                type="text"
                value={formData.availableResources}
                onChange={(e) => updateFormData('availableResources', e.target.value)}
                placeholder="Ex: Consigo dedicar 5 horas por semana para criar conteúdo."
                className="w-full"
              />
            </div>

            {/* Nível de Proficiência no Instagram */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Award className="w-4 h-4" />
                Seu Nível de Experiência no Instagram
                <Tooltip content="Selecione seu nível para que a IA possa sugerir atividades e dicas adequadas à sua evolução.">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              <Select value={formData.instagramProficiencyLevel} onValueChange={(value: ProficiencyLevel) => updateFormData('instagramProficiencyLevel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {proficiencyLevelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-foreground/60">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload de Arquivos */}
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <Upload className="w-4 h-4" />
                Base de Conhecimento (Opcional)
                <Tooltip content="Envie arquivos de texto ou imagens que a IA possa usar como referência para criar uma estratégia ainda mais alinhada com seu negócio (ex: e-books, posts antigos, identidade visual).">
                  <HelpCircle className="w-4 h-4 text-foreground/40 hover:text-primary cursor-help" />
                </Tooltip>
              </Label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-foreground/40" />
                <p className="text-sm text-primary mb-1">Clique para enviar</p>
                <p className="text-xs text-foreground/60 mb-2">ou arraste e solte</p>
                <p className="text-xs text-foreground/40">
                  TXT, MD, PDF, PNG, JPG, WEBP até 2MB. Limite de 5 arquivos.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {formData.files && formData.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span className="truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-600 h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 text-base font-bold shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Estratégia de Sucesso
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};