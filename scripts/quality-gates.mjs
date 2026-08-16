import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict') || process.env.QUALITY_GATES_STRICT === '1';
const reportArgument = process.argv.find((argument) => argument.startsWith('--report='));
const reportPath = reportArgument
    ? path.resolve(root, reportArgument.slice('--report='.length))
    : null;
const baseArgument = process.argv.find((argument) => argument.startsWith('--base='));
const configuredBase = baseArgument?.slice('--base='.length)
    || process.env.QUALITY_GATES_BASE
    || null;

const results = [];
const warnings = [];
const failures = [];

function relative(file) {
    return path.relative(root, file).replaceAll(path.sep, '/');
}

function addResult(name, passed, detail) {
    results.push({ name, passed, detail });
    if (!passed) failures.push(`${name}: ${detail}`);
}

function warn(name, detail) {
    warnings.push(`${name}: ${detail}`);
}

async function readIfExists(file) {
    try {
        return await fs.readFile(file, 'utf8');
    } catch {
        return null;
    }
}

async function walk(directory, predicate = () => true) {
    const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walk(absolute, predicate));
        } else if (predicate(absolute)) {
            files.push(absolute);
        }
    }

    return files;
}

function lineCount(content) {
    return content ? content.split(/\r?\n/).length : 0;
}

