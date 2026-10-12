# Project page

Single-page, zero-build static site for Evo-World. Classic academic light theme.

## Preview locally

```bash
cd webpage
python3 -m http.server 8080
# open http://localhost:8080
```

(Opening `index.html` directly with `file://` works too, but a local server is
closer to how GitHub Pages serves it.)

## Publish on GitHub Pages

Two common options:

- **Project site from `/docs`:** rename/copy this folder to `docs/` at the repo
  root, then in GitHub → Settings → Pages set *Source = main branch /docs*.
- **Dedicated branch:** push these files to a `gh-pages` branch.

The page uses only relative paths, so it works from any sub-path.

## Assets (`assets/`)

The real paper figures ship in `assets/` (converted from the arXiv PDFs):

| Path | Used in |
|------|---------|
| `assets/teaser.png`       | hero teaser (Fig. 1 — prediction targets) + `og:image` |
| `assets/method.png`       | Method section (Fig. 2 — architecture) |
| `assets/optical_flow.png` | Method section (optical-flow supervision) |

The page still **auto-upgrades**: every figure slot shows a labeled dashed
placeholder if its file is missing, then swaps to the real asset with no code
change — so dropping in a newer figure just works. To replace a figure, overwrite
the matching PNG in `assets/`.

## Content status

Everything is filled from the published paper, including the arXiv link
(`arxiv.org/abs/2610.12936`) on the hero **Paper** button and the BibTeX block.
No placeholders remain.

## Files

```
webpage/
├── index.html      # all content + structure
├── css/style.css   # the theme (validated data-viz palette, blue accent)
├── js/main.js      # media fallbacks, BibTeX copy, scroll-spy
└── assets/         # you create this — figures + videos
```
