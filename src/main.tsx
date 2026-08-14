import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import NotFound from './components/NotFound.tsx';
import './index.css';

const path = window.location.pathname;
const isHome = path === '/' || path === '/index.html' || path === '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHome ? <App /> : <NotFound />}
  </StrictMode>,
);
