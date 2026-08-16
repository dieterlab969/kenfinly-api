import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const jsRoot = path.join(root, 'resources', 'js');
const controllerRoot = path.join(root, 'app', 'Http', 'Controllers');
const migrationRoot = path.join(root, 'database', 'migrations');
const routesRoot = path.join(root, 'routes');
const outputRoot = path.join(root, 'docs', 'issues');

function escape(value) {
    return String(value ?? '—')
        .replaceAll('|', '\\|')
        .replaceAll('\n', ' ')
        .trim() || '—';
}

function code(value) {
    const delimiter = String.fromCharCode(96);
    return delimiter + escape(value) + delimiter;
}

async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await walk(absolute));
        else files.push(absolute);
    }

    return files;
}

async function readIfExists(file) {
    try {
        return await fs.readFile(file, 'utf8');
    } catch {
        return '';
    }
}

function linesOf(content) {
    return content ? content.split(/\r?\n/).length : 0;
}

function featureFor(filename) {
    const name = filename.toLowerCase();
    if (/transaction|ledger|summary/.test(name)) return 'Transactions / ledger';
    if (/account|wallet|participant|invitation/.test(name)) return 'Accounts / wallets';
    if (/payment|gateway|payos|order|cart/.test(name)) return 'Payments / commerce';
    if (/subscription|license/.test(name)) return 'Subscriptions / licensing';
    if (/language|translation/.test(name)) return 'Internationalization';
    if (/halo|attendance|hourly|commitment|pomodoro|rate|point/.test(name)) return 'Halo / productivity';
    if (/habit|achievement/.test(name)) return 'Saving tracker';
    if (/security|consent|email|social|profile|preference|notification/.test(name)) return 'Identity / preferences';
    if (/category/.test(name)) return 'Categories';
    if (/currency/.test(name)) return 'Currencies';
    if (/setting|logo|favicon/.test(name)) return 'Application settings';
    if (/user/.test(name)) return 'Users';
    if (/cache|job/.test(name)) return 'Framework infrastructure';
    return 'Other / review required';
}

function sourceForComponent(component, importMap) {
    return importMap.get(component) ?? 'Not resolved from App.tsx imports';
}

async function buildFrontendInventory() {
    const appPath = path.join(jsRoot, 'App.tsx');
    const app = await fs.readFile(appPath, 'utf8');
    const allFrontendFiles = await walk(jsRoot);
    const importMap = new Map();

    for (const match of app.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"]/g)) {
        const [, component, importPath] = match;
        if (!importPath.startsWith('.')) continue;

        const absoluteBase = path.resolve(path.dirname(appPath), importPath);
        const candidate = allFrontendFiles.find((file) =>
            file === absoluteBase ||
            ['.tsx', '.ts', '.jsx', '.js'].some((extension) => file === `${absoluteBase}${extension}`) ||
            ['index.tsx', 'index.ts', 'index.jsx', 'index.js'].some((index) => file === path.join(absoluteBase, index))
        );
        if (candidate) importMap.set(component, path.relative(root, candidate).replaceAll(path.sep, '/'));
    }

    const routes = [];
    for (const match of app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<([A-Za-z0-9_]+)/g)) {
        const [, route, component] = match;
        const source = sourceForComponent(component, importMap);
        const absoluteSource = path.join(root, source);
        const sourceContent = await readIfExists(absoluteSource);
        const isJsx = source.endsWith('.jsx');
        const isAdmin = source.includes('/pages/admin/');
        const isHalo = route === '/halo' || route.startsWith('/halo/');
        const isPublicCandidate = source.includes('/pages/public/') || /^\/(?:pricing|privacy|terms|auth|$)/.test(route);

        routes.push({
            route,
            component,
            source,
            lines: linesOf(sourceContent),
            ownership: isAdmin ? 'Admin' : isHalo ? 'Halo' : isPublicCandidate ? 'Public/auth' : 'Authenticated app',
            review: isJsx ? 'Legacy JSX candidate; verify before migration/removal' : 'TypeScript route candidate',
        });
    }

    routes.sort((a, b) => a.route.localeCompare(b.route));
    const lines = [
        '# Frontend Route Inventory',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        '**Source:** `resources/js/App.tsx` route declarations and local imports',
        '',
        `The current router declares **${routes.length} routes**. Ownership and`,
        'legacy status below are inventory heuristics for planning; nested guards',
        'and runtime reachability still require route smoke tests.',
        '',
        '| Route | Component | Source | Lines | Ownership | Review indicator |',
        '| --- | --- | --- | ---: | --- | --- |',
        ...routes.map((item) =>
            [
                '|', code(item.route), '|', code(item.component), '|', code(item.source),
                '|', item.lines || '—', '|', escape(item.ownership), '|', escape(item.review), '|',
            ].join(' ')
        ),
        '',
        '## Phase 0 observations',
        '',
        '- `App.tsx` is still a single route composition point and currently',
        '  eagerly imports the route components.',
        '- `.jsx` files are marked as review candidates, not automatically dead',
        '  code. Active public/admin flows may still use JSX.',
        '- Phase 1 should split route registration and lazy-load by ownership or',
        '  feature without changing any URL.',
        '',
    ];

    return lines.join('\n') + '\n';
}

