import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/kenfinly-core.css';
// Bootstrap react-i18next — must be imported before any component that calls useTranslation()
import './i18n';
import { Suspense, type ComponentType, type ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DarkModeProvider } from './components/DarkModeContext';
import { LanguageProvider } from './components/LanguageContext';
import { CurrencyProvider } from './components/CurrencyContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { AuthProvider } from './contexts/AuthContext';
import { LogoProvider } from './contexts/LogoContext';
import Loader from './components/Loader';
import RouteErrorBoundary from './app/RouteErrorBoundary';
import RouteLoading from './app/RouteLoading';
import { adminRoutes } from './app/routes/adminRoutes';
import {
    authenticatedRoutes,
    authenticatedShell,
} from './app/routes/authenticatedRoutes';
import { featureRoutes } from './app/routes/featureRoutes';
import { publicRoutes } from './app/routes/publicRoutes';

const AuthenticatedShell = authenticatedShell;

function renderLazyRoutes(
    routes: { path: string; Component: ComponentType }[],
): ReactElement[] {
    return routes.map(({ path, Component }) => (
        <Route key={path} path={path} element={<Component />} />
    ));
}

function App(): ReactElement {
  return (
    <TranslationProvider>
    <LogoProvider>
    <AuthProvider>
    <DarkModeProvider>
    <LanguageProvider>
    <CurrencyProvider>
      <BrowserRouter>
        <Loader />
        <RouteErrorBoundary>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              {renderLazyRoutes(publicRoutes)}
              <Route element={<AuthenticatedShell />}>
                {renderLazyRoutes(authenticatedRoutes)}
              </Route>
              {renderLazyRoutes(featureRoutes)}
              {renderLazyRoutes(adminRoutes)}
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </BrowserRouter>
    </CurrencyProvider>
    </LanguageProvider>
    </DarkModeProvider>
    </AuthProvider>
    </LogoProvider>
    </TranslationProvider>
  );
}

export default App;
