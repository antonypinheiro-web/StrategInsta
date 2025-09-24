import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Sparkles, Target, Calendar, TrendingUp, Users, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

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
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
              StrategInsta
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Transform your Instagram presence with AI-generated content strategies.<br />
              <span className="text-primary font-semibold">Eliminate creative blocks. Grow your following.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-medium"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Create My Strategy
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 text-lg px-8 py-6"
              >
                <Zap className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted-foreground">Content Ideas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">7 Days</div>
                <div className="text-sm text-muted-foreground">Editorial Calendar</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">3 Min</div>
                <div className="text-sm text-muted-foreground">Setup Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">AI-Powered</div>
                <div className="text-sm text-muted-foreground">Personalization</div>
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
              Everything you need to <span className="text-primary">dominate Instagram</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From audience analysis to content creation, our AI handles the strategy so you can focus on creating amazing content.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Audience Analysis</h3>
                <p className="text-muted-foreground">
                  Deep dive into your ideal customer profile with AI-powered persona creation and targeting insights.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Content Calendar</h3>
                <p className="text-muted-foreground">
                  30-day editorial calendar with post ideas, captions, hashtags, and optimal posting times.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Growth Strategy</h3>
                <p className="text-muted-foreground">
                  Monetization ideas and engagement tactics tailored to your niche and business goals.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Stories Strategy</h3>
                <p className="text-muted-foreground">
                  Weekly stories framework to maximize engagement and build deeper connections with your audience.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Content Generator</h3>
                <p className="text-muted-foreground">
                  Transform any idea into complete posts with captions, carousels, and story sequences on demand.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-medium transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Bio Optimization</h3>
                <p className="text-muted-foreground">
                  Multiple Instagram bio variations optimized for conversions and discoverability.
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
              Ready to transform your Instagram strategy?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of creators who've already revolutionized their content strategy with AI.
            </p>
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-12 py-6 shadow-medium"
            >
              <Instagram className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}