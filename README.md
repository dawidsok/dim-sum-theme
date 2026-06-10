# Dim Sum

Dim Sum is a dim, Flexoki-inspired dark theme for terminals and editors. It uses a warm background, calm UI surfaces, and muted syntax colors.

Supported targets:

- Neovim
- Ghostty
- iTerm2
- VS Code

## Preview palette

```text
bg      #100f0f   bg1    #1c1b1a   bg2    #282726   bg3    #343331
fg      #cecdc3   white  #e6e4d9   dim    #575653   mid    #878580
red     #a85f59   green  #87965f   yellow #b3954d   blue   #6f8faf
purple  #8b7fa8   cyan   #5f9b95   orange #b77a4a
```

## Install

Clone the repository first:

```sh
git clone https://github.com/dawidsok/dim-sum-theme.git ~/.local/share/dim-sum-theme
cd ~/.local/share/dim-sum-theme
```

Generated theme files are committed in `dist/`, so you can use the theme without running a build.

### Neovim

Copy or symlink the generated colorscheme into your config:

```sh
mkdir -p ~/.config/nvim/colors
ln -sf "$PWD/dist/neovim/colors/dim-sum.lua" ~/.config/nvim/colors/dim-sum.lua
```

Then use:

```vim
:colorscheme dim-sum
```

With lazy.nvim:

```lua
{
  "dawidsok/dim-sum-theme",
  name = "dim-sum",
  lazy = false,
  priority = 1000,
  rtp = "dist/neovim",
  config = function()
    vim.cmd.colorscheme("dim-sum")
  end,
}
```

### Ghostty

```sh
mkdir -p ~/.config/ghostty/themes
ln -sf "$PWD/dist/ghostty/dim-sum" ~/.config/ghostty/themes/dim-sum
```

In `~/.config/ghostty/config`:

```ini
theme = dim-sum
```

### iTerm2

Import `dist/iterm/Dim Sum.itermcolors`:

1. iTerm2 → Settings → Profiles → Colors
2. Color Presets… → Import…
3. Select `dist/iterm/Dim Sum.itermcolors`

### VS Code

Symlink or copy the generated extension folder:

```sh
mkdir -p ~/.vscode/extensions
ln -sfn "$PWD/dist/vscode" ~/.vscode/extensions/dim-sum-theme
```

Then run **Developer: Reload Window** and choose **Dim Sum** from the color theme picker.

## Build

Requirements:

- Node.js 20 or newer
- npm

```sh
npm ci
npm run build
npm run check
```

`scheme/dim-sum.json` is the source of truth. `scripts/generate.mjs` generates the target-specific files in `dist/`.

## Security

This project has no runtime dependencies. The CI workflow runs `npm audit --audit-level=high` and verifies generated files are up to date. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT © Dawid Sokół
