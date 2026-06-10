import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const schemeDir = path.join(root, 'scheme');
let scheme;
let c;

function loadScheme(fileName) {
  scheme = JSON.parse(fs.readFileSync(path.join(schemeDir, fileName), 'utf8'));
  scheme.fileName = fileName;
  c = scheme.colors;
  return scheme;
}

function schemeFiles() {
  return fs.readdirSync(schemeDir)
    .filter((fileName) => fileName.endsWith('.json') && fileName !== 'schema.json')
    .sort((a, b) => {
      if (a === 'dim-sum.json') return -1;
      if (b === 'dim-sum.json') return 1;
      return a.replace(/\.json$/, '').localeCompare(b.replace(/\.json$/, ''));
    });
}

function color(token) {
  if (token.startsWith('#')) return token;
  const value = c[token];
  if (!value) throw new Error(`Unknown color token: ${token}`);
  return value;
}

function token(map, key) {
  return color(map[key]);
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

function hexToRgb(hex) {
  const raw = hex.replace('#', '');
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function itermColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (n) => (n / 255).toFixed(12).replace(/0+$/, '').replace(/\.$/, '.0');
  return `<dict>
			<key>Blue Component</key>
			<real>${f(b)}</real>
			<key>Color Space</key>
			<string>sRGB</string>
			<key>Green Component</key>
			<real>${f(g)}</real>
			<key>Red Component</key>
			<real>${f(r)}</real>
		</dict>`;
}

function q(s) {
  return JSON.stringify(s);
}

function luaTable(spec) {
  const parts = [];
  for (const [k, v] of Object.entries(spec)) {
    if (typeof v === 'string') parts.push(`${k} = ${q(v)}`);
    else if (typeof v === 'boolean') parts.push(`${k} = ${v ? 'true' : 'false'}`);
  }
  return `{ ${parts.join(', ')} }`;
}

function generateGhostty() {
  const ansi = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
  ].map((name, i) => `palette = ${i}=${token(scheme.ansi, name)}`);

  return `# ${scheme.name}
# Generated from scheme/${scheme.fileName}
${ansi.join('\n')}
background = ${token(scheme.ui, 'background')}
foreground = ${token(scheme.ui, 'foreground')}
cursor-color = ${token(scheme.ui, 'cursor')}
cursor-text = ${token(scheme.ui, 'cursorText')}
selection-background = ${token(scheme.ui, 'selectionBackground')}
selection-foreground = ${token(scheme.ui, 'selectionForeground')}
`;
}

