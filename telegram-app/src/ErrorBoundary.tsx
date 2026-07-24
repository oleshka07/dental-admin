import { Component, ErrorInfo, ReactNode } from 'react';

interface State {
  error: Error | null;
  componentStack: string;
}

// Without this, an uncaught render error unmounts the whole tree and leaves
// a blank white screen with no signal — this is the only way to see what
// broke on a real device where there's no devtools access. Message alone
// wasn't enough to pinpoint the crash site, so this also surfaces the
// component stack (which screen/component actually threw).
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="screen center-state">
          <div className="emoji">⚠️</div>
          <p>Něco se pokazilo. Zkuste prosím aplikaci zavřít a otevřít znovu.</p>
          <p style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-word' }}>{this.state.error.message}</p>
          <pre style={{ fontSize: 10, opacity: 0.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left' }}>
            {this.state.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
