import { Component, ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
      const { t } = useTranslation();
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 px-4">
          <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold">
              V
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {t("error_title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t("error_desc")}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold hover:scale-105 transition-all"
            >
              {t("error_reload")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}