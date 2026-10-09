/**
 * Imports from packages
 */
import { Route, Routes } from 'react-router-dom';

/**
 * Imports from presentation
 */
import { AppShell } from '@presentation/layouts/AppShell';
import { ConverterPage } from '@presentation/pages/ConverterPage';
import { DifferPage } from '@presentation/pages/DifferPage';
import { FormatterPage } from '@presentation/pages/FormatterPage';
import { ViewerPage } from '@presentation/pages/ViewerPage';
import { Redirect } from '@presentation/routing/Redirect';

/**
 * Корневой компонент приложения с маршрутами разделов
 */
export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Redirect to="/formatter/json" />} />
        <Route path="/formatter/:type" element={<FormatterPage />} />
        <Route path="/converter" element={<ConverterPage />} />
        <Route path="/converter/:type" element={<ConverterPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/viewer/:type" element={<ViewerPage />} />
        <Route path="/differ" element={<DifferPage />} />
        <Route path="*" element={<Redirect to="/formatter/json" />} />
      </Routes>
    </AppShell>
  );
}
