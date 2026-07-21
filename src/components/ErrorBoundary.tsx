import React, { Component, ReactNode } from "react";

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
    console.error("VAQTA Runtime Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#06140F] p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Что-то пошло не так</h1>
          <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
            VAQTA AI загрузится после повторной попытки. Мы уже знаем об ошибке.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full max-w-xs py-5 bg-[#00A86B] text-white rounded-2xl font-black shadow-[0_0_20px_rgba(0,168,107,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Перезагрузить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}