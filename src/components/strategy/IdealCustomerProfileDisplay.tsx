import React from 'react';
import { StrategyText } from './StrategyText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface IdealCustomerProfileDisplayProps {
  content: string;
}

export const IdealCustomerProfileDisplay: React.FC<IdealCustomerProfileDisplayProps> = ({ content }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <User className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Perfil de Cliente Ideal</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none">
        <StrategyText content={content} />
      </CardContent>
    </Card>
  );
};
