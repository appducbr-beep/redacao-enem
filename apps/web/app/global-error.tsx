'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc' }}>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '380px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: '0 0 0.5rem',
              }}
            >
              Algo inesperado aconteceu.
            </h1>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#64748b',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              Ocorreu um erro crítico. Tente recarregar a página.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.625rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
