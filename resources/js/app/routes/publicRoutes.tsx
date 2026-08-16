import { route, type LazyRoute } from './routeModules';

export const publicRoutes: LazyRoute[] = [
    route('/', 'Splashscreen.tsx'),
    route('/LetYouScreen', 'LetYouScreen.tsx'),
    route('/SignIn', 'SignIn.tsx'),
    route('/SignUp', 'SignUp.tsx'),
    route('/auth/google/success', 'GoogleAuthSuccess.tsx'),
    route('/auth/facebook/success', 'FacebookAuthSuccess.tsx'),
];