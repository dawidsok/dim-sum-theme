import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const schemeDir = path.join(root, 'scheme');

function schemeFiles() {
  return fs.readdirSync(schemeDir)
    .filter((fileName) => fileName.endsWith('.json') && fileName !== 'schema.json')
    .sort((a, b) => {
      if (a === 'dim-sum.json') return -1;
      if (b === 'dim-sum.json') return 1;
      return a.replace(/\.json$/, '').localeCompare(b.replace(/\.json$/, ''));
    });
}

function readScheme(fileName) {
  return {
    ...JSON.parse(fs.readFileSync(path.join(schemeDir, fileName), 'utf8')),
    fileName,
  };
}

function write(rel, content) {
  const file = path.join(root, rel);
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  if (check) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current !== normalized) {
      console.error(`${rel} is not up to date`);
      process.exitCode = 1;
    }
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized);
  console.log(`wrote ${rel}`);
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function colorFor(scheme, value) {
  if (value.startsWith('#')) return value;
  const color = scheme.colors[value];
  if (!color) throw new Error(`${scheme.fileName}: unknown color token ${value}`);
  return color;
}

function token(scheme, map, key) {
  return colorFor(scheme, map[key]);
}

function ansiColors(scheme) {
  const names = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
  ];
  return names.map((name) => ({ name, color: token(scheme, scheme.ansi, name) }));
}

function hexToRgb(hex) {
  const raw = hex.replace('#', '');
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

function contrastText(hex) {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.52 ? '#161616' : '#f7f7f2';
}

function syntax(scheme) {
  const s = scheme.syntax;
  return {
    comment: colorFor(scheme, s.comment),
    keyword: colorFor(scheme, s.keyword),
    fn: colorFor(scheme, s.function),
    string: colorFor(scheme, s.string),
    number: colorFor(scheme, s.number),
    constant: colorFor(scheme, s.constant),
    type: colorFor(scheme, s.type),
    property: colorFor(scheme, s.property),
    punctuation: colorFor(scheme, s.punctuation),
    operator: colorFor(scheme, s.operator),
    preproc: colorFor(scheme, s.preproc),
  };
}

function line(parts, x, y, fontSize = 13) {
  const spans = parts.map(([text, fill, weight = '400', style = 'normal']) => (
    `<tspan fill="${fill}" font-weight="${weight}" font-style="${style}">${esc(text)}</tspan>`
  )).join('');
  return `<text x="${x}" y="${y}" font-size="${fontSize}">${spans}</text>`;
}

function panel({ title, x, y, w, h, lines }, scheme) {
  const p = scheme.colors;
  const muted = colorFor(scheme, scheme.syntax.comment);
  const border = token(scheme, scheme.ui, 'border');
  const gutter = token(scheme, scheme.ui, 'lineNumber');
  const body = lines.map((parts, index) => [
    `<text x="${x + 22}" y="${y + 49 + index * 21}" text-anchor="end" fill="${gutter}" font-size="11">${index + 1}</text>`,
    line(parts, x + 38, y + 49 + index * 21),
  ].join('\n')).join('\n');

  return `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${p.bg}" stroke="${border}"/>
  <rect x="${x}" y="${y}" width="${w}" height="31" rx="14" fill="${p.bg1}"/>
  <rect x="${x}" y="${y + 30}" width="${w}" height="1" fill="${border}"/>
  <text x="${x + 18}" y="${y + 21}" fill="${muted}" font-size="11">${esc(title)}</text>
  ${body}
</g>`;
}

function swatches(scheme, x, y) {
  const colors = ansiColors(scheme);
  const fg = token(scheme, scheme.ui, 'foreground');
  const muted = colorFor(scheme, scheme.syntax.comment);
  const border = token(scheme, scheme.ui, 'border');
  const labels = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];

  const blocks = colors.map(({ color }, index) => {
    const col = index % 8;
    const row = Math.floor(index / 8);
    const sx = x + col * 96;
    const sy = y + row * 35;
    return `<g>
  <rect x="${sx}" y="${sy}" width="78" height="22" rx="5" fill="${color}" stroke="${border}" stroke-opacity="0.55"/>
  <text x="${sx + 39}" y="${sy + 15}" text-anchor="middle" fill="${contrastText(color)}" font-size="10" font-weight="700">${labels[index]}</text>
</g>`;
  }).join('\n');

  return `<g>
  <text x="${x}" y="${y - 14}" fill="${fg}" font-size="13" font-weight="700">ANSI palette</text>
  <text x="${x + 100}" y="${y - 14}" fill="${muted}" font-size="12">normal and bright swatches</text>
  ${blocks}
</g>`;
}

