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
      return a.localeCompare(b);
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
  return [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
  ].map((name) => token(scheme, scheme.ansi, name));
}

const logo = [
  "                 'c.",
  '              ,xNMM.',
  '            .OMMMMo',
  '            OMMM0,',
  "   .;loddo:' loolloddol;.",
  ' cKMMMMMMMMMMNWMMMMMMMMMM0:',
  '.KMMMMMMMMMMMMMMMMMMMMMMMWd.',
  'XMMMMMMMMMMMMMMMMMMMMMMMX.',
  ';MMMMMMMMMMMMMMMMMMMMMMMM:',
  ':MMMMMMMMMMMMMMMMMMMMMMMM:',
  '.MMMMMMMMMMMMMMMMMMMMMMMMX.',
  ' kMMMMMMMMMMMMMMMMMMMMMMMMWd.',
  ' .XMMMMMMMMMMMMMMMMMMMMMMMMMMk',
  '  .XMMMMMMMMMMMMMMMMMMMMMMMMK.',
  '    kMMMMMMMMMMMMMMMMMMMMMMd',
  '     ;KMMMMMMMWXXWMMMMMMMk.',
  '       .cooc,.    .,coo:.'
];

const info = [
  ['Theme', (scheme) => scheme.name],
  ['Slug', (scheme) => scheme.slug],
  ['Mode', (scheme) => scheme.appearance],
  ['Targets', () => 'Neovim, Ghostty'],
  ['Also', () => 'iTerm2, VS Code'],
  ['Palette', () => '16 ANSI colors'],
  ['Background', (scheme) => token(scheme, scheme.ui, 'background')],
  ['Foreground', (scheme) => token(scheme, scheme.ui, 'foreground')],
  ['Accent', (scheme) => colorFor(scheme, scheme.syntax.function)],
  ['Source', (scheme) => `scheme/${scheme.fileName}`],
  ['Build', () => 'npm run build'],
  ['License', () => 'MIT'],
];

function screenshot(scheme) {
  const p = scheme.colors;
  const bg = token(scheme, scheme.ui, 'background');
  const fg = token(scheme, scheme.ui, 'foreground');
  const border = token(scheme, scheme.ui, 'border');
  const line = scheme.appearance === 'light' ? p.bg3 : p.bg3;
  const colors = ansiColors(scheme);
  const accent = colorFor(scheme, scheme.syntax.function);
  const label = colorFor(scheme, scheme.syntax.keyword);
  const muted = colorFor(scheme, scheme.syntax.comment);
  const logoPalette = [p.green, p.green, p.yellow, p.yellow, p.red, p.red, p.blue, p.blue, p.cyan, p.cyan, p.purple, p.purple];

  const logoLines = logo.map((text, index) => {
    const fill = logoPalette[index % logoPalette.length];
    return `<text x="8" y="${54 + index * 13}" fill="${fill}">${esc(text)}</text>`;
  }).join('\n');

  const infoLines = info.map(([key, value], index) => {
    const y = 54 + index * 13;
    return `<text x="220" y="${y}"><tspan fill="${label}" font-weight="700">${esc(key)}</tspan><tspan fill="${fg}">: ${esc(value(scheme))}</tspan></text>`;
  }).join('\n');

  const swatches = colors.map((color, index) => {
    const x = 220 + (index % 8) * 31;
    const y = 242 + Math.floor(index / 8) * 13;
    return `<rect x="${x}" y="${y}" width="24" height="10" rx="1" fill="${color}"/>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace" font-size="10" xml:space="preserve" role="img" aria-labelledby="title desc">
  <title id="title">${esc(scheme.name)} terminal screenshot</title>
  <desc id="desc">Terminal-style generated screenshot for ${esc(scheme.name)}.</desc>
  <rect x="0" y="0" width="500" height="300" fill="${bg}" />

  <circle cx="12" cy="12" r="4" fill="${p.red}" />
  <circle cx="25" cy="12" r="4" fill="${p.yellow}" />
  <circle cx="38" cy="12" r="4" fill="${p.green}" />

  <text x="90" y="15" fill="${muted}" font-size="8" text-anchor="middle">~</text>
  <text x="138" y="16" font-size="14" fill="${fg}">+</text>
  <rect x="50" y="24" width="80" height="1" fill="${accent}" />
  <rect x="0" y="24" width="500" height="1" fill="${line}" fill-opacity="0.5" />

  ${logoLines}
  <text x="220" y="41" fill="${accent}" font-weight="700">preview@dim-sum-theme</text>
  <text x="220" y="48" fill="${border}">---------------------</text>
  ${infoLines}

  <text x="220" y="232" fill="${muted}">ANSI</text>
  ${swatches}
  <text x="220" y="280" fill="${muted}">Generated by scripts/screenshot.mjs</text>
</svg>`;
}

for (const scheme of schemeFiles().map(readScheme)) {
  write(`assets/screenshots/${scheme.slug}.svg`, screenshot(scheme));
}
