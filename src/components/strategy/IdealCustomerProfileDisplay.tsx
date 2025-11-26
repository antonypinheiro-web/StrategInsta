import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface IdealCustomerProfileDisplayProps {
  content: string;
}

export const IdealCustomerProfileDisplay: React.FC<IdealCustomerProfileDisplayProps> = ({ content }) => {
  const renderLine = (line: string, index: number) => {
    if (line.match(/^\*\*Perfil do Cliente Ideal.*?\*\*$/)) return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-border">{line.replace(/\*\*/g, '')}</h2>;
    if (line.match(/^\*\*\d[\d\.]*\s.*?\*\*$/)) return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) return <li key={index} className="ml-5 list-disc text-foreground/80">{line.trim().substring(2)}</li>;
    if (line.trim() === '') return null;
    return <p key={index} className="text-foreground/80 mb-2 leading-relaxed">{line}</p>;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <User className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Perfil de Cliente Ideal</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none">
        {content.split('\n').map(renderLine)}
      </CardContent>
    </Card>
  );
};