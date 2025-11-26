import React, { useState } from 'react';
import type { HistoryItem } from '../types';
import { Button } from '@/components/ui/button';
import { X, Trash2, Eye, Pencil } from 'lucide-react';
import { InputDialog } from './InputDialog'; // Importar o InputDialog

interface HistoryPanelProps {
  history: HistoryItem[];
  onClose: () => void;
  onViewItem: (item: HistoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onRenameItem: (itemId: string, newTitle: string) => void; // Nova prop para renomear
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClose,
  onViewItem,
  onDeleteItem,
  onRenameItem,
}) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [itemToRename, setItemToRename] = useState<HistoryItem | null>(null);

  const handleRenameClick = (item: HistoryItem) => {
    setItemToRename(item);
    setShowRenameDialog(true);
  };

  const handleRenameConfirm = (newTitle: string) => {
    if (itemToRename) {
      onRenameItem(itemToRename.id, newTitle);
      setItemToRename(null);
    }
    setShowRenameDialog(false);
  };

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
                  onClick={() => handleRenameClick(item)}
                  className="h-6 w-6 p-0 text-foreground/60 hover:text-primary"
                  aria-label="Renomear item"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewItem(item)}
                  className="h-6 w-6 p-0"
                  aria-label="Visualizar item"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteItem(item.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                  aria-label="Excluir item"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <InputDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        onConfirm={handleRenameConfirm}
        title="Renomear Item do Histórico"
        description="Insira um novo nome para este item do histórico."
        label="Novo Nome"
        placeholder="Ex: Bio Otimizada para Vendas"
        initialValue={itemToRename?.title || ''}
        confirmText="Renomear"
      />
    </div>
  );
};