async function buildControllerInventory() {
    const routeFiles = await Promise.all((await walk(routesRoot))
        .filter((file) => file.endsWith('.php'))
        .map(async (file) => ({ file, content: await fs.readFile(file, 'utf8') })));
    const controllers = (await walk(controllerRoot)).filter((file) => file.endsWith('.php')).sort();
    const rows = [];

    for (const file of controllers) {
        const content = await fs.readFile(file, 'utf8');
        const basename = path.basename(file, '.php');
        const methods = [...content.matchAll(/function\s+([A-Za-z0-9_]+)\s*\(/g)].map((match) => match[1]);
        const routeRefs = [];
        for (const { file: routeFile, content: routeContent } of routeFiles) {
            const routeLines = routeContent.split(/\r?\n/)
                .map((line, index) => ({ line, number: index + 1 }))
                .filter(({ line }) => line.includes(basename));
            for (const item of routeLines.slice(0, 8)) {
                routeRefs.push(`${path.relative(root, routeFile)}:${item.number}`);
            }
        }

        const validation = /FormRequest|Validator::make|\$request->validate/.test(content)
            ? (/Validator::make|\$request->validate/.test(content) ? 'Inline validation' : 'FormRequest')
            : 'Not detected';
        const policy = /authorizeResource|->authorize\(|Policy/.test(content) ? 'Detected' : 'Not detected';
        const effects = [
            /DB::|Database\\|->transaction\(/.test(content) && 'DB/transaction',
            /Storage::|UploadedFile|->store/.test(content) && 'Storage/files',
            /Http::|Guzzle|curl_/.test(content) && 'HTTP',
            /Mail::|Notification::|notify\(/.test(content) && 'Mail/notifications',
            /Queue::|dispatch\(|event\(/.test(content) && 'Queue/events',
            /->(create|update|save|delete|forceDelete)\(/.test(content) && 'Model writes',
        ].filter(Boolean).join(', ') || 'Not detected';
        const responseShape = [
            /response\(\)->json|JsonResponse/.test(content) && 'JSON',
            /JsonResource|Resource::/.test(content) && 'Resource',
            /redirect\(/.test(content) && 'Redirect',
            /view\(/.test(content) && 'View',
        ].filter(Boolean).join(', ') || 'Not detected';

        rows.push({
            controller: path.relative(controllerRoot, file).replaceAll(path.sep, '/').replace(/\.php$/, ''),
            lines: linesOf(content),
            methods: methods.join(', ') || '—',
            routes: routeRefs.join(', ') || 'No direct route declaration found',
            auth: file.includes(`${path.sep}Api${path.sep}`)
                ? 'API route group; verify inherited middleware'
                : file.includes(`${path.sep}Admin${path.sep}`)
                    ? 'Admin route group; verify inherited middleware'
                    : 'Web/other; verify route middleware',
            validation,
            policy,
            effects,
            responseShape,
        });
    }

    rows.sort((a, b) => b.lines - a.lines);
    const lines = [
        '# Backend Controller Inventory',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        '**Source:** `app/Http/Controllers` plus route-file references',
        '',
        `The current backend contains **${rows.length} controllers**. The`,
        'middleware column identifies the controller family but intentionally',
        'does not flatten nested Laravel route groups; verify the route file when',
        'extracting a controller.',
        '',
        '| Controller | Lines | Methods | Route references | Middleware context | Validation | Policy | Side effects | Response shape |',
        '| --- | ---: | --- | --- | --- | --- | --- | --- | --- |',
        ...rows.map((item) =>
            [
                '|', code(item.controller), '|', item.lines, '|', escape(item.methods), '|',
                escape(item.routes), '|', escape(item.auth), '|', escape(item.validation), '|',
                escape(item.policy), '|', escape(item.effects), '|', escape(item.responseShape), '|',
            ].join(' ')
        ),
        '',
        '## Phase 0 observations',
        '',
        '- Controller indicators are source heuristics, not a substitute for',
        '  endpoint-level review.',
        '- The largest extraction candidate is `Api/TransactionController`;',
        '  its responsibilities include CRUD, validation, photo handling,',
        '  change logs, ledger updates, and dashboard reads.',
        '- Phase 4 should migrate one resource family at a time, preserving',
        '  response compatibility and adding policy/service tests before removal',
        '  of controller logic.',
        '',
    ];

    return lines.join('\n') + '\n';
}

async function buildMigrationInventory() {
    const files = (await walk(migrationRoot)).filter((file) => file.endsWith('.php')).sort();
    const rows = [];

    for (const file of files) {
        const filename = path.basename(file);
        const content = await fs.readFile(file, 'utf8');
        const tables = [
            ...content.matchAll(/Schema::(?:create|table|dropIfExists)\(\s*['"]([^'"]+)['"]/g),
            ...content.matchAll(/add_[^'"]+_to_([a-zA-Z0-9_]+)/g),
        ].map((match) => match[1]);
        const dependencies = [...content.matchAll(/constrained\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
        const implicitForeignKeys = [...content.matchAll(/foreignId\(\s*['"]([^'"]+)['"]/g)]
            .map((match) => match[1].replace(/_id$/, ''));
        const destructive = /drop(?:IfExists|Column|Foreign)|rename|->change\(/.test(content) ? 'Review required' : 'No destructive operation detected';
        const operation = /Schema::create/.test(content) ? 'Create' : /Schema::table/.test(content) ? 'Alter' : 'Other';
        const down = /function\s+down\s*\(/.test(content) ? 'Present' : 'Missing';

        rows.push({
            migration: filename,
            feature: featureFor(filename),
            operation,
            tables: [...new Set(tables)].join(', ') || 'Not resolved',
            dependencies: [...new Set([...dependencies, ...implicitForeignKeys])].join(', ') || 'None detected',
            destructive,
            down,
        });
    }

    const duplicatePrefixes = new Map();
    for (const row of rows) {
        const prefix = row.migration.split('_').slice(0, 3).join('_');
        duplicatePrefixes.set(prefix, (duplicatePrefixes.get(prefix) ?? 0) + 1);
    }
    const collisions = [...duplicatePrefixes.entries()].filter(([, count]) => count > 1);
    const lines = [
        '# Database Migration Ownership Map',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        '**Source:** `database/migrations` filenames and schema operations',
        '',
        `The current migration chain contains **${rows.length} migrations**.`,
        'Feature ownership is inferred from migration names and should be',
        'confirmed when a feature is actively refactored.',
        '',
        '| Migration | Inferred owner | Operation | Tables | Dependencies | Destructive review | Down method |',
        '| --- | --- | --- | --- | --- | --- | --- |',
        ...rows.map((item) =>
            [
                '|', code(item.migration), '|', escape(item.feature), '|', item.operation, '|',
                escape(item.tables), '|', escape(item.dependencies), '|', escape(item.destructive),
                '|', item.down, '|',
            ].join(' ')
        ),
        '',
        '## Phase 0 observations',
        '',
        `- Duplicate timestamp prefixes detected: ${collisions.length ? collisions.map(([prefix, count]) => `${code(prefix)} (${count})`).join(', ') : 'none'}.`,
        '- Existing migrations must remain append-only once they are applied to',
        '  shared or production databases.',
        '- `down()` presence does not guarantee a safe rollback; destructive',
        '  changes and data backfills require explicit review.',
        '- Phase 5 should add migration linting, fresh-install checks, upgrade',
        '  checks, and documented ownership before any baseline/squash decision.',
        '',
    ];

    return lines.join('\n') + '\n';
}

async function main() {
    await fs.mkdir(outputRoot, { recursive: true });
    const outputs = new Map([
        ['frontend-route-inventory.md', await buildFrontendInventory()],
        ['backend-controller-inventory.md', await buildControllerInventory()],
        ['migration-ownership-map.md', await buildMigrationInventory()],
    ]);

    for (const [filename, content] of outputs) {
        const output = path.join(outputRoot, filename);
        await fs.writeFile(output, content);
        console.log(`Wrote ${path.relative(root, output)}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});