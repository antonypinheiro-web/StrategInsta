import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo } from 'lucide-react';
import type { ActionPlanItem } from '@/types';

interface ActionPlanDisplayProps {
  content: ActionPlanItem[];
}

export const ActionPlanDisplay: React.FC<ActionPlanDisplayProps> = ({ content }) => {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'status-danger';
      case 'medium': return 'status-caution';
      case 'low': return 'status-success';
      default: return 'text-muted-content';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3">
        <ListTodo className="w-6 h-6 text-primary" />
        <CardTitle className="text-xl font-bold">Plano de Ação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {content.map((weekItem) => (
          <div key={weekItem.week}>
            <h3 className="text-lg font-semibold mb-3">Semana {weekItem.week}</h3>
            <div className="space-y-3">
              {weekItem.tasks.map((task, index) => (
                <Card key={index} className="p-4 border-l-4 border-muted-foreground/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground">{task.task}</p>
                    <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-content">{task.description}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};