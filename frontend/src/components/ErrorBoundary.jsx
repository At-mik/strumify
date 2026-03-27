import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: ""
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected render error"
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 text-brand-text">
          <div className="w-full max-w-lg rounded-2xl border border-brand-amber/40 bg-brand-surface p-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-amber">Strumify Safety Mode</p>
            <h1 className="mt-3 text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-3 text-sm text-brand-text/70">{this.state.message || "A recoverable UI error occurred."}</p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-5 rounded-lg bg-brand-amber px-4 py-2 font-semibold text-black"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
