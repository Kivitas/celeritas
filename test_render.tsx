import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';
console.log('App loaded successfully');
try {
  const html = renderToString(React.createElement(App));
  console.log('App rendered successfully');
} catch (err) {
  console.error('Crash during render:', err);
}
