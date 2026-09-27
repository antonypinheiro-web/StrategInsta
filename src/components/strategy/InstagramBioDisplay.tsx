import React from 'react';
import { StrategyText } from './StrategyText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram } from 'lucide-react';

interface InstagramBioDisplayProps {
  content: string;
}

export const InstagramBioDisplay: React.FC<InstagramBioDisplayProps> = ({ content }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <Instagram className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Bio para Instagram</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none">
        <StrategyText content={content} />
      </CardContent>
    </Card>
  );
};
