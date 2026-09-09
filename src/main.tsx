import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFrontendSentry } from './utils/sentry';

initFrontendSentry();

createRoot(document.getElementById('root')!).render(
  <App />,
);
