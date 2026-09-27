import React from 'react';
import { StrategyText } from './StrategyText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface MonetizationIdeasDisplayProps {
  content: string;
}

export const MonetizationIdeasDisplay: React.FC<MonetizationIdeasDisplayProps> = ({ content }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <DollarSign className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Ideias de Monetização</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none">
        <StrategyText content={content} />
      </CardContent>
    </Card>
  );
};
