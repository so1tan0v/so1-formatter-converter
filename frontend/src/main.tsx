/**
 * Imports from packages
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

/**
 * Imports from presentation
 */
import { EmbedProvider } from '@presentation/embed/EmbedProvider';
import { applyEmbedFlag, readBootAppearance } from '@presentation/embed/query';
import { setupMonaco } from '@presentation/editors/monaco/setup-monaco';
import { store } from '@presentation/store';
import { applyTheme } from '@presentation/theme/apply-theme';
import { getTheme } from '@presentation/theme/catalog';
import { ThemeProvider } from '@presentation/theme/ThemeProvider';
import '@presentation/styles/index.css';

/**
 * Imports from relative
 */
import { App } from './App';

const bootAppearance = readBootAppearance(window.location.search);

applyEmbedFlag(bootAppearance.isEmbed);
applyTheme(getTheme(bootAppearance.themeId));
setupMonaco();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider initialThemeId={bootAppearance.themeId}>
        <EmbedProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </EmbedProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
