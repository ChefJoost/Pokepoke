import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: 24, fontFamily: 'monospace', color: '#ff6b6b',
          background: '#0f0f1a', minHeight: '100dvh', wordBreak: 'break-word'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>App fout:</div>
          <div style={{ fontSize: 13, background: '#1a1a2e', padding: 12, borderRadius: 8 }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: '10px 20px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: 8, fontSize: 15 }}
          >
            Herstarten
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
