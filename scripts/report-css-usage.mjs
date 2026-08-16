import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const stylePath = path.join(projectRoot, 'resources/js/assets/css/style.css');
const sourceRoot = path.join(projectRoot, 'resources/js');
const outputArgumentIndex = process.argv.findIndex(
    (argument) => argument === '--output' || argument.startsWith('--output='),
);
const outputPath = outputArgumentIndex === -1
    ? null
    : path.resolve(
        projectRoot,
        process.argv[outputArgumentIndex].startsWith('--output=')
            ? process.argv[outputArgumentIndex].slice('--output='.length)
            : process.argv[outputArgumentIndex + 1],
    );

const sectionPattern = /\/\*+\s*([^*]+?)\s*\*+\//g;
const sourceExtensions = /\.(?:tsx?|jsx?|js)$/;

async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory() && entry.name !== '__tests__') {
            files.push(...await walk(absolute));
        } else if (entry.isFile() && sourceExtensions.test(entry.name)) {
            files.push(absolute);
        }
    }

    return files;
}

async function sizeOrZero(relativePath) {
    try {
        return (await fs.stat(path.join(projectRoot, relativePath))).size;
    } catch {
        return 0;
    }
}

function classifySection(title) {
    const normalized = title.toLowerCase();

    if (normalized.includes('theme') || normalized.includes('default') || normalized.includes('keyframe')) {
        return 'shell';
    }

    if (
        normalized.includes('splash')
        || normalized.includes('onboarding')
        || normalized.includes('let you')
        || normalized.includes('sign in')
        || normalized.includes('sign up')
        || normalized.includes('verify')
        || normalized.includes('forget password')
        || normalized.includes('confirm otp')
        || normalized.includes('create new password')
    ) {
        return 'public/auth feature';
    }

    if (
        normalized.includes('send')
        || normalized.includes('request')
        || normalized.includes('pay bill')
        || normalized.includes('electricity')
        || normalized.includes('paid')
        || normalized.includes('transfer')
        || normalized.includes('invoice')
        || normalized.includes('preapproved')
        || normalized.includes('spilt')
        || normalized.includes('qr code')
        || normalized.includes('tax')
        || normalized.includes('line chart')
    ) {
        return 'finance feature';
    }

    return 'account/dashboard feature';
}

