import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidUpdate(previousProps: ErrorBoundaryProps): void {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("View render error", error, errorInfo);
    }
  }

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="errorBoundaryPanel" aria-labelledby="error-boundary-title">
        <p className="eyebrow">View error</p>
        <h2 id="error-boundary-title">Something went wrong in this view</h2>
        <p className="muted">The rest of the app is still available.</p>
        <div className="errorBoundaryActions">
          <button type="button" onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
          <Link to="/" onClick={() => this.setState({ hasError: false })}>
            Project Library
          </Link>
        </div>
      </section>
    );
  }
}
