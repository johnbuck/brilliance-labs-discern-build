# Brilliance Labs: style guide (for building pages)

Captured from brilliancelabs.org. `brilliance.css` puts all of this into classes;
`example.html` shows every component in use. Start from the example and remove what you
don't need rather than writing new CSS.

## The feel in one sentence
A warm cream page, huge condensed uppercase headlines, plenty of empty space, hairline
dividers, square corners, and **one** confident orange accent, like a match struck in a quiet room.

## Color
| Role | Token | Value | Use it for |
|---|---|---|---|
| Page | `--bg` | `#F5F2EB` | Default background (warm cream, never pure white) |
| Alt section | `--bg-alt` | `#EDEAE2` | Every other section, stats band |
| Ink | `--ink` / `--black` | `#1A1A1A` / `#0D0D0D` | Text, dark buttons, dark bands |
| Muted text | `--muted` | 64% black | Secondary paragraphs |
| Orange | `--orange` | `#E8860F` | Fills, bars, rules, primary buttons, text **on black** |
| Orange text | `--orange-ink` | `#9A5700` | Small orange text **on cream** (eyebrows, labels) |
| Green | `--green` / `--green-ink` | `#13874a` / `#0F703E` | Community/grants accent; "up" numbers |
| Gold | `--gold` / `--gold-ink` | `#BA7517` / `#8F5A12` | Secondary accent |

Rules:
- Orange is an accent. Use it on at most one button per screen, plus thin bars and rules.
- Text on an orange button is **black**, never white (white fails contrast).
- Small orange text on cream uses `--orange-ink`, not `--orange`.
- Dark sections are near-black `#0D0D0D` with cream text and orange eyebrows.

## Type
- **Bebas Neue** (`--display`): every headline, ALWAYS UPPERCASE, tight line-height (0.86–0.95).
  Break headlines onto two short lines with `<br>`: "Our<br>Programs", "From<br>the Lab".
- **DM Sans** (`--body`): everything else. Labels and eyebrows are 12px, uppercase, with wide
  letter-spacing (0.16–0.22em).
- **Cormorant Garamond italic** (`--serif`): quotes and scripture only.
- Nothing smaller than 12px.

## Shape and layout
- Square corners everywhere (`--radius: 0`). No rounded buttons, no drop-shadow cards.
- Cards sit in a hairline grid (`.card-grid`): 1px gaps showing the border color.
- Generous space: sections are ~120px tall top and bottom on desktop (`.section`).
- Side gutter 52px desktop / 28px tablet / 20px phone (`--gutter`).
- Signature details: the orange dash between hero lines, the 24px orange line before
  eyebrows, the 56px orange rule under section titles, the 4px orange left edge on the stats band.

## Components (class names)
`site-nav` · `hero` · `stats-band` · `section` + `section-head` / `display-head` · `card-grid > card`
· `post-grid > post-card` · `pull-quote` · `dark-band` · `field` + `input/select/textarea`
· `table` · `kpi-grid > kpi` · `panel` · `badge` · `site-footer` · buttons: `btn btn-primary | btn-dark | btn-ghost`.

## Voice (for any words you write)
- Plain, concrete, confident. Short sentences. Say what happens, who it's for, and when.
- Lead with specifics and numbers ("$263,710 awarded to 42 organizations"), not adjectives.
- Faith is central but not preachy: "Bringing bright ideas into dark spaces."
- Buttons are verbs in uppercase: "Explore Our Initiatives", "Apply by Oct 23 →", "Give Now".
- Avoid hype words ("revolutionary", "cutting-edge"), exclamation marks, and jargon.
- The tagline is **Brilliance — Ignited** (with an em dash).

## Brand use
- The Brilliance Labs logo (`logo.png`) and name are for Brilliance Labs pages only.
- For another ministry's page "in the Brilliance style", use `.nav-wordmark` with that
  ministry's name (e.g. `Grace Chapel<span>.</span>`) and leave out the Brilliance logo.