function gitFiles(args) {
    try {
        return execFileSync('git', args, { cwd: root, encoding: 'utf8' })
            .split(/\r?\n/)
            .map((file) => file.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

function changedFiles() {
    if (configuredBase) {
        return [...new Set([
            ...gitFiles(['diff', '--name-only', `${configuredBase}...HEAD`]),
            ...gitFiles(['diff', '--name-only', configuredBase]),
        ])];
    }

    return [...new Set([
        ...gitFiles(['diff', '--name-only', 'HEAD']),
        ...gitFiles(['diff', '--cached', '--name-only']),
    ])];
}

function hasAny(content, patterns) {
    return patterns.some((pattern) => pattern.test(content));
}

function parseRoutePagePaths() {
    const routeFiles = [
        'resources/js/app/routes/publicRoutes.tsx',
        'resources/js/app/routes/authenticatedRoutes.tsx',
        'resources/js/app/routes/featureRoutes.tsx',
        'resources/js/app/routes/adminRoutes.tsx',
    ];
    const pages = [];

    for (const routeFile of routeFiles) {
        const content = readFileSync(path.join(root, routeFile));
        for (const match of content.matchAll(/route\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g)) {
            pages.push({
                source: `resources/js/pages/${match[1]}`,
                routeFile,
                isAdmin: routeFile.includes('adminRoutes'),
                isHalo: match[1].toLowerCase().includes('halo/'),
                isLazyFeature: !routeFile.includes('publicRoutes')
                    && !routeFile.includes('authenticatedRoutes'),
            });
        }
    }

    return pages;
}

function readFileSync(file) {
    try {
        return requireFile(file);
    } catch {
        return '';
    }
}

function requireFile(file) {
    return execFileSync('cat', [file], { cwd: root, encoding: 'utf8' });
}

async function checkPageSizes(files) {
    const changedPages = files
        .filter((file) => /^resources\/js\/pages\/.+\.(?:tsx?|jsx?)$/.test(file))
        .map((file) => path.join(root, file));
    const exceptions = new Set(
        (process.env.QUALITY_GATE_PAGE_EXCEPTIONS ?? '')
            .split(',')
            .map((file) => file.trim())
            .filter(Boolean),
    );
    const violations = [];

    for (const file of changedPages) {
        const lines = lineCount(await fs.readFile(file, 'utf8'));
        if (lines > 500 && !exceptions.has(relative(file))) {
            violations.push(`${relative(file)} (${lines} lines)`);
        }
    }

    if (!changedPages.length) {
        addResult('route-level page size', true, 'No changed route-level page modules to evaluate.');
    } else if (violations.length) {
        addResult(
            'route-level page size',
            false,
            `New or changed page modules exceed 500 lines: ${violations.join(', ')}. `
                + 'Use QUALITY_GATE_PAGE_EXCEPTIONS only for an approved exception.',
        );
    } else {
        addResult('route-level page size', true, `Checked ${changedPages.length} changed page module(s).`);
    }
}

async function checkControllerBoundaries(files) {
    const changedControllers = files
        .filter((file) => /^app\/Http\/Controllers\/.+\.php$/.test(file))
        .map((file) => path.join(root, file));
    const violations = [];
    const inlineValidation = [];
    const massAssignment = [];

    const responsibilityPatterns = {
        transport: /\$request\b|JsonResponse|response\(\)->json|return\s+new\s+\w+Resource/,
        persistence: /DB::|->(?:create|update|save|delete|forceDelete|increment|decrement)\(|->transaction\(/,
        fileHandling: /Storage::|UploadedFile|->store(?:As)?\(|->delete\(/,
        analyticsReads: /\b(?:analytics|dashboard|summary|chart|trend|report)\b/i,
    };

    for (const file of changedControllers) {
        const content = await fs.readFile(file, 'utf8');
        const responsibilities = Object.entries(responsibilityPatterns)
            .filter(([, pattern]) => pattern.test(content))
            .map(([name]) => name);

        if (responsibilities.includes('transport')
            && responsibilities.includes('persistence')
            && responsibilities.includes('fileHandling')
            && responsibilities.includes('analyticsReads')) {
            violations.push(`${relative(file)} (${responsibilities.join(', ')})`);
        }
        if (/\$request->validate\(|Validator::make\(/.test(content)) {
            inlineValidation.push(relative(file));
        }
        if (/\$request->all\(\)|Model::create\(\s*\$request->|::create\(\s*\$request->/.test(content)) {
            massAssignment.push(relative(file));
        }
    }

    if (!changedControllers.length) {
        addResult('controller boundaries', true, 'No changed controllers to evaluate.');
    } else if (violations.length) {
        addResult(
            'controller boundaries',
            false,
            `Controller(s) mix transport, persistence, file handling, and analytics: ${violations.join('; ')}`,
        );
    } else {
        addResult('controller boundaries', true, `Checked ${changedControllers.length} changed controller(s).`);
    }

    if (inlineValidation.length) {
        addResult(
            'validated endpoint payloads',
            strict ? false : true,
            `Inline validation remains in changed controller(s): ${inlineValidation.join(', ')}`
                + (strict ? '' : ' (warning until strict rollout).'),
        );
    } else if (massAssignment.length) {
        addResult(
            'validated endpoint payloads',
            strict ? false : true,
            `Raw request mass assignment remains in: ${massAssignment.join(', ')}`
                + (strict ? '' : ' (warning until strict rollout).'),
        );
    } else if (!changedControllers.length) {
        addResult('validated endpoint payloads', true, 'No changed controllers to evaluate.');
    } else {
        addResult('validated endpoint payloads', true, 'Changed controllers use explicit request payload paths.');
    }
}

async function checkLazyBundle(routePages) {
    const manifestPath = path.join(root, 'public/build/manifest.json');
    const manifestContent = await readIfExists(manifestPath);

    if (!manifestContent) {
        addResult('lazy route bundle', false, 'public/build/manifest.json is missing; run npm run build first.');
        return null;
    }

    let manifest;
    try {
        manifest = JSON.parse(manifestContent);
    } catch {
        addResult('lazy route bundle', false, 'public/build/manifest.json is not valid JSON.');
        return null;
    }

    const entry = Object.values(manifest).find((item) => item.isEntry && /\.js$/i.test(item.file));
    const dynamicEntries = Object.entries(manifest)
        .filter(([, item]) => item.isDynamicEntry);
    const missingLazyPages = routePages
        .filter((page) => page.isLazyFeature || page.isAdmin || page.isHalo)
        .filter((page) => !manifest[page.source]?.isDynamicEntry)
        .map((page) => page.source);

    if (!entry) {
        addResult('lazy route bundle', false, 'No JavaScript entry was found in the Vite manifest.');
        return { manifest, entry: null };
    }

    const entryFile = path.join(root, 'public/build', entry.file);
    const dynamicImportSet = new Set(entry.dynamicImports ?? []);
    const missingDynamicImports = routePages
        .filter((page) => page.isAdmin || page.isHalo)
        .filter((page) => !dynamicImportSet.has(page.source))
        .map((page) => page.source);

    if (missingLazyPages.length) {
        addResult(
            'lazy route bundle',
            false,
            `Route page modules are not dynamic manifest entries: ${missingLazyPages.slice(0, 12).join(', ')}`
                + (missingLazyPages.length > 12 ? ` (+${missingLazyPages.length - 12} more)` : ''),
        );
    } else if (missingDynamicImports.length) {
        addResult(
            'lazy route bundle',
            false,
            `Admin/Halo pages are not listed as dynamic imports of the initial entry: ${missingDynamicImports.join(', ')}`,
        );
    } else {
        addResult(
            'lazy route bundle',
            true,
            `Initial entry ${entry.file} has ${dynamicEntries.length} dynamic route/module entries; `
                + 'feature and Halo pages are not initial manifest entries.',
        );
    }

    return { manifest, entry };
}

async function checkGlobalCss() {
    const shellFiles = [
        'resources/js/App.tsx',
        'resources/js/main.tsx',
        'resources/css/app.css',
    ];
    const forbiddenGlobalCss = [
        'style.css',
        'swap.css',
        'media-query.css',
        'all.min.css',
        'intlTelInput.css',
    ];
    const imports = [];

    for (const file of shellFiles) {
        const content = await readIfExists(path.join(root, file)) ?? '';
        for (const css of forbiddenGlobalCss) {
            if (content.includes(css)) imports.push(`${file} -> ${css}`);
        }
    }

    if (imports.length) {
        addResult(
            'global CSS ownership',
            false,
            `Legacy/feature stylesheet imported globally: ${imports.join(', ')}`,
        );
    } else {
        addResult(
            'global CSS ownership',
            true,
            'Global entrypoints contain shell/tokens/framework imports only; legacy feature bundles are route-owned.',
        );
    }
}

function bundleMetrics(bundle) {
    if (!bundle?.entry) return null;
    const entryPath = path.join(root, 'public/build', bundle.entry.file);
    const entryBytes = fsSyncStat(entryPath);
    const cssFiles = Object.values(bundle.manifest)
        .filter((item) => item.isEntry && Array.isArray(item.css))
        .flatMap((item) => item.css)
        .map((file) => path.join(root, 'public/build', file));
    const cssBytes = [...new Set(cssFiles)].reduce((total, file) => total + fsSyncStat(file), 0);

    return {
        initialJavaScriptBytes: entryBytes,
        initialJavaScriptGzipBytes: gzipBytes(entryPath),
        entryCssBytes: cssBytes,
        dynamicEntryCount: Object.values(bundle.manifest).filter((item) => item.isDynamicEntry).length,
    };
}

function fsSyncStat(file) {
    try {
        return requireStat(file);
    } catch {
        return 0;
    }
}

function requireStat(file) {
    return Number(execFileSync('stat', ['-c', '%s', file], { cwd: root, encoding: 'utf8' }).trim());
}

function gzipBytes(file) {
    try {
        return gzipSync(requireBuffer(file), { level: 9 }).length;
    } catch {
        return 0;
    }
}

function requireBuffer(file) {
    return execFileSync('cat', [file], { cwd: root, encoding: 'buffer' });
}

async function checkBundleBudget(bundle) {
    const metrics = bundleMetrics(bundle);
    if (!metrics) {
        addResult('bundle and CSS size visibility', false, 'Bundle metrics unavailable.');
        return null;
    }

    const baselinePath = path.join(root, 'docs/issues/quality-gates-baseline.json');
    const baselineContent = await readIfExists(baselinePath);
    let baseline = null;
    if (baselineContent) {
        try {
            baseline = JSON.parse(baselineContent);
        } catch {
            addResult('bundle and CSS size visibility', false, `${relative(baselinePath)} is invalid JSON.`);
            return metrics;
        }
    }

    const tolerance = Number(process.env.QUALITY_GATE_SIZE_TOLERANCE ?? '0.05');
    const regressions = [];
    if (baseline?.initialJavaScriptGzipBytes
        && metrics.initialJavaScriptGzipBytes > baseline.initialJavaScriptGzipBytes * (1 + tolerance)) {
        regressions.push(
            `initial JS gzip ${metrics.initialJavaScriptGzipBytes} > ${baseline.initialJavaScriptGzipBytes} baseline`,
        );
    }
    if (baseline?.entryCssBytes
        && metrics.entryCssBytes > baseline.entryCssBytes * (1 + tolerance)) {
        regressions.push(`entry CSS ${metrics.entryCssBytes} > ${baseline.entryCssBytes} baseline`);
    }

    addResult(
        'bundle and CSS size visibility',
        !regressions.length,
        `${metrics.initialJavaScriptGzipBytes} B initial JS gzip, ${metrics.entryCssBytes} B entry CSS, `
            + `${metrics.dynamicEntryCount} dynamic entries`
            + (regressions.length ? `; regressions: ${regressions.join('; ')}` : ''),
    );

    return metrics;
}

async function checkFocusedTests(files) {
    const extractedFiles = files.filter((file) => (
        /^resources\/js\/features\//.test(file)
        || /^app\/Services\//.test(file)
        || /^app\/Http\/Requests\//.test(file)
        || /^app\/Policies\//.test(file)
    ));
    const changedTests = files.filter((file) => /(?:^|\/)(?:tests|__tests__)\//.test(file));

    if (!extractedFiles.length) {
        addResult('focused extracted-feature tests', true, 'No newly extracted feature boundary detected.');
    } else if (!changedTests.length) {
        addResult(
            'focused extracted-feature tests',
            strict ? false : true,
            `${extractedFiles.length} extracted boundary file(s) changed without a focused test change`
                + (strict ? '.' : ' (warning until strict rollout).'),
        );
    } else {
        addResult(
            'focused extracted-feature tests',
            true,
            `${extractedFiles.length} extracted boundary file(s) accompanied by ${changedTests.length} test file(s).`,
        );
    }
}

async function main() {
    const files = changedFiles();
    const routePages = parseRoutePagePaths();

    await checkPageSizes(files);
    await checkControllerBoundaries(files);
    const bundle = await checkLazyBundle(routePages);
    await checkGlobalCss();
    const metrics = await checkBundleBudget(bundle);
    await checkFocusedTests(files);

    const report = [
        '# Refactor Quality Gates',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        `**Mode:** ${strict ? 'strict' : 'baseline-aware'}`,
        `**Changed-file scope:** ${configuredBase ? `git diff from \`${configuredBase}\`` : 'working tree and index'}`,
        '',
        '## Results',
        '',
        '| Gate | Result | Detail |',
        '| --- | --- | --- |',
        ...results.map((result) => `| ${result.name} | ${result.passed ? 'PASS' : 'FAIL'} | ${result.detail.replaceAll('|', '\\|')} |`),
        '',
        '## Current bundle metrics',
        '',
        metrics
            ? [
                '| Metric | Bytes |',
                '| --- | ---: |',
                `| Initial JavaScript | ${metrics.initialJavaScriptBytes} |`,
                `| Initial JavaScript gzip estimate | ${metrics.initialJavaScriptGzipBytes} |`,
                `| Entry CSS | ${metrics.entryCssBytes} |`,
                `| Dynamic manifest entries | ${metrics.dynamicEntryCount} |`,
            ].join('\n')
            : 'Bundle metrics unavailable.',
        '',
        '## Interpretation',
        '',
        '- Baseline-aware mode evaluates changed files and reports existing debt without claiming it is fixed.',
        '- Strict mode is intended for the enforcement point after the baseline debt is addressed.',
        '- Bundle and CSS metrics are compared with `docs/issues/quality-gates-baseline.json` when present.',
        '',
    ].join('\n');

    if (reportPath) {
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, `${report}\n`);
    }

    process.stdout.write(`${report}\n`);
    for (const warning of warnings) console.warn(`WARNING ${warning}`);
    if (failures.length) {
        console.error('\nQuality gates failed:\n- ' + failures.join('\n- '));
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});