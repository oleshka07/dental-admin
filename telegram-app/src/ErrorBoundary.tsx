import { Component, ReactNode } from 'react';

interface State {
  error: Error | null;
}

// Without this, an uncaught render error unmounts the whole tree and leaves
// a blank white screen with no signal — this is the only way to see what
// broke on a real device where there's no devtools access.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="screen center-state">
          <div className="emoji">⚠️</div>
          <p>Něco se pokazilo. Zkuste prosím aplikaci zavřít a otevřít znovu.</p>
          <p style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-word' }}>{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
