import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("App Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-400 px-4">
          <div className="max-w-sm w-full text-center p-8 rounded-3xl bg-white shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
              V
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              VaxtaGo временно недоступен
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {this.state.message || "Произошла непредвиденная ошибка."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold hover:scale-105 transition-all"
            >
              Повторить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}