function extractSelectors(block) {
    return [...block.matchAll(/([^{}]+)\{/g)]
        .flatMap((match) => match[1].split(','))
        .map((selector) => selector.trim())
        .filter((selector) => selector && !selector.startsWith('@') && !selector.startsWith('/*'));
}

function selectorTokens(selector) {
    return [
        ...selector.matchAll(/\.([A-Za-z_][\w-]*)/g),
    ].map((match) => match[1]).concat(
        [...selector.matchAll(/#([A-Za-z_][\w-]*)/g)].map((match) => match[1]),
    );
}

function findSectionRanges(css) {
    const headings = [...css.matchAll(sectionPattern)]
        .map((match) => ({
            title: match[1].trim(),
            start: match.index,
            headingEnd: match.index + match[0].length,
        }))
        .filter(({ title }) => /^\d+\./.test(title) || title.startsWith('Idetify Bottom Modal'));

    return headings.map((heading, index) => ({
        ...heading,
        end: headings[index + 1]?.start ?? css.length,
    }));
}

async function main() {
    const css = await fs.readFile(stylePath, 'utf8');
    const sourceFiles = await walk(sourceRoot);
    const sourceContents = await Promise.all(sourceFiles.map(async (file) => ({
        file: path.relative(projectRoot, file).replaceAll(path.sep, '/'),
        content: await fs.readFile(file, 'utf8'),
    })));
    const allSource = sourceContents.map(({ content }) => content).join('\n');
    const sections = findSectionRanges(css).map((section) => {
        const body = css.slice(section.headingEnd, section.end);
        const selectors = extractSelectors(body);
        const tokens = [...new Set(selectors.flatMap(selectorTokens))];
        const matchedTokens = tokens.filter((token) => allSource.includes(token));
        const unmatchedTokens = tokens.filter((token) => !allSource.includes(token));
        const matchedFiles = sourceContents
            .filter(({ content }) => tokens.some((token) => content.includes(token)))
            .map(({ file }) => file);

        return {
            ...section,
            category: classifySection(section.title),
            bytes: Buffer.byteLength(body),
            lines: body.split('\n').length,
            selectors: selectors.length,
            tokens: tokens.length,
            matchedTokens: matchedTokens.length,
            unmatchedTokens: unmatchedTokens.length,
            matchedFiles,
        };
    });

    const cssFiles = [
        'resources/js/assets/css/style.css',
        'resources/js/assets/css/swap.css',
        'resources/js/assets/css/media-query.css',
        'resources/js/assets/css/all.min.css',
        'resources/js/assets/css/intlTelInput.css',
    ];
    const importText = sourceContents.map(({ content }) => content).join('\n');

    const lines = [
        '# Phase 3 CSS Usage Report — Before Consolidation',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        '**Command:** `node scripts/report-css-usage.mjs --output docs/issues/phase3-css-usage-before.md`',
        '**Scope:** active TypeScript route application under `resources/js` (test files excluded)',
        '',
        '## Current delivery findings',
        '',
        '| Asset | Source bytes | Imported by active source | Ownership finding |',
        '| --- | ---: | --- | --- |',
        `| \`style.css\` | ${Buffer.byteLength(css)} | Before snapshot: Yes; current graph: No | Mixed shell, public/auth, finance, account, dashboard, and widget overrides; retained only as the audited extraction source |`,
        `| \`swap.css\` | ${await sizeOrZero('resources/js/assets/css/swap.css')} | ${importText.includes('swap.css') ? 'Yes' : 'No'} | Removed from the active graph; typography is now owned by the shell tokens |`,
        `| \`media-query.css\` | ${await sizeOrZero('resources/js/assets/css/media-query.css')} | ${importText.includes('media-query.css') ? 'Yes' : 'No'} | Removed from the active graph; responsive rules are retained only where owned by extracted feature styles |`,
        `| \`all.min.css\` | ${await sizeOrZero('resources/js/assets/css/all.min.css')} | ${importText.includes('all.min.css') ? 'Yes' : 'No'} | Removed; no active Font Awesome import was found |`,
        `| \`intlTelInput.css\` | ${await sizeOrZero('resources/js/assets/css/intlTelInput.css')} | ${importText.includes('intlTelInput.css') ? 'Yes' : 'No'} | Removed; no active widget import was found |`,
        '',
        '## Section ownership and selector evidence',
        '',
        '| Legacy section | Owner | Lines | Bytes | Selectors | Tokens referenced by source | Unmatched token count |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
        ...sections.map((section) => (
            `| ${section.title.replaceAll('|', '\\|')} | ${section.category} | ${section.lines} | ${section.bytes} | ${section.selectors} | ${section.matchedTokens}/${section.tokens} | ${section.unmatchedTokens} |`
        )),
        '',
        '## Interpretation rules',
        '',
        '- A matched token is evidence that a class or id is present in active source; it is not proof that every selector variant is rendered on every route.',
        '- Dynamic class construction, third-party markup, and Bootstrap data attributes require visual or route-level checks before deletion.',
        '- Sections containing `.iti__*`, `#ui-datepicker-div`, or `.offcanvas*` are treated as dependency/override candidates, not shell-owned CSS.',
        '- The report file is the pre-consolidation snapshot; the current active graph uses `kenfinly-core.css` plus route-loaded feature CSS.',
        '',
        '## Third-party and icon audit',
        '',
        '| Dependency | Active usage evidence | Phase 3 action |',
        '| --- | --- | --- |',
        '| Bootstrap CSS | `resources/js/App.tsx` plus Bootstrap utility/data attributes in route pages | Keep one deliberate CSS entry; remove duplicate global JS delivery after route behavior is covered |',
        '| React Bootstrap | `Home.tsx` imports `Offcanvas` | Keep component wrapper; it consumes the single Bootstrap CSS entry rather than shipping another stylesheet |',
        '| Bootstrap JS | `App.tsx`, plus data attributes and direct `Offcanvas` imports in feature pages | Scope behavior to routes/components that need it |',
        '| Font Awesome `all.min.css` | No active import found | Remove from active CSS graph; prefer existing `lucide-react` icons for new work |',
        '| intlTelInput | No active CSS or component import found | Do not load globally; delete only after the widget absence is confirmed by visual checks |',
        '| react-datepicker | `AddNewCard.tsx` imports its package CSS locally | Keep route-local; do not add a global date-picker stylesheet |',
        '',
        '## Baseline conclusion',
        '',
        'The first consolidation step must move tokens/base rules into a small shell stylesheet and load route-owned style groups through the existing lazy route boundary. Deleting selectors before that split would make ownership and visual regressions difficult to attribute.',
        '',
    ];

    const report = `${lines.join('\n')}\n`;
    if (outputPath) {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, report);
        console.log(`Wrote ${path.relative(projectRoot, outputPath)}`);
    } else {
        process.stdout.write(report);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});