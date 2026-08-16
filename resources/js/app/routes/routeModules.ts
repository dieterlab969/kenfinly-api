import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type PageLoader = () => Promise<unknown>;
type StyleLoader = () => Promise<unknown>;

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

const styleModules = import.meta.glob('../../assets/css/features/*.css') as Record<string, StyleLoader>;

function styleGroupForPage(pagePath: string): string {
    const page = pagePath.split('/').pop()?.replace(/\.(?:tsx?|jsx?)$/, '').toLowerCase() ?? '';

    if (['splashscreen', 'letyouscreen', 'signin', 'signup', 'googleauthsuccess', 'facebookauthsuccess'].includes(page)) {
        return 'public';
    }

    if (
        page.includes('verify')
        || page.includes('otp')
        || page.includes('password')
        || page.includes('fingerprint')
        || page.includes('facerecognition')
        || page.includes('capture')
        || page.includes('identify')
        || page.includes('uploadid')
        || page.includes('reasonusing')
        || page.includes('personalinfoslider')
        || page === 'notification'
        || page === 'notificationallow'
    ) {
        return 'auth';
    }

    if (page === 'home' || page === 'analytics' || page.includes('area') || page.includes('bar') || page.includes('pie') || page.includes('line')) {
        return 'dashboard';
    }

    if (
        page.includes('send')
        || page.includes('request')
        || page.includes('transfer')
        || page.includes('invoice')
        || page.includes('bill')
        || page.includes('ewallet')
        || page.includes('mobile')
        || page.includes('tax')
        || page.includes('health')
        || page.includes('merchant')
        || page.includes('television')
        || page.includes('mutalfund')
        || page.includes('stock')
        || page.includes('creditcard')
        || page.includes('motor')
        || page.includes('car')
        || page.includes('food')
        || page.includes('split')
        || page.includes('payment')
        || page.includes('preapproved')
        || page.includes('tracking')
        || page.includes('invoicing')
        || page.includes('myitem')
        || page.includes('addnewitem')
        || page.includes('addtax')
        || page.includes('bankandcard')
        || page.includes('walletmanagement')
        || page.includes('categorymanagement')
    ) {
        return 'finance';
    }

    return 'account';
}

export function lazyPage(pagePath: string): LazyExoticComponent<ComponentType> {
    const modulePath = `../../pages/${pagePath}`;
    const loader = pageModules[modulePath];
    const styleLoader = styleModules[`../../assets/css/features/${styleGroupForPage(pagePath)}.css`];
    const responsiveLoader = styleModules['../../assets/css/features/responsive.css'];
    const styleGroup = styleGroupForPage(pagePath);
    const bootstrapLoader = ['finance', 'account', 'dashboard'].includes(styleGroup)
        ? () => import('bootstrap/dist/js/bootstrap.bundle.min.js')
        : null;

    if (!loader) {
        throw new Error(`No route page module found for "${pagePath}"`);
    }

    return lazy(async () => {
        if (styleLoader) await styleLoader();
        if (responsiveLoader) await responsiveLoader();
        if (bootstrapLoader) await bootstrapLoader();

        return {
            default: (await loader()) as ComponentType,
        };
    });
}

export function route(path: string, pagePath: string): LazyRoute {
    return { path, Component: lazyPage(pagePath) };
}