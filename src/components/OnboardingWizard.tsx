import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Upload, Instagram, Target, Zap } from "lucide-react";

interface UserInput {
  username: string;
  niche: string;
  audience: string;
  goals: string;
  currentFollowers: string;
  postFrequency: string;
  businessType: string;
}

interface OnboardingWizardProps {
  onComplete: (data: UserInput) => void;
  onBack: () => void;
}

export default function OnboardingWizard({ onComplete, onBack }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UserInput>({
    username: "",
    niche: "",
    audience: "",
    goals: "",
    currentFollowers: "",
    postFrequency: "",
    businessType: ""
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof UserInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Instagram className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Tell us about your Instagram</h2>
              <p className="text-muted-foreground">Basic information to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Instagram Username</Label>
                <Input
                  id="username"
                  placeholder="@yourusername"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="niche">Your Niche/Industry</Label>
                <Input
                  id="niche"
                  placeholder="e.g., Fitness, Fashion, Food, Business"
                  value={formData.niche}
                  onChange={(e) => updateFormData('niche', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  placeholder="e.g., Personal Brand, Online Course, E-commerce"
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Target className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Define your audience & goals</h2>
              <p className="text-muted-foreground">Help us understand who you want to reach</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Textarea
                  id="audience"
                  placeholder="Describe your ideal follower: age, interests, pain points, demographics..."
                  value={formData.audience}
                  onChange={(e) => updateFormData('audience', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="goals">Main Goals</Label>
                <Textarea
                  id="goals"
                  placeholder="What do you want to achieve? (e.g., increase sales, build community, grow followers...)"
                  value={formData.goals}
                  onChange={(e) => updateFormData('goals', e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="followers">Current Followers</Label>
                  <Input
                    id="followers"
                    placeholder="e.g., 1.2K, 10K, 50K"
                    value={formData.currentFollowers}
                    onChange={(e) => updateFormData('currentFollowers', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="frequency">Post Frequency</Label>
                  <Input
                    id="frequency"
                    placeholder="e.g., Daily, 3x/week"
                    value={formData.postFrequency}
                    onChange={(e) => updateFormData('postFrequency', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Zap className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Ready to generate your strategy!</h2>
              <p className="text-muted-foreground">Review your information and let AI create your personalized plan</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Username:</span> {formData.username || "Not set"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Niche:</span> {formData.niche || "Not set"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Business:</span> {formData.businessType || "Not set"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Followers:</span> {formData.currentFollowers || "Not set"}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Optional: Upload brand documents</p>
                <p className="text-xs text-muted-foreground">PDFs, brand guidelines, or any content that represents your brand</p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.username && formData.niche && formData.businessType;
      case 2:
        return formData.audience && formData.goals;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-medium">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">Step {currentStep} of {totalSteps}</Badge>
            <Badge variant="outline" className="bg-gradient-primary text-white border-0">
              Setup Wizard
            </Badge>
          </div>
          <Progress value={progress} className="mb-4" />
        </CardHeader>
        
        <CardContent className="p-8">
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={prevStep}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-primary hover:opacity-90 flex items-center"
            >
              {currentStep === totalSteps ? 'Generate Strategy' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}