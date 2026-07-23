import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { installDevTelegramStub } = await import('./telegram/devStub');
    installDevTelegramStub();
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
