<img src="favicon.svg" width="64" height="64" alt="">

# L'Odissea di Da

A goofy animated map (in Italian) for Da's 27th birthday, 7 November 2026. On Thursday Da takes the bus from Nizza to Mariano Comense. On Friday he rests at home, then before dinner the family taxi races Birgit's plane from Vienna to Malpensa and everyone eats together. On Saturday Da and Birgit take the bus to Bergamo, where Edo arrives from Fiobbio.

Plain static files with no build step: `index.html`, `style.css`, `app.js`, plus [blobatar](https://blobatar.dev) 2.7.0 (MIT) copied into `vendor/blobatar/` and wrapped as a plain script so it works from `file://`.

## The faces

Everyone is a [blobatar](https://blobatar.dev) whose expression changes with the story: happy, sick on the hairpins, mad in Milan traffic, love when Birgit lands, sleepy on the night drive, and so on. In `app.js`:

- `CONFIG.people`: each person's `seed` (any string; the same string always gives the same creature) and colours
- `MOODS`: which expression each person wears, and when. The poses are `idle`, `happy`, `sad`, `mad`, `surprised`, `wink`, `sleepy`, `smug`, `unsure`, `scared`, `love`, `shy`, `sick` and `thinking`.

## Edit the story

Also at the top of `app.js`:

- `CONFIG.from`: the signature
- `CHAPTERS`: caption titles and jokes, with the time each one appears
- `BUBBLES`: speech bubbles

The final birthday message is in `index.html`, inside `<section class="finale">`.

To jump to a moment, add `#t=37` to the URL (seconds, 0 to 61).

## Run it locally

Open `index.html` in a browser. No server is needed.

## Deploy on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**, then set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Wait about a minute, then open `https://<your-user>.github.io/<repo-name>/`.
