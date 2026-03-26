import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram } from 'lucide-react';

interface InstagramBioDisplayProps {
  content: string;
}

export const InstagramBioDisplay: React.FC<InstagramBioDisplayProps> = ({ content }) => {
  const renderLine = (line: string, index: number) => {
    // Renderiza cabeçalhos de nível 3 para as opções de Bio
    if (line.match(/^###\s.*$/)) return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.replace(/^###\s/, '')}</h3>;
    // Renderiza linhas horizontais como separadores
    if (line.trim() === '---') return <hr key={index} className="my-6 border-border" />;
    // Ignora linhas vazias
    if (line.trim() === '') return null;
    // Renderiza o restante como parágrafos
    return <p key={index} className="text-muted-content mb-2 leading-relaxed">{line}</p>;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <Instagram className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Bio para Instagram</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none">
        {content.split('\n').map(renderLine)}
      </CardContent>
    </Card>
  );
};