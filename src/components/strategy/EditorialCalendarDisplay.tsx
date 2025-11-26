import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import type { CalendarDay } from '@/types';

interface EditorialCalendarDisplayProps {
  content: CalendarDay[];
}

export const EditorialCalendarDisplay: React.FC<EditorialCalendarDisplayProps> = ({ content }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <CalendarDays className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Calendário Editorial (30 Dias)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.map((dayItem) => (
          <Card key={dayItem.day} className="shadow-sm border-l-4 border-secondary">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-secondary">
                Dia {dayItem.day} - {dayItem.weekday}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-foreground/80">
              <p><strong>Tipo de Conteúdo:</strong> {dayItem.contentType}</p>
              <p><strong>Tópico:</strong> {dayItem.topic}</p>
              <p><strong>Legenda:</strong> {dayItem.caption}</p>
              <p><strong>Hashtags:</strong> {dayItem.hashtags.join(', ')}</p>
              {dayItem.stories && dayItem.stories.length > 0 && (
                <p><strong>Stories:</strong> {dayItem.stories.join(', ')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};