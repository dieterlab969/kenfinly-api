import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type PageLoader = () => Promise<unknown>;

export type LazyRoute = {
    path: string;
    Component: LazyExoticComponent<ComponentType>;
};

/*
 * Vite turns each page matched by this glob into an on-demand module. Keeping
 * the lookup here means route registries describe URL ownership without
 * eagerly importing the page implementations.
 */
const pageModules = import.meta.glob('../../pages/**/*.{js,jsx,ts,tsx}', {
    import: 'default',
}) as Record<string, PageLoader>;

export function lazyPage(pagePath: string): LazyExoticComponent<ComponentType> {
    const modulePath = `../../pages/${pagePath}`;
    const loader = pageModules[modulePath];

    if (!loader) {
        throw new Error(`No route page module found for "${pagePath}"`);
    }

    return lazy(async () => ({
        default: (await loader()) as ComponentType,
    }));
}

export function route(path: string, pagePath: string): LazyRoute {
    return { path, Component: lazyPage(pagePath) };
}