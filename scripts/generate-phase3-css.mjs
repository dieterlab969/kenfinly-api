import { promises as fs } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'resources/js/assets/css/style.css');
const featureRoot = path.join(projectRoot, 'resources/js/assets/css/features');

const sectionPattern = /\/\*+\s*([^*]+?)\s*\*+\//g;
const sectionGroups = {
    core: new Set(['0', '1', '54']),
    public: new Set(['2', '3', '4', '5', '6']),
    auth: new Set(['7', '11', '15', '16', '17', '18', '51', '53']),
    finance: new Set(['9', '10', '20', '21', '27', '28', '29', '30', '34', '35', '41', '42', '43', '44', '45', '46', '47', '52']),
    account: new Set(['12', '13', '14', '19', '22', '23', '24', '25', '26', '31', '32', '33', '36', '37', '38', '39', '40']),
    dashboard: new Set(['48', '49', '50']),
};

function sectionId(title) {
    const match = title.trim().match(/^(\d+)\./);
    return match?.[1] ?? null;
}

function parseSections(css) {
    const headings = [...css.matchAll(sectionPattern)]
        .map((match) => ({
            title: match[1].trim(),
            start: match.index,
            endOfHeading: match.index + match[0].length,
        }))
        .filter(({ title }) => sectionId(title) !== null || title.startsWith('Idetify Bottom Modal'));

    return headings.map((heading, index) => ({
        ...heading,
        end: headings[index + 1]?.start ?? css.length,
    }));
}

function groupForSection(title) {
    const id = sectionId(title);
    if (id === null) return 'account';

    return Object.entries(sectionGroups).find(([, ids]) => ids.has(id))?.[0] ?? 'account';
}

async function main() {
    const css = await fs.readFile(sourcePath, 'utf8');
    const sections = parseSections(css);
    const grouped = new Map(Object.keys(sectionGroups).map((group) => [group, []]));

    for (const section of sections) {
        const group = groupForSection(section.title);
        grouped.get(group).push(css.slice(section.start, section.end).trim());
    }

    await fs.mkdir(featureRoot, { recursive: true });

    const headers = {
        core: 'Kenfinly shell tokens, typography, base layout, shared utilities, and animations.',
        public: 'Public onboarding and entry screens. Loaded by public routes only.',
        auth: 'Authentication and identity-flow screens. Loaded by identity routes only.',
        finance: 'Payments, transfers, invoices, bills, charts, and finance feature screens.',
        account: 'Account, settings, support, notification, and dashboard-adjacent feature screens.',
        dashboard: 'Home, analytics, chart, navigation, and dashboard feature screens.',
    };

    for (const [group, blocks] of grouped) {
        const destination = group === 'core'
            ? path.join(projectRoot, 'resources/js/assets/css/kenfinly-core.css')
            : path.join(featureRoot, `${group}.css`);
        const content = [
            `/* ${headers[group]} */`,
            '/* Generated from the audited legacy stylesheet by scripts/generate-phase3-css.mjs. */',
            '',
            ...(group === 'core'
                ? [
                    "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');",
                    '',
                    ':root {',
                    "    --font-ui: 'Satoshi', sans-serif;",
                    "    --font-display: 'Poppins', sans-serif;",
                    '}',
                    '',
                ]
                : []),
            blocks.join('\n\n'),
            '',
        ].join('\n');
        await fs.writeFile(destination, content);
        console.log(`Wrote ${path.relative(projectRoot, destination)} (${Buffer.byteLength(content)} bytes)`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});