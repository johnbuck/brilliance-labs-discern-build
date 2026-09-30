# Launch and cutover (steps 8 to 10 of 10)

## Step 8 of 10: choose an approach and build
Explain the two paths in plain language and let the approver and the future maintainer choose:
- Keep the site builder and redesign. Familiar editor; the monthly fee continues. Claude supplies structure, copy and step-by-step editor instructions; a person makes the changes (or Claude does, through a browser tool the user is watching, if available and approved).
- A simple site Claude builds. Plain page files on a static host (for example Netlify, Cloudflare Pages or GitHub Pages; "static" means pages are prepared ahead of time, so they are fast and cheap to host). Forms go through the host's form feature or a form service. A small database can come later for things like blog posts or sign-ups. Updates happen by asking Claude, with a preview before anything goes live. The ministry this is drawn from chose this path.
Don't promise costs; have the user check current prices. Record the choice. For the static path, build in the user's project folder and keep a history of changes (version control; explain it as "a saved history of every change you can roll back"). Done: the approach is recorded and a first draft of the site exists on a preview link or in the builder's unpublished draft. Why: the person who will maintain the site must be comfortable with the tool, or updates will stop.

## Step 9 of 10: preview and review rounds
Deploy to a preview link only (a temporary address the host provides), or use the builder's unpublished draft. Before sending it to people, run an audit: have Claude review the preview from four angles (search basics, AI search answers, quality and accessibility, consistency with the brief and protected wording), fix what it finds, and repeat. In real use this took four rounds. Then send the approver the preview link with a short "what changed" summary and this list: facts correct, links work, forms reach the right inbox, looks right on a phone. Record approval (role, date) in the profile. Done: the approver has approved the preview in writing. Why: people review best when the obvious fixes are already done.

## Launch checklist
- [ ] Every placeholder resolved; times, address, phone and email confirmed by a person.
- [ ] Protected wording matches `HANDOFF.md` exactly.
- [ ] Redirects: every old URL in the inventory points to a new page with a permanent (301) redirect, including linked PDFs. Both `www` and the bare domain reach the site. A friendly "page not found" page exists.
- [ ] Each form sent with a test entry; it arrived in an inbox the ministry controls (not a personal or former staff address); spam protection on (a hidden "honeypot" field or the host's filter; avoid puzzles that block real people); test entries deleted. Forms that collect sensitive details (prayer, counseling, children) go only to the people who need them.
- [ ] Privacy notice page: what each form collects, who sees it, how long it is kept, and any analytics or embedded services. Reviewed by a leader.
- [ ] Images, fonts and music are licensed or owned; photos of people, especially children, have consent under the ministry's policy.
- [ ] Giving, calendar and video embeds work.
- [ ] Accessibility: headings in order, image descriptions (alt text), readable contrast, descriptive link text, labeled form fields, captions on video, works with a keyboard.
- [ ] Checked on a phone.
- [ ] Page titles, descriptions and a sitemap. For AI answers, see the ai-search-visibility skill.
- [ ] Analytics only if the ministry wants it; prefer a privacy-friendly option and mention it in the privacy notice.
- [ ] Domain: Claude writes the exact DNS records from the host's current instructions; the domain owner records every current record first, then makes the change. If the registrar shows a TTL (how long the internet remembers a record), lowering it a day ahead makes the switch spread faster.
- [ ] Email records untouched unless email is intentionally moving: MX, and the TXT records for SPF, DKIM and DMARC. Changing them can stop or spam-flag church email.
- [ ] HTTPS (the padlock) active on the real domain.
- [ ] Export of the old site's content and files saved before anything is cancelled.
- [ ] The approver gives an explicit go for the live launch.

## Step 10 of 10: cutover and after
- Choose a quiet time, not Saturday night or Sunday morning. DNS changes can take minutes to a day or two to reach everyone.
- After the switch, check the real domain, HTTPS, redirects, forms, giving and that email still arrives.
- Keep the old site and subscription until the approver confirms, usually after a couple of weeks.
- Rollback: the domain owner restores the recorded old DNS values; the old site is still there.
- Record the launch in the profile and `HANDOFF.md`.
- Make updates a routine: save the tested "edit, preview, approve, publish" steps as a small deploy skill or a written checklist, so every future change follows the same path.
Done: the new site answers on the real domain, the checks above pass, and the routine is written down. Why: most launch problems show up in the first two weeks, while the old site is still there to fall back on.

## Useful follow-up prompts
- "Write the DNS steps for our domain owner in plain language, with the old values to record first."
- "Run the four-angle audit on the preview and give me a one-paragraph what-changed summary."
- "Test every form on the preview and tell me where each submission went."
- "Draft a privacy notice from our form list and embeds for our leader to review."
- "Save our update routine as a skill: edit, preview link, my approval, then publish."
