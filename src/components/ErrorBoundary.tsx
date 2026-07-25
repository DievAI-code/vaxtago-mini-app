import React, { Component, ReactNode } from "react";
import { VaqtaLogo } from "./VaqtaLogo";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[VAQTA AI Error Boundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/home";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen-dynamic flex flex-col items-center justify-center bg-[#06140F] p-8 text-center text-white">
          <VaqtaLogo size={64} animated glow className="mb-6" />
          <h1 className="text-xl font-black mb-2 uppercase tracking-tight">VAQTA AI временно восстанавливает систему</h1>
          <p className="text-slate-400 text-xs max-w-xs mb-8 leading-relaxed">
            Произошла ошибка при загрузке интерфейса. Нажмите кнопку ниже для безопасного сброса.
          </p>
          <button
            onClick={this.handleReset}
            className="w-full max-w-xs py-4 vaqta-gradient text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl vaqta-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Перезапустить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}