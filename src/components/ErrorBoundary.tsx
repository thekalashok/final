import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "";
      const isQuotaError = errorMsg.includes("Quota exceeded");

      return (
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-[#3a322b] mb-4 font-display">
              {isQuotaError ? "Daily Limit Reached" : "Something went wrong"}
            </h1>
            
            <p className="text-slate-500 mb-8 leading-relaxed">
              {isQuotaError 
                ? "We've reached our daily free limit for database reads. This usually resets every 24 hours. Please try again tomorrow!"
                : "An unexpected error occurred. We've been notified and are looking into it."}
            </p>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full bg-[#3a322b] hover:bg-[#4a3f35] text-white h-12 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => window.location.href = "/"}
                className="w-full h-12 rounded-2xl text-slate-400"
              >
                Go to Home
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-h-40">
                <p className="text-[10px] font-mono text-slate-400 break-all">
                  {errorMsg}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
