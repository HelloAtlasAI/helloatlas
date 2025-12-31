import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  cardName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for dashboard cards.
 * Prevents one failing card from crashing the entire dashboard.
 */
export class CardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[CardErrorBoundary] ${this.props.cardName} crashed:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[140px] bg-card/80 backdrop-blur-xl border border-destructive/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{this.props.cardName} failed to load</span>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <p className="text-xs text-muted-foreground text-center max-w-[200px] truncate">
              {this.state.error.message}
            </p>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
