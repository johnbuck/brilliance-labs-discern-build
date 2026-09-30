---
name: ui-scraper
description: Capture the look of any website (colors, fonts, spacing, button and card styles, screenshots) and turn it into a reusable style kit, then build a style board or a new page in that style. Interviews a non-technical person with a few quick questions. Use when someone wants to copy, borrow, match, or learn from a website's design, "make it look like <site>", or scrape a site's UI/style.
---

# Capture a website's style

You are helping someone who is **not technical** capture how a website looks and reuse that
look, usually in a 15-minute class slot. Follow the tone rules in the project's CLAUDE.md.

**Teaching point to mention once:** "This is exactly how our Brilliance Labs style kit was made.
We pointed this tool at brilliancelabs.org, and it wrote down the colors, fonts, and shapes so
Claude could reuse them."

## Ground rules (say these briefly, in your own words, once)
- We borrow the **look**: colors, fonts, spacing, layout ideas.
- We don't copy other people's **words, photos, or logos**. We write our own content.
- Don't use this to make a page that pretends to be another organization.

## Step 1: Interview, one question at a time

1. **Which website?** Ask in plain chat so they can type or paste it: "Which website's look do you
   like? Paste the address, or just tell me the name and I'll find it." If they give a name, not
   an address, work out the address (use WebSearch or WebFetch if needed) and confirm it with them.

2. **What do you want to do with it?** (AskUserQuestion, header "Goal")
   - See the style, then build a page with it (Recommended)
   - Just show me the style board (colors, fonts, buttons)
   - Compare it to the Brilliance Labs style
   - Turn it into a reusable style kit (a new skill) for my team

3. If they're building a page: **What's the page about?** Plain chat: "In a sentence or two, what
   should the new page be about? (A ministry, an event, a campaign… rough notes are fine.)"

## Step 2: Capture

1. Make a folder: `my-projects/<site-name>-style/` (e.g. `my-projects/bible-com-style/`).
2. Make sure packages are installed (`node_modules/` exists in the workspace root; if not, run `npm install`).
3. Run the capture script from the workspace root:
   ```
   node .claude/skills/ui-scraper/scripts/capture.mjs <url> my-projects/<site-name>-style/capture
   ```
   Tell them first: "I'm opening the site in a hidden browser and measuring its colors, fonts and
   shapes. About 10–20 seconds."
   - It uses their installed Chrome or Edge. If it says "static mode", that's fine: there are no
     screenshots, but colors and fonts still come through. Don't install anything big.
   - If the site blocks it or times out, say so kindly and suggest another site.
4. Read what it wrote: `summary.md` (the quick read), `tokens.css`, and **look at the screenshots**
   (`desktop-top.png`, `desktop.png`, `mobile.png`) with the Read tool. The numbers tell you the
   values; the screenshots tell you the feel. Use both.

## Step 3: Write the style kit

In `my-projects/<site-name>-style/`, write:

1. **`STYLE.md`**, following the same outline as
   `.claude/skills/brilliance-ui/brand/STYLE.md`: "The feel in one sentence", Color table
   (role, token, value, use), Type, Shape and layout, Components, Voice. Base it on the capture
   and screenshots. Correct any obvious mistakes in the automatic numbers (e.g. if "accent" is
   really a link color). Describe the voice from the site's headlines, but don't copy their text.

2. **`style.css`**: a complete stylesheet in the captured style that uses **the same class names as
   `.claude/skills/brilliance-ui/brand/brilliance.css`** (`site-nav`, `hero`, `btn btn-primary`,
   `section`, `section-title`, `eyebrow`, `card-grid`/`card`, `stats-band`, `post-grid`/`post-card`,
   `dark-band`, `field`/`input`, `table`, `kpi`, `site-footer`, …). The easiest route: copy
   brilliance.css, then change the tokens at the top (colors, fonts, radius, sizes, letter-case) and
   the few rules that make the Brilliance look distinctive (e.g. uppercase Bebas headlines, square
   corners) to match this site. That way any page built for the Brilliance style also works with this one.
   Include the site's font link (from `summary.md`) in a comment at the top. If the fonts come from a
   paid service (Typekit/Adobe Fonts), pick the closest free Google Font and say which one you used.

3. **`index.html`**: the **style board**, a single page that uses `style.css` and shows:
   - the site's name, the address, and the capture date
   - the `desktop-top.png` screenshot next to (or above) your version, labelled "Original" and "Our version"
   - color swatches with hex values and roles
   - type samples (heading sizes, body text, a label)
   - buttons (primary, dark, ghost), one row of cards, a form field
   Open it in their browser. Say what they're looking at in one or two sentences.

## Step 4: Use it (match their goal)

- **Build a page:** follow Steps 3–5 of `.claude/skills/brilliance-ui/SKILL.md` (confirm, build,
  keep going), but link `style.css` instead of brilliance.css, use `.nav-wordmark` with *their*
  ministry's name, and write original content from their description. Save it as `page.html` in
  the same folder and open it.
- **Compare with Brilliance:** add a section to the style board with the two palettes, fonts, and
  button styles side by side, plus three plain-language sentences on how they differ in feel.
- **Reusable style kit (skill):** create `.claude/skills/<site-name>-ui/` containing `SKILL.md`
  (adapt brilliance-ui's SKILL.md: new name, description, and paths), and a `brand/` folder with
  `STYLE.md`, `style.css`, and a small `example.html`. Tell them: "From now on anyone using this
  folder can type /<site-name>-ui to build pages in this style." (They may need to restart Claude Code
  for the new command to appear.) Only do this for a style they own or have permission to use.

## Step 5: Keep going
Offer 2–3 next things they could say, e.g. "Make the colors warmer", "Use this style for our
youth ministry page", "What makes this site feel so calm?"
