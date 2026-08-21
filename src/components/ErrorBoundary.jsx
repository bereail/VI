import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: 24, textAlign: 'center', background: 'var(--bg-0, #0b0b0f)',
          color: 'var(--text-1, #fff)',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Algo salió mal.</p>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 320 }}>
            Ocurrió un error inesperado. Probá recargar la página.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
