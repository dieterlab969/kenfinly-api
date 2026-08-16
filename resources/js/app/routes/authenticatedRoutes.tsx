import { lazy } from 'react';
import { route, type LazyRoute } from './routeModules';

export const authenticatedShell = lazy(
    () => import('../shell/AuthenticatedShell'),
);

export const authenticatedRoutes: LazyRoute[] = [
    route('/Home', 'Home.tsx'),
    route('/analytics', 'Analytics.tsx'),
];