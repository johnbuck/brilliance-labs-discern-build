---
name: brilliance-ui
description: Build a web page in the Brilliance Labs visual style (brilliancelabs.org). Interviews a non-technical person with a few quick questions, then builds a single-page site (event page, ministry homepage, announcement, sign-up page, etc.) using the Brilliance design system and opens it in the browser. Use when someone wants a page "like Brilliance Labs", in the Brilliance style, or with the Brilliance brand.
---

# Build a page in the Brilliance Labs style

You are helping someone who is **not technical** build a real web page in the Brilliance Labs
style, usually in a 15-minute class slot. Keep it fast, friendly, and visual. Follow the
tone rules in the project's CLAUDE.md.

The design system is in `brand/` next to this file:
- `brand/STYLE.md`: the rules (colors, type, layout, voice). **Read this first.**
- `brand/brilliance.css`: every style, ready to use. Don't write new CSS unless you have to.
- `brand/example.html`: every component in use. Copy sections from here.
- `brand/logo.png`: the Brilliance Labs logo (only for Brilliance Labs pages).

## Step 1: Welcome (one short message)

Say something like: "Let's build a web page in the Brilliance Labs style. I'll ask 3 or 4
quick questions, then you'll watch it come together. There are no wrong answers."

If the person says "just build something", "surprise me", or the instructor says to go
quickly, skip to Step 3 using the defaults marked (Recommended).

## Step 2: Interview, one question at a time

Use AskUserQuestion for each question (one per call, so it feels like a conversation).
Put the recommended option first.

1. **What are we making?** (header: "Page type")
   - Event page (Recommended): a retreat, class, service, fundraiser, or gathering
   - Ministry homepage: who you are, what you do, how to get involved
   - Announcement or campaign: one big message and a clear next step
   - Sign-up page: a short form people fill in

2. **Whose page is it?** (header: "Brand")
   - My own ministry, in the Brilliance style (Recommended): uses their ministry's name as the wordmark
   - Brilliance Labs itself: uses the Brilliance logo and name

3. **The details.** Ask this as a normal chat question, not AskUserQuestion, so they can type freely:
   "Tell me about it in a sentence or two: the name, what it is, who it's for, and any
   date, place, or link you know. Rough notes are fine. I'll fill in the rest and you can change anything."
   If they chose "my own ministry" and didn't give its name, ask for it.

4. **What should be on the page?** (header: "Sections", multiSelect: true)
   Choose sensible options for the page type, for example for an event:
   - Big headline with date and a register button
   - What to expect (3 cards)
   - Schedule
   - Key numbers (stats band)
   - Sign-up form
   - FAQ
   - Closing call to action (dark band)
   The nav, hero and footer are always included; say so in the question.

5. **Accent color** (header: "Accent"). Ask only if it's their own ministry's page:
   - Brilliance orange (Recommended)
   - Green: growth, community
   - Gold: warm, classic
   - Honey: soft, gentle

## Step 3: Confirm in plain English

Summarize in 2–3 short sentences what you'll build ("A one-page site for the Grace Chapel
Men's Retreat, Oct 17–19, with a big headline, three 'what to expect' cards, a schedule,
and a sign-up form, in Brilliance orange."). Then say "Building it now…" and continue.
Don't wait for approval unless something is unclear.

## Step 4: Build

1. Pick a short folder name from the page name, e.g. `my-projects/mens-retreat/`, and create it.
2. Copy `brand/brilliance.css` into it. Copy `brand/logo.png` too if this is a Brilliance Labs page.
3. Write `index.html` in that folder:
   - Start from `brand/example.html`: same `<head>` (Google Fonts link + `brilliance.css`),
     same component markup and class names.
   - Keep only the sections they chose, in a sensible order. Always: nav → hero → … → footer.
   - Their own ministry: use `<a class="nav-wordmark">Name<span>.</span></a>` instead of the
     logo, and their name in the footer. Set the accent by adding the class to `<body>`
     (`accent-green`, `accent-gold`, `accent-honey`; orange needs nothing).
   - Write the words yourself, following the Voice rules in STYLE.md: concrete, warm, short.
     Where you don't know a fact (price, address), write a clear placeholder in [square brackets]
     so it's easy to spot and replace.
   - Headlines: UPPERCASE Bebas, broken into two short lines with `<br>`.
   - Forms don't send anything. Show a friendly "Thanks! (demo)" message on submit, like the example.
   - No images unless they give you one. The design works without photos.
4. Open `index.html` in their browser (see CLAUDE.md, "Opening things").
5. Tell them in one or two sentences what they're looking at.

## Step 5: Keep going (this is the real lesson)

Offer 3 short things they can say next, to show that changing it is just a conversation:
- "Make the headline say ___"
- "Add a section with our three core values"
- "Make it feel more [joyful / serious / simple]"

When they ask for a change, make it, reopen or refresh the page, and say what changed in one line.
Stay inside the design system: reuse classes from `brilliance.css`; if you really need something
new, add a small `<style>` block in the page using the existing tokens (`var(--orange)`, etc.).

## Quality checks before you show it
- It looks like `example.html`: cream background, Bebas uppercase headlines, square corners,
  orange used sparingly, black text on orange buttons.
- Nothing is cut off on a phone-width screen (the CSS handles this if you use its classes).
- Every placeholder is in [square brackets].
- The Brilliance logo appears only on Brilliance Labs pages.
