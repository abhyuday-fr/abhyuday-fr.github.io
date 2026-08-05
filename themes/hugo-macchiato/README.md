# Macchiato

A calm, eye-friendly [Hugo](https://gohugo.io) blog theme in **Catppuccin Macchiato**, with an
optional **Catppuccin Latte** light mode toggle. Built for a developer's blog: monospace headings,
terminal-prompt branding, syntax highlighting mapped to the real Catppuccin palette, sticky table
of contents, and code blocks with a copy button.

![palette](https://img.shields.io/badge/palette-Catppuccin%20Macchiato-c6a0f6)

## Features

- Catppuccin Macchiato by default, Catppuccin Latte via a toggle (persisted, no flash of the
  wrong theme on load)
- Chroma syntax highlighting fully re-themed to Catppuccin (not the Hugo default)
- Code blocks with filename-tab styling, language label, and a copy button
- Sticky table of contents on long posts + a reading-progress bar
- Post cards with rotating accent colors, tag pages, prev/next navigation
- Responsive, keyboard-accessible, `prefers-reduced-motion` respected
- No build step required — plain CSS/JS, nothing to compile
- Optional [giscus](https://giscus.app) comments (off by default)

## Quick start

### 1. Add the theme

**Option A — git submodule (recommended):**

```sh
git submodule add https://github.com/abhyuday-fr/hugo-macchiato.git themes/macchiato
```

**Option B — plain clone (if you don't want submodules):**

```sh
git clone https://github.com/abhyuday-fr/hugo-macchiato.git themes/macchiato
rm -rf themes/macchiato/.git
```

**Option C — Hugo module:**

```sh
hugo mod init github.com/you/yoursite   # if you don't already use modules
```

```toml
[module]
  [[module.imports]]
    path = "github.com/abhyuday-fr/hugo-macchiato"
```

### 2. Enable it

In `hugo.toml` (or `config.toml`):

```toml
theme = "macchiato"
```

### 3. Copy the example config

The `exampleSite/` folder in this repo has a working `hugo.toml` plus two sample posts and an
about page — the easiest way to start is to copy its content into your own site, then edit it:

```sh
cp themes/macchiato/exampleSite/hugo.toml hugo.toml
cp -r themes/macchiato/exampleSite/content content
```

### 4. Run it

```sh
hugo server -D
```

## Configuration reference

All of this is optional — the theme works with just `theme = "macchiato"` set, but these params
let you make it yours:

```toml
[params]
  author      = "Your Name"
  description = "What this blog is about."
  tagline     = "Shown as the H1 on the home page."
  favicon     = "favicon.svg"   # path relative to your site's static/ folder
  wideLayout  = false           # true = wider content column (1080px vs 760px)

  # The "user@host:~/path$" prompt shown as the site logo in the header
  [params.prompt]
    user = "you"
    host = "blog"
    path = "~"

  [params.social]
    github   = "https://github.com/you"
    twitter  = "https://twitter.com/you"
    mastodon = "https://mastodon.social/@you"

  # Optional: giscus comments (https://giscus.app) — omit this whole block to disable
  [params.giscus]
    repo       = "you/your-repo"
    repoId     = "..."
    category   = "Announcements"
    categoryId = "..."
```

### Menus

```toml
[menu]
  [[menu.main]]
    name   = "Home"
    url    = "/"
    weight = 1
  [[menu.main]]
    name   = "Posts"
    url    = "/posts/"
    weight = 2
  [[menu.main]]
    name   = "Tags"
    url    = "/tags/"
    weight = 3
  [[menu.main]]
    name   = "About"
    url    = "/about/"
    weight = 4

  [[menu.footer]]
    name   = "Home"
    url    = "/"
    weight = 1
```

### Front matter

Nothing special is required — standard Hugo front matter works:

```yaml
---
title: "Post title"
date: 2026-08-05
description: "Shown on post cards and as the meta description."
tags: ["cpp", "systems"]
---
```

Posts should live under `content/posts/` so the theme recognizes them as posts (this is what
turns on the reading-progress bar, table of contents, and prev/next navigation — regular pages
like an About page get the plain layout).

### Admonitions

Four shortcodes are built in:

```md
{{< note >}}Neutral, informational aside.{{< /note >}}
{{< tip >}}A suggestion or shortcut.{{< /tip >}}
{{< warning >}}Something to be careful about.{{< /warning >}}
{{< danger >}}Something that can break things.{{< /danger >}}
```

### Syntax highlighting

Set this in your `hugo.toml` so Chroma emits classes the theme's CSS can style (this is already
set in `exampleSite/hugo.toml`):

```toml
[markup.highlight]
  noClasses = false
```

## Recommended full config

See [`exampleSite/hugo.toml`](exampleSite/hugo.toml) for a complete, working example, including
table-of-contents depth and Goldmark settings.

## License

MIT — see [LICENSE](LICENSE). The Catppuccin palette itself is MIT-licensed by the
[Catppuccin project](https://github.com/catppuccin/catppuccin).
