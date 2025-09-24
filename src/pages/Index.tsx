import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import OnboardingWizard from "@/components/OnboardingWizard";
import { toast } from "@/hooks/use-toast";

interface UserInput {
  username: string;
  niche: string;
  audience: string;
  goals: string;
  currentFollowers: string;
  postFrequency: string;
  businessType: string;
}

type AppPhase = 'landing' | 'onboarding' | 'generating' | 'dashboard';

const Index = () => {
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('landing');
  const [userInput, setUserInput] = useState<UserInput | null>(null);

  const handleGetStarted = () => {
    setCurrentPhase('onboarding');
  };

  const handleOnboardingComplete = (data: UserInput) => {
    setUserInput(data);
    setCurrentPhase('generating');
    toast({
      title: "Strategy Generation Started!",
      description: "Our AI is creating your personalized Instagram strategy. This will take a few moments.",
    });
    
    // Simulate AI generation process
    setTimeout(() => {
      setCurrentPhase('dashboard');
      toast({
        title: "Your Strategy is Ready!",
        description: "Your personalized Instagram content strategy has been generated successfully.",
      });
    }, 3000);
  };

  const handleBackToLanding = () => {
    setCurrentPhase('landing');
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} />;
      case 'onboarding':
        return (
          <OnboardingWizard 
            onComplete={handleOnboardingComplete}
            onBack={handleBackToLanding}
          />
        );
      case 'generating':
        return (
          <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-4">Generating Your Strategy</h2>
              <p className="text-muted-foreground">
                Our AI is analyzing your niche and creating a personalized content strategy just for you...
              </p>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-4">Dashboard Coming Soon!</h2>
              <p className="text-muted-foreground mb-6">
                Your strategy has been generated for <strong>{userInput?.username}</strong> in the <strong>{userInput?.niche}</strong> niche.
              </p>
              <button 
                onClick={handleBackToLanding}
                className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Back to Home
              </button>
            </div>
          </div>
        );
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  return renderCurrentPhase();
};

export default Index;
