import type { LazyRoute } from './routeModules';

/*
 * The active TypeScript entrypoint does not currently expose admin URLs.
 * Keep an explicit registry boundary so admin routes can be added without
 * returning to the monolithic application entrypoint.
 */
export const adminRoutes: LazyRoute[] = [];