import React from 'react';
import ReactDOM from 'react-dom/client';
import TemplateApp from './template/App';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <TemplateApp />
  </React.StrictMode>
);
