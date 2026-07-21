import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#06140F] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Произошла ошибка</h1>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Что-то пошло не так в работе компонента. Попробуйте обновить страницу.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full max-w-xs py-4 bg-[#00A86B] text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}