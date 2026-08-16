import { gzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const buildRoot = path.join(projectRoot, 'public', 'build');
const manifestPath = path.join(buildRoot, 'manifest.json');

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KiB`;
    return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

function markdownEscape(value) {
    return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walk(absolute));
        } else {
            files.push(absolute);
        }
    }

    return files;
}

async function main() {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const files = (await walk(buildRoot))
        .filter((file) => path.basename(file) !== 'manifest.json');

    const rows = await Promise.all(files.map(async (absolute) => {
        const buffer = await fs.readFile(absolute);
        const relative = path.relative(buildRoot, absolute).replaceAll(path.sep, '/');

        return {
            file: relative,
            bytes: buffer.length,
            gzipBytes: gzipSync(buffer, { level: 9 }).length,
        };
    }));

    const sorted = rows.sort((a, b) => b.bytes - a.bytes);
    const codeAndStyles = sorted.filter(({ file }) => /\.(?:js|css)$/i.test(file));
    const allTotals = rows.reduce((totals, row) => ({
        bytes: totals.bytes + row.bytes,
        gzipBytes: totals.gzipBytes + row.gzipBytes,
    }), { bytes: 0, gzipBytes: 0 });
    const codeTotals = codeAndStyles.reduce((totals, row) => ({
        bytes: totals.bytes + row.bytes,
        gzipBytes: totals.gzipBytes + row.gzipBytes,
    }), { bytes: 0, gzipBytes: 0 });
    const entries = Object.entries(manifest)
        .filter(([, entry]) => entry.isEntry)
        .map(([source, entry]) => ({
            source,
            file: entry.file,
            css: entry.css ?? [],
        }));

    const generatedAt = new Date().toISOString();
    const lines = [
        '# Frontend Production Bundle Baseline',
        '',
        `**Generated:** ${generatedAt}`,
        '**Command:** `npm run baseline:bundle`',
        '**Build:** Vite production build from the current working tree',
        '',
        '## Summary',
        '',
        '| Measure | Raw | Gzip estimate |',
        '| --- | ---: | ---: |',
        `| All emitted files (${rows.length}) | ${formatBytes(allTotals.bytes)} | ${formatBytes(allTotals.gzipBytes)} |`,
        `| JavaScript and CSS (${codeAndStyles.length}) | ${formatBytes(codeTotals.bytes)} | ${formatBytes(codeTotals.gzipBytes)} |`,
        '',
        '> Gzip values are local estimates from emitted files. They do not include',
        '> transfer headers, CDN compression differences, or browser caching.',
        '',
        '## Vite entrypoints',
        '',
        '| Source | JavaScript output | CSS output |',
        '| --- | --- | --- |',
        ...entries.map(({ source, file, css }) =>
            `| \`${markdownEscape(source)}\` | \`${markdownEscape(file)}\` | ${css.length ? css.map((item) => `\`${markdownEscape(item)}\``).join(', ') : '—'} |`
        ),
        '',
        '## Largest JavaScript/CSS chunks',
        '',
        '| Rank | File | Raw | Gzip estimate |',
        '| ---: | --- | ---: | ---: |',
        ...codeAndStyles.slice(0, 20).map((row, index) =>
            `| ${index + 1} | \`${markdownEscape(row.file)}\` | ${formatBytes(row.bytes)} | ${formatBytes(row.gzipBytes)} |`
        ),
        '',
        '## Largest emitted assets',
        '',
        '| Rank | File | Raw | Gzip estimate |',
        '| ---: | --- | ---: | ---: |',
        ...sorted.slice(0, 20).map((row, index) =>
            `| ${index + 1} | \`${markdownEscape(row.file)}\` | ${formatBytes(row.bytes)} | ${formatBytes(row.gzipBytes)} |`
        ),
        '',
        '## Interpretation',
        '',
        '- The current build has one main JavaScript entry, so route code is part',
        '  of the initial JavaScript payload until Phase 1 introduces lazy routes.',
        '- This report measures emitted output only. It intentionally does not',
        '  claim that every emitted image is loaded on the first page.',
        '- Re-run this command after each delivery or CSS phase and compare the',
        '  entrypoint and chunk tables with this baseline.',
        '',
    ];

    const outputIndex = process.argv.findIndex((argument) => argument === '--output' || argument.startsWith('--output='));
    const outputArgument = outputIndex === -1
        ? null
        : process.argv[outputIndex].startsWith('--output=')
            ? process.argv[outputIndex].slice('--output='.length)
            : process.argv[outputIndex + 1];
    const outputPath = outputArgument ? path.resolve(projectRoot, outputArgument) : null;
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