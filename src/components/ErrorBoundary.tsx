/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React from "react";

interface Props {
  name: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Keeps one failing tab from blanking the whole application (plan T7.4).
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className="border border-red-500/40 rounded-xl p-6 text-sm">
          <p className="font-bold">The {this.props.name} tab failed to render.</p>
          <p className="text-xs opacity-70 mt-2 font-mono">{this.state.error.message}</p>
          <button className="mt-4 px-3 py-1.5 rounded border text-xs" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
