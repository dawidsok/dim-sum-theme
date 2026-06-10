<p align="center">
  <img src="assets/logo.png" alt="Dim Sum logo" width="160">
</p>

<h1 align="center">Dim Sum</h1>

<p align="center">
  A family of dim themes for terminals and editors. The palettes favor calm UI surfaces, muted syntax colors, and only subtle warmth.
</p>

Supported targets:

- Neovim
- Ghostty
- iTerm2
- VS Code
- Zellij
- btop

## Variants

### Dim Sum

The default dim dark palette with subtle warmth.

![Dim Sum terminal screenshot](assets/screenshots/dim-sum.svg)

### Dim Sum Darker

A darker restrained variant with grayscale UI and low-saturation semantic accents.

![Dim Sum Darker terminal screenshot](assets/screenshots/dim-sum-darker.svg)

### Dim Sum Mono

A strictly greyscale dark variant for UI and code syntax.

![Dim Sum Mono terminal screenshot](assets/screenshots/dim-sum-mono.svg)

### Dim Sum Mono Light

![Dim Sum Mono Light terminal screenshot](assets/screenshots/dim-sum-mono-light.svg)

### Dim Sum Paper

A barely-white, steam-bun-paper light variant.

![Dim Sum Paper terminal screenshot](assets/screenshots/dim-sum-paper.svg)

### Dim Sum Wave

An ink-and-wave dark variant.

![Dim Sum Wave terminal screenshot](assets/screenshots/dim-sum-wave.svg)

### Dim Sum Sunset

A dim dark variant with subtle dusk warmth and ember accents.

![Dim Sum Sunset terminal screenshot](assets/screenshots/dim-sum-sunset.svg)

Available slugs:

```text
dim-sum
dim-sum-darker
dim-sum-mono
dim-sum-mono-light
dim-sum-paper
dim-sum-wave
dim-sum-sunset
```

## Install

Clone the repository first:

```sh
git clone https://github.com/dawidsok/dim-sum-theme.git ~/.local/share/dim-sum-theme
cd ~/.local/share/dim-sum-theme
```

Generated theme files are committed in `dist/`, so you can use the themes without running a build.

### Neovim

Copy or symlink the generated colorscheme into your config. Replace `dim-sum` with any variant slug.

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

Import any file from `dist/iterm/`:

1. iTerm2 → Settings → Profiles → Colors
2. Color Presets… → Import…
3. Select the `.itermcolors` file for the variant you want

### Zellij

```sh
mkdir -p ~/.config/zellij/themes
ln -sf "$PWD/dist/zellij/dim-sum.kdl" ~/.config/zellij/themes/dim-sum.kdl
```

In `~/.config/zellij/config.kdl`:

```kdl
theme "dim-sum"
```

### btop

```sh
mkdir -p ~/.config/btop/themes
ln -sf "$PWD/dist/btop/dim-sum.theme" ~/.config/btop/themes/dim-sum.theme
```

In btop, set the theme to `dim-sum` from Options → Color theme, or edit `~/.config/btop/btop.conf`:

```ini
color_theme = "dim-sum"
```

### VS Code

Symlink or copy the generated extension folder:

```sh
mkdir -p ~/.vscode/extensions
ln -sfn "$PWD/dist/vscode" ~/.vscode/extensions/dim-sum-theme
```

Then run **Developer: Reload Window** and choose a Dim Sum variant from the color theme picker.

## Build

Requirements:

- Node.js 20 or newer
- npm

```sh
npm ci
npm run build
npm run check
```

Theme definitions live in `scheme/*.json`. `scripts/generate.mjs` generates target-specific files in `dist/` for Neovim, Ghostty, iTerm2, VS Code, Zellij, and btop. `scripts/screenshot.mjs` generates terminal-style screenshots in `assets/screenshots/`.

## Security

This project has no runtime dependencies. The CI workflow runs `npm audit --audit-level=high` and verifies generated files are up to date. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT © Dawid Sokół
