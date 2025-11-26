import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram } from 'lucide-react';

interface InstagramBioDisplayProps {
  content: string;
}

export const InstagramBioDisplay: React.FC<InstagramBioDisplayProps> = ({ content }) => {
  const renderLine = (line: string, index: number) => {
    if (line.match(/^\*\*Opções de Bio.*?\*\*$/)) return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-border">{line.replace(/\*\*/g, '')}</h2>;
    if (line.match(/^\*\*Opção \d+.*?\*\*$/)) return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
    if (line.trim().startsWith('🎯') || line.trim().startsWith('💡') || line.trim().startsWith('📚') || line.trim().startsWith('🔗') ||
        line.trim().startsWith('Oi,') || line.trim().startsWith('👋') || line.trim().startsWith('🌟') || line.trim().startsWith('💬') ||
        line.trim().startsWith('📩') || line.trim().startsWith('🎁') || line.trim().startsWith('✨') || line.trim().startsWith('🏆') ||
        line.trim().startsWith('📖') || line.trim().startsWith('🔥') || line.trim().startsWith('⬇️')) {
      return <p key={index} className="text-foreground/80 mb-1 leading-relaxed">{line}</p>;
    }
    if (line.trim() === '') return null;
    return <p key={index} className="text-foreground/80 mb-2 leading-relaxed">{line}</p>;
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