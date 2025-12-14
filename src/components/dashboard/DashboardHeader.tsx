import { memo } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userName?: string;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

const DashboardHeaderComponent = ({ 
  userName,
  onSettingsClick, 
  onLogoutClick 
}: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">A</span>
        </div>
        <h1 className="text-xl font-semibold text-foreground">Atlas</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {userName}
          </span>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onSettingsClick}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onLogoutClick}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export const DashboardHeader = memo(DashboardHeaderComponent);
