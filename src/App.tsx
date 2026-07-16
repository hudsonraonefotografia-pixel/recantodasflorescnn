import React from 'react';
import './index.css';

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        animation: 'fadeIn 1s ease-out',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '24px',
        padding: '4rem 3rem',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          margin: '0 0 1rem 0',
          background: 'linear-gradient(to right, #34d399, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.05em'
        }}>
          Recanto das Flores
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.25rem',
          lineHeight: 1.6,
          margin: '0 0 2.5rem 0'
        }}>
          Bem-vindo ao início de algo incrível. O aplicativo está em construção.
        </p>
        <button style={{
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          fontSize: '1.125rem',
          fontWeight: 600,
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.backgroundColor = 'var(--accent)';
        }}
        >
          Em Breve
        </button>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default App;
