import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Sparkles, Target, Calendar, TrendingUp, Users, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import logo from "@/assets/logo.png"; // Importar a logo

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-6 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by AI
            </Badge>
            
            {/* Substituindo o h1 pelo img da logo */}
            <img
              src={logo}
              alt="StrategInsta Logo"
              className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto mx-auto mb-6 logo-theme-aware"
            />
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Transforme sua presença no Instagram com estratégias de conteúdo geradas por IA.<br />
              <span className="text-primary font-semibold">Elimine bloqueios criativos. Aumente seus seguidores.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-medium"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Criar Minha Estratégia
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 text-lg px-8 py-6"
              >
                <Zap className="w-5 h-5 mr-2" />
                Assistir Demonstração
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted-foreground">Ideias de Conteúdo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">7 Dias</div>
                <div className="text-sm text-muted-foreground">Calendário Editorial</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">3 Min</div>
                <div className="text-sm text-muted-foreground">Tempo de Configuração</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">AI-Powered</div>
                <div className="text-sm text-muted-foreground">Personalização</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 rounded-2xl blur-3xl"></div>
            <img 
              src={heroImage}
              alt="StrategInsta AI-powered Instagram content strategy illustration"
              className="relative w-full max-w-4xl mx-auto rounded-2xl shadow-strong"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo o que você precisa para <span className="text-primary">dominar o Instagram</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Da análise de público à criação de conteúdo, nossa IA cuida da estratégia para você focar em criar conteúdo incrível.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Análise de Público</h3>
                <p className="text-muted-foreground">
                  Mergulhe fundo no seu perfil de cliente ideal com criação de persona e insights de segmentação impulsionados por IA.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Calendário de Conteúdo</h3>
                <p className="text-muted-foreground">
                  Calendário editorial de 30 dias com ideias de posts, legendas, hashtags e horários de postagem ideais.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Estratégia de Crescimento</h3>
                <p className="text-muted-foreground">
                  Ideias de monetização e táticas de engajamento personalizadas para seu nicho e objetivos de negócio.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Estratégia de Stories</h3>
                <p className="text-muted-foreground">
                  Estrutura semanal de stories para maximizar o engajamento e construir conexões mais profundas com seu público.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Gerador de Conteúdo IA</h3>
                <p className="text-muted-foreground">
                  Transforme qualquer ideia em posts completos com legendas, carrosséis e sequências de stories sob demanda.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Otimização de Bio</h3>
                <p className="text-muted-foreground">
                  Múltiplas variações de bio do Instagram otimizadas para conversões e descoberta.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para transformar sua estratégia no Instagram?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se a milhares de criadores que já revolucionaram sua estratégia de conteúdo com IA.
            </p>
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-12 py-6 shadow-medium"
            >
              <Instagram className="w-5 h-5 mr-2" />
              Comece Grátis
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}