import React from 'react';
import { Button } from '@/components/ui/button';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarNavProps {
  items: NavItem[];
  activeItem: string;
  setActiveItem: (id: string) => void;
  completedSteps: Set<string>;
  onReset: () => void;
  isDashboard: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items,
  activeItem,
  setActiveItem,
  completedSteps,
  onReset,
  isDashboard
}) => {
  return (
    <nav className="space-y-2">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-subtle-content mb-3">Estratégia</h3>
        {items.map((item) => {
          const isCompleted = completedSteps.has(item.id);
          const isActive = activeItem === item.id;
          const isClickable = isDashboard && isCompleted;
          
          return (
            <button
              key={item.id}
              onClick={() => isClickable && setActiveItem(item.id)}
              disabled={!isClickable}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                isActive 
                  ? 'bg-primary text-white' 
                  : isCompleted
                  ? 'text-foreground hover:bg-muted'
                  : 'text-disabled-content cursor-not-allowed'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
              {isCompleted && (
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full text-xs"
        >
          Recomeçar
        </Button>
      </div>
    </nav>
  );
};