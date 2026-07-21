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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Произошла ошибка</h1>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Что-то пошло не так. Попробуйте перезагрузить приложение.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#2563EB] text-white rounded-xl font-bold hover:bg-[#1d4ed8] transition-colors"
          >
            Обновить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}