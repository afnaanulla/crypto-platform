import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl font-semibold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="gradient-primary text-white font-medium rounded-xl px-6 py-2.5 hover:opacity-90 transition-all"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
