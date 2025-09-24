import React from 'react';
import type { HistoryItem } from '../types';
import { Button } from '@/components/ui/button';
import { X, Trash2, Eye } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onClose: () => void;
  onViewItem: (item: HistoryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClose,
  onViewItem,
  onDeleteItem
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Histórico</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {history.length === 0 ? (
          <p className="text-xs text-foreground/60 text-center py-4">
            Nenhum histórico ainda
          </p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-xs text-foreground/60">
                  {item.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewItem(item)}
                  className="h-6 w-6 p-0"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteItem(item.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};