function generateITerm() {
  const ansiNames = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
  ];
  const entries = [];
  ansiNames.forEach((name, i) => {
    entries.push(`\t<key>Ansi ${i} Color</key>\n\t${itermColor(token(scheme.ansi, name)).replaceAll('\n', '\n\t')}`);
  });
  entries.push(`\t<key>Background Color</key>\n\t${itermColor(token(scheme.ui, 'background')).replaceAll('\n', '\n\t')}`);
  entries.push(`\t<key>Foreground Color</key>\n\t${itermColor(token(scheme.ui, 'foreground')).replaceAll('\n', '\n\t')}`);
  entries.push(`\t<key>Cursor Color</key>\n\t${itermColor(token(scheme.ui, 'cursor')).replaceAll('\n', '\n\t')}`);
  entries.push(`\t<key>Cursor Text Color</key>\n\t${itermColor(token(scheme.ui, 'cursorText')).replaceAll('\n', '\n\t')}`);
  entries.push(`\t<key>Selection Color</key>\n\t${itermColor(token(scheme.ui, 'selectionBackground')).replaceAll('\n', '\n\t')}`);
  entries.push(`\t<key>Selected Text Color</key>\n\t${itermColor(token(scheme.ui, 'selectionForeground')).replaceAll('\n', '\n\t')}`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${entries.join('\n')}
</dict>
</plist>
`;
}

function generateVSCodeTheme() {
  const s = scheme.syntax;
  const theme = {
    name: scheme.name,
    type: scheme.appearance,
    semanticHighlighting: true,
    colors: {
      'editor.background': token(scheme.ui, 'background'),
      'editor.foreground': token(scheme.ui, 'foreground'),
      'editorCursor.foreground': token(scheme.ui, 'cursor'),
      'editor.selectionBackground': token(scheme.ui, 'selectionBackground'),
      'editor.lineHighlightBackground': c.bg1,
      'editorLineNumber.foreground': token(scheme.ui, 'lineNumber'),
      'editorLineNumber.activeForeground': token(scheme.ui, 'lineNumberActive'),
      'editorIndentGuide.background1': c.bg3,
      'editorIndentGuide.activeBackground1': c.dim,
      'sideBar.background': c.bg,
      'sideBar.foreground': c.fg,
      'sideBar.border': token(scheme.ui, 'border'),
      'activityBar.background': c.bg,
      'activityBar.foreground': c.fg1,
      'activityBar.inactiveForeground': c.mid,
      'statusBar.background': c.bg2,
      'statusBar.foreground': c.fg1,
      'panel.background': c.bg1,
      'panel.border': c.bg3,
      'tab.activeBackground': c.bg,
      'tab.activeForeground': c.white,
      'tab.inactiveBackground': c.bg1,
      'tab.inactiveForeground': c.mid,
      'terminal.background': token(scheme.ui, 'background'),
      'terminal.foreground': token(scheme.ui, 'foreground'),
      'terminal.ansiBlack': token(scheme.ansi, 'black'),
      'terminal.ansiRed': token(scheme.ansi, 'red'),
      'terminal.ansiGreen': token(scheme.ansi, 'green'),
      'terminal.ansiYellow': token(scheme.ansi, 'yellow'),
      'terminal.ansiBlue': token(scheme.ansi, 'blue'),
      'terminal.ansiMagenta': token(scheme.ansi, 'magenta'),
      'terminal.ansiCyan': token(scheme.ansi, 'cyan'),
      'terminal.ansiWhite': token(scheme.ansi, 'white'),
      'terminal.ansiBrightBlack': token(scheme.ansi, 'brightBlack'),
      'terminal.ansiBrightRed': token(scheme.ansi, 'brightRed'),
      'terminal.ansiBrightGreen': token(scheme.ansi, 'brightGreen'),
      'terminal.ansiBrightYellow': token(scheme.ansi, 'brightYellow'),
      'terminal.ansiBrightBlue': token(scheme.ansi, 'brightBlue'),
      'terminal.ansiBrightMagenta': token(scheme.ansi, 'brightMagenta'),
      'terminal.ansiBrightCyan': token(scheme.ansi, 'brightCyan'),
      'terminal.ansiBrightWhite': token(scheme.ansi, 'brightWhite'),
      'gitDecoration.addedResourceForeground': color(s.added),
      'gitDecoration.modifiedResourceForeground': color(s.changed),
      'gitDecoration.deletedResourceForeground': color(s.removed),
      'errorForeground': color(s.error),
      'input.background': c.bg1,
      'input.foreground': c.fg,
      'input.border': c.bg3,
      'dropdown.background': c.bg1,
      'dropdown.foreground': c.fg,
      'dropdown.border': c.bg3,
    },
    tokenColors: [
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: color(s.comment), fontStyle: 'italic' } },
      { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: color(s.keyword) } },
      { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: color(s.function) } },
      { scope: ['string', 'constant.other.symbol'], settings: { foreground: color(s.string) } },
      { scope: ['constant.numeric', 'constant.language', 'variable.language'], settings: { foreground: color(s.number) } },
      { scope: ['entity.name.type', 'support.type', 'support.class'], settings: { foreground: color(s.type) } },
      { scope: ['variable.other.property', 'support.variable.property', 'entity.other.attribute-name'], settings: { foreground: color(s.property) } },
      { scope: ['punctuation', 'meta.brace'], settings: { foreground: color(s.punctuation) } },
      { scope: ['keyword.operator'], settings: { foreground: color(s.operator) } },
      { scope: ['entity.name.tag'], settings: { foreground: color(s.function) } },
      { scope: ['invalid', 'markup.deleted'], settings: { foreground: color(s.error) } },
      { scope: ['markup.inserted'], settings: { foreground: color(s.added) } },
      { scope: ['markup.changed'], settings: { foreground: color(s.changed) } },
    ],
    semanticTokenColors: {
      namespace: color(s.preproc),
      class: color(s.type),
      enum: color(s.type),
      interface: color(s.type),
      struct: color(s.type),
      typeParameter: color(s.type),
      parameter: c.fg1,
      variable: c.fg,
      property: color(s.property),
      enumMember: color(s.constant),
      function: color(s.function),
      method: color(s.function),
      macro: color(s.preproc),
      keyword: color(s.keyword),
      string: color(s.string),
      number: color(s.number),
      comment: color(s.comment),
    },
  };
  return `${JSON.stringify(theme, null, 2)}\n`;
}

function generateVSCodePackage(schemes) {
  return `${JSON.stringify({
    name: 'dim-sum-theme',
    displayName: 'Dim Sum Theme',
    description: 'Dim Sum themes for terminals and editors.',
    version: '0.1.0',
    publisher: 'dawidsok',
    engines: { vscode: '^1.80.0' },
    categories: ['Themes'],
    contributes: {
      themes: schemes.map((s) => ({
        label: s.name,
        uiTheme: s.appearance === 'light' ? 'vs' : 'vs-dark',
        path: `./themes/${s.slug}-color-theme.json`,
      })),
    },
  }, null, 2)}\n`;
}

function generateNeovim() {
  const p = c;
  const term = [
    ['0', token(scheme.ansi, 'black')], ['1', token(scheme.ansi, 'red')], ['2', token(scheme.ansi, 'green')], ['3', token(scheme.ansi, 'yellow')],
    ['4', token(scheme.ansi, 'blue')], ['5', token(scheme.ansi, 'magenta')], ['6', token(scheme.ansi, 'cyan')], ['7', token(scheme.ansi, 'white')],
    ['8', token(scheme.ansi, 'brightBlack')], ['9', token(scheme.ansi, 'brightRed')], ['10', token(scheme.ansi, 'brightGreen')], ['11', token(scheme.ansi, 'brightYellow')],
    ['12', token(scheme.ansi, 'brightBlue')], ['13', token(scheme.ansi, 'brightMagenta')], ['14', token(scheme.ansi, 'brightCyan')], ['15', token(scheme.ansi, 'brightWhite')],
  ].map(([i, v]) => `vim.g.terminal_color_${i} = ${q(v)}`).join('\n');

  const groups = [
    ['Normal', { fg: p.fg, bg: p.bg }], ['NormalNC', { fg: p.fg, bg: p.bg }], ['NormalFloat', { fg: p.fg, bg: p.bg1 }],
    ['FloatBorder', { fg: p.dim, bg: p.bg1 }], ['FloatTitle', { fg: p.white, bg: p.bg1, bold: true }],
    ['Cursor', { fg: p.bg, bg: p.white }], ['CursorLine', { bg: p.bg1 }], ['CursorColumn', { bg: p.bg1 }], ['ColorColumn', { bg: p.bg1 }],
    ['LineNr', { fg: p.dim }], ['CursorLineNr', { fg: p.white, bold: true }], ['SignColumn', { fg: p.dim, bg: p.bg }],
    ['FoldColumn', { fg: p.dim, bg: p.bg }], ['Folded', { fg: p.mid, bg: p.bg1 }], ['VertSplit', { fg: p.bg3 }], ['WinSeparator', { fg: p.bg3 }],
    ['StatusLine', { fg: p.fg1, bg: p.bg2 }], ['StatusLineNC', { fg: p.mid, bg: p.bg1 }], ['TabLine', { fg: p.mid, bg: p.bg1 }],
    ['TabLineFill', { bg: p.bg }], ['TabLineSel', { fg: p.white, bg: p.bg3, bold: true }], ['Pmenu', { fg: p.fg, bg: p.bg1 }],
    ['PmenuSel', { fg: p.white, bg: p.bg3 }], ['PmenuSbar', { bg: p.bg2 }], ['PmenuThumb', { bg: p.mid }], ['Visual', { bg: p.bg3 }],
    ['Search', { fg: p.bg, bg: p.yellow }], ['IncSearch', { fg: p.bg, bg: p.orange }], ['CurSearch', { fg: p.bg, bg: p.orange, bold: true }],
    ['MatchParen', { fg: p.white, bg: p.bg4, bold: true }], ['NonText', { fg: p.dim }], ['SpecialKey', { fg: p.dim }], ['Directory', { fg: p.fg1 }],
    ['Title', { fg: p.white, bold: true }], ['Question', { fg: p.cyan }], ['MoreMsg', { fg: p.cyan }], ['ErrorMsg', { fg: p.red, bold: true }],
    ['WarningMsg', { fg: p.yellow }], ['ModeMsg', { fg: p.fg1 }], ['Conceal', { fg: p.mid }], ['Whitespace', { fg: p.bg4 }], ['Bold', { bold: true }], ['Italic', { italic: true }],

    ['Comment', { fg: p.mid, italic: true }], ['Constant', { fg: p.orange }], ['String', { fg: p.green }], ['Character', { fg: p.green }],
    ['Number', { fg: p.orange }], ['Boolean', { fg: p.orange }], ['Float', { fg: p.orange }], ['Identifier', { fg: p.fg }], ['Function', { fg: p.blue }],
    ['Statement', { fg: p.purple }], ['Conditional', { fg: p.purple }], ['Repeat', { fg: p.purple }], ['Label', { fg: p.purple }], ['Operator', { fg: p.fg1 }],
    ['Keyword', { fg: p.purple }], ['Exception', { fg: p.red }], ['PreProc', { fg: p.yellow }], ['Include', { fg: p.purple }], ['Define', { fg: p.yellow }],
    ['Macro', { fg: p.yellow }], ['PreCondit', { fg: p.yellow }], ['Type', { fg: p.cyan }], ['StorageClass', { fg: p.purple }], ['Structure', { fg: p.cyan }],
    ['Typedef', { fg: p.cyan }], ['Special', { fg: p.cyan }], ['SpecialChar', { fg: p.orange }], ['Tag', { fg: p.blue }], ['Delimiter', { fg: p.mid }],
    ['SpecialComment', { fg: p.mid, italic: true }], ['Debug', { fg: p.red }], ['Underlined', { fg: p.blue, underline: true }], ['Ignore', { fg: p.dim }],
    ['Error', { fg: p.red, bold: true }], ['Todo', { fg: p.bg, bg: p.yellow, bold: true }],

    ['DiagnosticError', { fg: p.red }], ['DiagnosticWarn', { fg: p.yellow }], ['DiagnosticInfo', { fg: p.blue }], ['DiagnosticHint', { fg: p.cyan }], ['DiagnosticOk', { fg: p.green }],
    ['DiagnosticVirtualTextError', { fg: p.red, bg: p.bg1 }], ['DiagnosticVirtualTextWarn', { fg: p.yellow, bg: p.bg1 }],
    ['DiagnosticVirtualTextInfo', { fg: p.blue, bg: p.bg1 }], ['DiagnosticVirtualTextHint', { fg: p.cyan, bg: p.bg1 }],
    ['DiagnosticUnderlineError', { sp: p.red, undercurl: true }], ['DiagnosticUnderlineWarn', { sp: p.yellow, undercurl: true }],
    ['DiagnosticUnderlineInfo', { sp: p.blue, undercurl: true }], ['DiagnosticUnderlineHint', { sp: p.cyan, undercurl: true }],
    ['DiffAdd', { fg: p.green, bg: p.bg1 }], ['DiffChange', { fg: p.yellow, bg: p.bg1 }], ['DiffDelete', { fg: p.red, bg: p.bg1 }], ['DiffText', { fg: p.white, bg: p.bg4 }],
    ['Added', { fg: p.green }], ['Changed', { fg: p.yellow }], ['Removed', { fg: p.red }], ['GitSignsAdd', { fg: p.green }], ['GitSignsChange', { fg: p.yellow }], ['GitSignsDelete', { fg: p.red }],

    ['@comment', { link: 'Comment' }], ['@variable', { fg: p.fg }], ['@variable.builtin', { fg: p.orange }], ['@variable.parameter', { fg: p.fg1 }], ['@variable.member', { fg: p.cyan }],
    ['@constant', { fg: p.orange }], ['@constant.builtin', { fg: p.orange }], ['@constant.macro', { fg: p.yellow }], ['@module', { fg: p.yellow }], ['@label', { fg: p.purple }],
    ['@string', { fg: p.green }], ['@string.documentation', { fg: p.green }], ['@string.regexp', { fg: p.cyan }], ['@string.escape', { fg: p.orange }], ['@character', { fg: p.green }],
    ['@number', { fg: p.orange }], ['@boolean', { fg: p.orange }], ['@float', { fg: p.orange }], ['@function', { fg: p.blue }], ['@function.builtin', { fg: p.blue }],
    ['@function.call', { fg: p.blue }], ['@function.macro', { fg: p.yellow }], ['@function.method', { fg: p.blue }], ['@function.method.call', { fg: p.blue }], ['@constructor', { fg: p.cyan }],
    ['@keyword', { fg: p.purple }], ['@keyword.function', { fg: p.purple }], ['@keyword.operator', { fg: p.purple }], ['@keyword.return', { fg: p.purple }], ['@keyword.conditional', { fg: p.purple }],
    ['@keyword.repeat', { fg: p.purple }], ['@keyword.exception', { fg: p.red }], ['@operator', { fg: p.fg1 }], ['@type', { fg: p.cyan }], ['@type.builtin', { fg: p.cyan }],
    ['@type.definition', { fg: p.cyan }], ['@attribute', { fg: p.yellow }], ['@property', { fg: p.cyan }], ['@punctuation', { fg: p.mid }], ['@punctuation.bracket', { fg: p.mid }],
    ['@punctuation.delimiter', { fg: p.mid }], ['@punctuation.special', { fg: p.cyan }], ['@tag', { fg: p.blue }], ['@tag.attribute', { fg: p.cyan }], ['@tag.delimiter', { fg: p.mid }],
    ['@markup.heading', { fg: p.white, bold: true }], ['@markup.link', { fg: p.blue, underline: true }], ['@markup.link.url', { fg: p.blue, underline: true }], ['@markup.raw', { fg: p.green }],
    ['@markup.strong', { fg: p.white, bold: true }], ['@markup.italic', { fg: p.fg1, italic: true }], ['@markup.list', { fg: p.orange }],

    ['@lsp.type.class', { link: '@type' }], ['@lsp.type.enum', { link: '@type' }], ['@lsp.type.enumMember', { link: '@constant' }], ['@lsp.type.function', { link: '@function' }],
    ['@lsp.type.interface', { link: '@type' }], ['@lsp.type.keyword', { link: '@keyword' }], ['@lsp.type.macro', { link: '@function.macro' }], ['@lsp.type.method', { link: '@function.method' }],
    ['@lsp.type.namespace', { link: '@module' }], ['@lsp.type.parameter', { link: '@variable.parameter' }], ['@lsp.type.property', { link: '@property' }], ['@lsp.type.struct', { link: '@type' }],
    ['@lsp.type.type', { link: '@type' }], ['@lsp.type.variable', { link: '@variable' }],

    ['LspReferenceText', { bg: p.bg2 }], ['LspReferenceRead', { bg: p.bg2 }], ['LspReferenceWrite', { bg: p.bg2 }],
    ['SnacksNormal', { fg: p.fg, bg: p.bg }], ['SnacksNormalNC', { fg: p.fg, bg: p.bg }], ['SnacksWinSeparator', { fg: p.bg3 }], ['SnacksWinBar', { fg: p.fg1, bg: p.bg }],
    ['SnacksWinBarNC', { fg: p.mid, bg: p.bg }], ['SnacksTitle', { fg: p.white, bold: true }], ['SnacksFooter', { fg: p.mid }], ['SnacksPicker', { fg: p.fg, bg: p.bg }],
    ['SnacksPickerBox', { fg: p.fg, bg: p.bg }], ['SnacksPickerList', { fg: p.fg, bg: p.bg }], ['SnacksPickerInput', { fg: p.fg, bg: p.bg1 }], ['SnacksPickerPreview', { fg: p.fg, bg: p.bg }],
    ['SnacksPickerListCursorLine', { bg: p.bg2 }], ['SnacksPickerPreviewCursorLine', { bg: p.bg2 }], ['SnacksPickerMatch', { fg: p.white, bold: true }], ['SnacksPickerSearch', { fg: p.bg, bg: p.yellow }],
    ['SnacksPickerPrompt', { fg: p.white }], ['SnacksPickerInputSearch', { fg: p.yellow }], ['SnacksPickerDirectory', { fg: p.fg1 }], ['SnacksPickerFile', { fg: p.fg }], ['SnacksPickerDir', { fg: p.mid }],
    ['SnacksPickerPathIgnored', { fg: p.dim }], ['SnacksPickerPathHidden', { fg: p.dim }], ['SnacksPickerDimmed', { fg: p.mid }], ['SnacksPickerTree', { fg: p.dim }], ['SnacksPickerDelim', { fg: p.dim }],
    ['SnacksPickerIcon', { fg: p.mid }], ['SnacksPickerGitStatusAdded', { fg: p.green }], ['SnacksPickerGitStatusModified', { fg: p.yellow }], ['SnacksPickerGitStatusDeleted', { fg: p.red }],
    ['SnacksPickerGitStatusUntracked', { fg: p.mid }], ['SnacksPickerGitStatusStaged', { fg: p.cyan }],
    ['WhichKey', { fg: p.white }], ['WhichKeyDesc', { fg: p.fg }], ['WhichKeyGroup', { fg: p.blue }], ['WhichKeySeparator', { fg: p.dim }],
    ['RenderMarkdownH1Bg', { bg: p.bg2 }], ['RenderMarkdownH2Bg', { bg: p.bg2 }], ['RenderMarkdownH3Bg', { bg: p.bg1 }], ['RenderMarkdownCode', { bg: p.bg1 }], ['RenderMarkdownCodeInline', { bg: p.bg2 }],
  ];

  const groupLines = groups.map(([name, spec]) => `hi(${q(name)}, ${luaTable(spec)})`).join('\n');
  return `-- ${scheme.name}
-- Generated from scheme/${scheme.fileName}. Do not edit generated output directly.
vim.cmd.highlight("clear")

if vim.fn.exists("syntax_on") == 1 then
  vim.cmd.syntax("reset")
end

vim.g.colors_name = "${scheme.slug}"
vim.o.background = "${scheme.appearance}"

${term}

local function hi(group, spec)
  vim.api.nvim_set_hl(0, group, spec)
end

${groupLines}
`;
}

const schemes = schemeFiles().map(loadScheme);

for (const loadedScheme of schemes) {
  scheme = loadedScheme;
  c = scheme.colors;
  write(`dist/ghostty/${scheme.slug}`, generateGhostty());
  write(`dist/iterm/${scheme.name}.itermcolors`, generateITerm());
  write(`dist/vscode/themes/${scheme.slug}-color-theme.json`, generateVSCodeTheme());
  write(`dist/neovim/colors/${scheme.slug}.lua`, generateNeovim());
}

write('dist/vscode/package.json', generateVSCodePackage(schemes));
