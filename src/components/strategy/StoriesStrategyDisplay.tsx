import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { StoriesStrategyItem } from '@/types';

interface StoriesStrategyDisplayProps {
  content: StoriesStrategyItem[];
}

export const StoriesStrategyDisplay: React.FC<StoriesStrategyDisplayProps> = ({ content }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Estratégia de Stories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {content.map((item, index) => (
          <Card key={index} className="shadow-sm border-l-4 border-primary">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">{item.dayOfWeek}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-content">
              <p><strong>Objetivo:</strong> {item.objective}</p>
              <p><strong>Tipo de Conteúdo:</strong> {item.contentType}</p>
              <p><strong>Exemplo:</strong> {item.example}</p>
              <p><strong>Dicas:</strong> {item.tips}</p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};