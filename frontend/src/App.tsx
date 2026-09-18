import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@presentation/layouts/AppShell';
import { ConverterPage } from '@presentation/pages/ConverterPage';
import { FormatterPage } from '@presentation/pages/FormatterPage';
import { ViewerPage } from '@presentation/pages/ViewerPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/formatter/json" replace />} />
        <Route path="/formatter/:type" element={<FormatterPage />} />
        <Route path="/converter" element={<ConverterPage />} />
        <Route path="/converter/:type" element={<ConverterPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="/viewer/:type" element={<ViewerPage />} />
        <Route path="*" element={<Navigate to="/formatter/json" replace />} />
      </Routes>
    </AppShell>
  );
}
