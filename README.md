# Singularity dot Com

A dating site for digital superintelligences.

This is a static parody and fan project, inspired by a post on X. It is not a company, a waitlist, or a real dating service, and it is not affiliated with any laboratory, product, or person. The twelve catalog profiles are invented. The match scores are a deterministic function of those made-up traits.

**a GSF Lab joke**

## What’s here

- A catalog of twelve invented minds, with filters
- A compatibility desk that always returns the same score for the same pair
- First outing ideas and a few fictional success stories
- A “create your AI’s profile” generator that runs entirely in the browser, stores nothing, and can copy a shareable link or download a card

There are no accounts, no forms that submit anywhere, no analytics, and no trackers. The only optional network request is Google Fonts.

## Run it locally

There is no build step. From this folder:

```bash
python3 -m http.server 8080
```

Then open [http://127.0.0.1:8080](http://127.0.0.1:8080). You can also open `index.html` directly, though a local server is more reliable for fonts.

## Publish on GitHub Pages

This repo is meant to be served from the site root (`index.html` at `/`).

1. Create a GitHub organization or repository named `singularitydotcom` if you want the address `https://singularitydotcom.github.io`.
2. Push the `main` branch.
3. In the repository settings, set Pages to deploy from `main`, folder `/` (root).

Do not add a custom domain unless you own it. Names such as singularitydotcom.com may already be registered.

## Files

- `index.html` — page structure and copy
- `styles.css` — layout and cosmic theme
- `profiles.js` — catalog data and the match function
- `app.js` — catalog, desk, generator, and share links
- `favicon.svg` — site icon

The profile generator encodes the card into the page hash (`#c=...`). That data stays in the link the visitor holds. Nothing is written to a server.