function snippets(scheme) {
  const p = scheme.colors;
  const t = syntax(scheme);
  const fg = token(scheme, scheme.ui, 'foreground');
  const slug = scheme.slug;

  return [
    {
      title: 'theme.go',
      lines: [
        [['package', t.keyword, '700'], [' theme', fg]],
        [['func', t.keyword, '700'], [' Accent', t.fn], ['(', t.punctuation], ['name ', fg], ['string', t.type], [') ', t.punctuation], ['string', t.type], [' {', t.punctuation]],
        [['  return ', t.keyword], ['palette', t.property], ['[', t.punctuation], ['name', fg], [']', t.punctuation], ['.', t.punctuation], ['Accent', t.property]],
        [['}', t.punctuation], [' // tiny Go sample', t.comment, '400', 'italic']],
      ],
    },
    {
      title: 'theme.ts',
      lines: [
        [['const', t.keyword, '700'], [' theme', fg], [' = ', t.operator], ['loadTheme', t.fn], ['(', t.punctuation], [`'${slug}'`, t.string], [');', t.punctuation]],
        [['export', t.keyword, '700'], [' function', t.keyword], [' apply', t.fn], ['(', t.punctuation], ['target', fg], [': ', t.punctuation], ['Terminal', t.type], [') {', t.punctuation]],
        [['  return ', t.keyword], ['target', fg], ['.', t.punctuation], ['with', t.fn], ['({ ', t.punctuation], ['bg', t.property], [': ', t.punctuation], ['theme', fg], ['.', t.punctuation], ['bg', t.property], [' });', t.punctuation]],
        [['}', t.punctuation], [' // TypeScript preview', t.comment, '400', 'italic']],
      ],
    },
    {
      title: 'build.sh',
      lines: [
        [['#!/usr/bin/env bash', t.comment, '400', 'italic']],
        [['set', t.keyword, '700'], [' -euo pipefail', fg]],
        [['theme', t.property], ['=', t.operator], ['"${1:-', t.string], [slug, t.constant], ['}"', t.string]],
        [['printf', t.fn], [' ', fg], ["'building %s\\n'", t.string], [' ', fg], ['"$theme"', t.string]],
      ],
    },
    {
      title: 'palette.py',
      lines: [
        [['from', t.keyword, '700'], [' pathlib ', fg], ['import', t.keyword, '700'], [' Path', t.type]],
        [['def', t.keyword, '700'], [' load_theme', t.fn], ['(', t.punctuation], ['slug', fg], [': ', t.punctuation], ['str', t.type], [') -> ', t.punctuation], ['dict', t.type], [':', t.punctuation]],
        [['    file', t.property], [' = ', t.operator], ['Path', t.fn], ['(', t.punctuation], ['"scheme"', t.string], [') / ', t.operator], ['f"{slug}.json"', t.string]],
        [['    return ', t.keyword], ['read_json', t.fn], ['(', t.punctuation], ['file', fg], [')', t.punctuation]],
      ],
    },
  ];
}

function screenshot(scheme) {
  const p = scheme.colors;
  const bg = token(scheme, scheme.ui, 'background');
  const fg = token(scheme, scheme.ui, 'foreground');
  const border = token(scheme, scheme.ui, 'border');
  const accent = colorFor(scheme, scheme.syntax.function);
  const muted = colorFor(scheme, scheme.syntax.comment);
  const shot = snippets(scheme);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" xml:space="preserve" role="img" aria-labelledby="title desc">
  <title id="title">${esc(scheme.name)} terminal screenshot</title>
  <desc id="desc">Generated terminal-style screenshot with Go, TypeScript, Bash, Python, and ANSI color swatches for ${esc(scheme.name)}.</desc>
  <rect width="900" height="560" fill="${bg}"/>
  <rect x="24" y="24" width="852" height="512" rx="22" fill="${p.bg1}" stroke="${border}"/>
  <rect x="24" y="24" width="852" height="48" rx="22" fill="${p.bg2}"/>
  <rect x="24" y="71" width="852" height="1" fill="${border}"/>

  <circle cx="50" cy="48" r="6" fill="${p.red}"/>
  <circle cx="72" cy="48" r="6" fill="${p.yellow}"/>
  <circle cx="94" cy="48" r="6" fill="${p.green}"/>
  <text x="124" y="53" fill="${fg}" font-size="14" font-weight="800">${esc(scheme.name)}</text>
  <text x="${852}" y="53" fill="${muted}" font-size="12" text-anchor="end">${esc(scheme.slug)} · ${esc(scheme.appearance)}</text>

  <text x="52" y="104" fill="${accent}" font-size="14" font-weight="800">preview@dim-sum-theme</text>
  <text x="252" y="104" fill="${muted}" font-size="12">code samples + terminal swatches</text>

  ${panel({ ...shot[0], x: 52, y: 122, w: 385, h: 126 }, scheme)}
  ${panel({ ...shot[1], x: 463, y: 122, w: 385, h: 126 }, scheme)}
  ${panel({ ...shot[2], x: 52, y: 272, w: 385, h: 126 }, scheme)}
  ${panel({ ...shot[3], x: 463, y: 272, w: 385, h: 126 }, scheme)}

  ${swatches(scheme, 64, 452)}
  <text x="836" y="516" fill="${muted}" font-size="11" text-anchor="end">Generated by scripts/screenshot.mjs</text>
</svg>`;
}

for (const scheme of schemeFiles().map(readScheme)) {
  write(`assets/screenshots/${scheme.slug}.svg`, screenshot(scheme));
}
