import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import NotFound from './components/NotFound.tsx';
import PrivacyPolicy from './components/PrivacyPolicy.tsx';
import TermsOfService from './components/TermsOfService.tsx';
import CookieBanner from './components/CookieBanner.tsx';
import './index.css';

const path = window.location.pathname;
const isHome = path === '/' || path === '/index.html' || path === '';
const isPrivacy = path === '/privacy-policy';
const isTerms = path === '/terms-of-service';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHome ? <App /> : isPrivacy ? <PrivacyPolicy /> : isTerms ? <TermsOfService /> : <NotFound />}
    <CookieBanner />
  </StrictMode>,
);
