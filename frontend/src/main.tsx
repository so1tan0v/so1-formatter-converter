import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { setupMonaco } from '@presentation/editors/monaco/setup-monaco';
import { store } from '@presentation/store';
import { applyTheme } from '@presentation/theme/apply-theme';
import { defaultTheme } from '@presentation/theme/catalog';
import { ThemeProvider } from '@presentation/theme/ThemeProvider';

import { App } from './App';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@presentation/styles/index.css';

applyTheme(defaultTheme);
setupMonaco();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
