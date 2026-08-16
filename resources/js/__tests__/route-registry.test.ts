import { describe, expect, it } from 'vitest';
import { adminRoutes } from '../app/routes/adminRoutes';
import { authenticatedRoutes } from '../app/routes/authenticatedRoutes';
import { featureRoutes } from '../app/routes/featureRoutes';
import { publicRoutes } from '../app/routes/publicRoutes';

const allRoutes = [
    ...publicRoutes,
    ...authenticatedRoutes,
    ...featureRoutes,
    ...adminRoutes,
];

describe('Phase 1 route registries', () => {
    it('preserves the active route URL inventory without duplicates', () => {
        const paths = allRoutes.map(({ path }) => path);

        expect(paths).toHaveLength(127);
        expect(new Set(paths).size).toBe(paths.length);
        expect(paths).toEqual(expect.arrayContaining([
            '/',
            '/SignIn',
            '/Home',
            '/WalletManagement',
            '/analytics',
            '/halo',
            '/halo/*',
        ]));
    });

    it('keeps route ownership grouped by public, authenticated, and feature flows', () => {
        expect(publicRoutes.map(({ path }) => path)).toEqual([
            '/',
            '/LetYouScreen',
            '/SignIn',
            '/SignUp',
            '/auth/google/success',
            '/auth/facebook/success',
        ]);
        expect(authenticatedRoutes.map(({ path }) => path)).toEqual([
            '/Home',
            '/analytics',
        ]);
        expect(featureRoutes.some(({ path }) => path === '/WalletManagement')).toBe(true);
        expect(featureRoutes.some(({ path }) => path === '/halo/*')).toBe(true);
    });

    it('creates lazy components for representative routes', () => {
        for (const route of [
            publicRoutes[0],
            authenticatedRoutes[0],
            featureRoutes.find(({ path }) => path === '/WalletManagement'),
            featureRoutes.find(({ path }) => path === '/halo'),
        ]) {
            expect(route?.Component).toBeDefined();
            expect(route?.Component.$$typeof).toBeDefined();
        }
    });
});