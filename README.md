# For Daphine — Birthday Website

A complete, self-contained romantic birthday website for Daphine, built with plain HTML, CSS, and JavaScript. No build tools, no frameworks, no installation — just open it in a browser.

---

## 1. Folder structure

```
romantic-site/
├── index.html              ← page structure & all written content
├── style.css                ← all visual design (colors, fonts, layout, animation)
├── script.js                 ← all interactivity (flip cards, typewriter, lightbox, etc.)
├── README.md                  ← this file
└── assets/
    ├── images/
    │   ├── hero-daphine.jpg          (opening screen portrait)
    │   ├── gallery-01.jpg … gallery-08.jpg   (Memory Gallery polaroids)
    │   └── klawie-01.jpg, klawie-02.jpg      (Klawie memorial photos)
    └── music/
        └── PUT_SONG_HERE.txt   ← instructions; replace with the real mp3 (see §2)
```

Photos already included come straight from the ones you uploaded — I picked the clearest, most flattering shots of Daphine and of Klawie. Everything is easy to swap; see §4.

---

## 2. Setup instructions

**To preview it:** double-click `index.html` — it opens in your default browser. That's it, no server or install required.

**To add the song** ("A Couple Minutes" by Olivia Dean):
1. Get the mp3 file (from a purchase, your own library, or wherever you'd normally source music you own).
2. Rename it exactly to `a-couple-minutes.mp3`.
3. Drop it into `assets/music/`, replacing the placeholder text file.
4. Reload the page — the floating music player in the bottom-right corner will now play it when tapped.

Browsers block audio from auto-playing with sound, so the song intentionally starts only when she taps the play button — that's expected, not a bug.

**To send it to her:** the simplest way is to zip the whole `romantic-site` folder and share it directly (AirDrop, email, Google Drive, WeTransfer). If you'd rather she just click a link, you can deploy it for free on a host like Netlify, Vercel, or GitHub Pages — drag the folder onto netlify.com/drop and it gives you a shareable link in seconds.

---

## 3. Customization guide

Everything below is plain text or simple values inside `index.html` and `style.css` — no coding knowledge required, just find-and-replace.

### Names & date
Search `index.html` for:
- `Daphine` — her name, appears in the hero, letter, and finale.
- `RJ` — your name, appears in the letter signature and footer.
- `June 16` / `June 16th` — her birthday date, appears in the hero subtitle and letter date.

### Photos
Open `assets/images/` and replace any file while **keeping the same filename**, or change the `src="assets/images/..."` path on the relevant `<img>` tag in `index.html` to point to a new file. Recommended sizes: hero portrait ~800×800px square, gallery photos ~1000×1000px, Klawie photos ~1200×1200px. Square-ish crops work best since several of these are shown in circles or fixed-ratio frames.

### Written content (letter, love cards, secret messages)
All copy lives directly inside `index.html` as plain text:
- The full birthday letter is the `data-full-text="..."` attribute on the `<div id="letterText">` element — edit it like a normal paragraph, line breaks included.
- Each "Things I Love About You" card is a `<button class="love-card">` block — edit the `<h3>` (front label) and the `<p>` inside `.card-back` (the revealed message).
- Each secret message is a `<button class="secret-item" data-message="...">` — just change the text inside `data-message`.
- The Klawie memorial text is inside `.memorial-text` — three `<p>` paragraphs plus the quote.
- The finale closing line is the `<p id="finalMessage">` near the bottom of the file.

### Colors
Every color in the site is defined once, at the very top of `style.css`, inside `:root { ... }`. Change a hex value there and it updates everywhere automatically:
```css
--cream:        #FBF4EB;   /* main background */
--blush:        #F6D2D6;   /* soft pink accents */
--dusty-rose:   #C98A93;   /* primary accent — buttons, links */
--lavender:     #CDB8E0;   /* secondary accent */
--gold:         #C7A04C;   /* highlights, dividers, icons */
```

### Fonts
Also near the top of `style.css`:
```css
--font-display: 'Playfair Display', Georgia, serif;   /* headings */
--font-body:    'Jost', 'Helvetica Neue', Arial, sans-serif;  /* body text */
--font-hand:    'Caveat', cursive;                      /* handwritten accents */
```
To use different Google Fonts, swap the names here **and** update the `<link href="https://fonts.googleapis.com/...">` tag near the top of `index.html` to load the new font families.

### Music link / track info
The visible title and artist text are in the music player block near the bottom of `index.html`:
```html
<span class="music-title">A Couple Minutes</span>
<span class="music-artist">Olivia Dean</span>
```
The actual audio file path is set in the `<source src="assets/music/a-couple-minutes.mp3">` tag right below it.

---

## 4. How each animation works

- **Preloader** — a small heart "beats" via a CSS `transform: scale()` keyframe animation while the page loads, then fades out once everything is ready.
- **Hero petals** — a `<canvas>` element with a small JavaScript particle system; each petal is an ellipse drawn every animation frame, drifting downward and swaying side to side. It only runs while the hero is on-screen (using `IntersectionObserver`) to save battery.
- **Story thread** — the slim gold line on the left edge (desktop only) fills based on overall scroll position, and the nearest chapter's dot lights up — both calculated on the page's `scroll` event.
- **Flip cards** — pure CSS 3D transforms (`transform-style: preserve-3d` + `rotateY(180deg)`); JavaScript just toggles a `data-flipped` attribute when a card is clicked.
- **Letter typewriter** — the full letter is stored as one block of text; JavaScript reveals it one character at a time on a short interval, starting only once the letter scrolls into view.
- **Klawie fireflies & paw trail** — fireflies are small glowing `<span>` elements spawned on a timer and animated upward with CSS; the paw prints fade in and out in a staggered sequence to suggest gentle footsteps.
- **Gallery lightbox** — clicking a polaroid copies its image into a full-screen overlay; clicking the background, the × button, or pressing Escape closes it.
- **Secret messages** — clicking an icon opens a small centered popup with that note's hidden text.
- **Music player bars** — three small bars animate up and down only while the song is actually playing, giving a now-playing visual cue.
- **Finale starfield** — another small `<canvas>` particle system, this time stars that twinkle by oscillating their opacity with a sine wave.
- **Floating hearts** — small heart characters spawn continuously at the bottom of the finale and float upward, fading out; clicking "One Last Thing…" triggers an extra burst of 18 hearts at once.
- **Reduced motion** — every animation above checks (or is wrapped in CSS that checks) `prefers-reduced-motion`, so if her device has that accessibility setting on, animations are minimized automatically.

---

## 5. Ideas to make it even more personal

- Replace one or two of the generic love-card lines with a real inside joke only she'd recognize — those land hardest.
- Add a real specific memory to the letter (a trip, a date, a small moment) in place of the more general lines — even one concrete detail makes the whole letter feel more "her."
- If you have a voice memo of yourself, you could add a second `<audio>` element with a "play my voice" secret message button instead of (or alongside) the song.
- Consider adding a countdown or a "days we've been together" counter near the hero if that number means something to you both — happy to build that in if you want it.
- If you want a literal handwritten note, you could scan one and drop it in as an image inside the letter section instead of (or alongside) the typed letter.
