# Fixes that help assistants describe you accurately

Choose fixes from what the scorecard shows. Write every fact from the confirmed fact sheet. Explain each fix to the user in one plain sentence before drafting it. None of these guarantees a mention.

## 1. Fix wrong facts everywhere they appear
Old service times, addresses or leaders usually come from a stale page or listing. Search the site and the cited sources for each wrong fact, and fix or remove it. Redirect old pages instead of leaving them up.

## 2. A clear About page: who, what, where
Open with two or three plain sentences an assistant could quote on its own: "[Name] is a [ministry type] in [neighborhood, city]. We [what you do] for [who]. [Services or programs] are [days and times] at [address]." Then the longer story. Keep one official name and use it everywhere.

## 3. An FAQ page in plain question-and-answer form
Use the scorecard questions, worded the way people ask them. One short, direct answer per question, with the key fact in the first sentence. Examples: "What time are services?", "Is there something for my kids?", "When is the food pantry open?", "Do I need to be a member to get help?" Keep answers current; date the page.

## 4. Structured data (schema.org)
Structured data is a small block of code in a page that states facts in a form machines read reliably. Put it in the page's HTML (JSON-LD format), or use the site builder's setting for it if it has one. It must say only what the visible page says. Check it before publishing with the Schema Markup Validator (validator.schema.org, for any schema.org type) or Google's Rich Results Test (for what Google may show); tool names and addresses change, so confirm them in the provider's current documentation. Example (fictional):

```json
{
  "@context": "https://schema.org",
  "@type": "Church",
  "name": "Cedar Hill Community Church",
  "url": "https://www.example.org/",
  "telephone": "+1-555-555-0100",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "100 Example Street",
    "addressLocality": "Springfield"
  },
  "sameAs": ["https://social.example.org/cedarhill"]
}
```

- Use `Church` for a congregation; use `Organization` (or `NGO`) for a ministry that isn't a church.
- Add an `Event` block (name, `startDate`, `location`, `organizer`) on pages for real, dated events.
- Add `FAQPage` markup to the FAQ page. Search engines may not display it specially, but it states each question and answer plainly.
- Service times still belong in plain text on the page; structured data supports the page, it doesn't replace it.

## 5. Consistent name, address and phone across listings
List every place the ministry appears: Google Business Profile, map apps (for example Apple Business Connect or Bing Places), denominational or network directories, social pages, community directories. Make name, address, phone, website and hours match the fact sheet exactly. Each listing's owner makes the change.

## 6. Google Business Profile
Claim or verify it through Google's own process (the owner does this). Set the right category, hours, phone, website and a few real photos. Post notable events. Answer the common questions in the profile if it offers that.

## 7. Let assistants read the site (a leadership decision)
The site's `robots.txt` file (at `/robots.txt`) tells crawlers what they may read; it is a request, not a lock. Read it and report what it blocks. Providers use separate names for three jobs, and each needs its own line:
- Training crawlers, which collect text to train future models: GPTBot (OpenAI), ClaudeBot (Anthropic). Blocking these keeps content out of training but does not by itself remove you from answers.
- Search crawlers, which index pages so the assistant can cite them in answers: OAI-SearchBot (OpenAI), Claude-SearchBot (Anthropic), PerplexityBot (Perplexity), Bingbot (Microsoft, which also feeds Copilot). Blocking these can keep the ministry out of answers.
- User fetchers, which open a page when a person asks about it: ChatGPT-User, Claude-User, Perplexity-User. Some providers say these follow `robots.txt`; others say they may not.
- Google is different: Googlebot serves Search and AI Overviews, so blocking it removes the site from Google entirely. `Google-Extended` is not a crawler but a `robots.txt` setting that controls whether Google may use already-crawled pages for Gemini training and grounding; it does not affect Search or AI Overviews. Applebot-Extended works the same way for Apple.
Names and roles were checked against provider documentation in September 2026 and do change; before advising, check each provider's current page. Many site builders write `robots.txt` for you; check the builder's settings. Explain the trade-off (being cited versus contributing to training), let a leader decide, and record the decision. Also make sure key facts appear as page text, not only inside images or PDFs, and that important pages are not marked "noindex".

## 8. An llms.txt file (optional, unofficial)
`llms.txt` is a community proposal from 2024, not a standard: a short plain-text file at `/llms.txt` that summarizes the site and links its key pages for AI tools. As of September 2026 no major assistant has said it uses the file for answers, Google has said Search ignores it, and most such files are never requested. It is harmless and takes minutes if the site can host a plain text file, so add it if the user likes, but expect no measurable change and say so. Every fact in it must already be on the site. Example (fictional):

```
# Cedar Hill Community Church
> A neighborhood church in Springfield. Sunday services 9:00 and 11:00 AM at 100 Example Street. Food pantry Saturdays 9:00 AM to 12:00 PM.

- [Plan a visit](https://www.example.org/visit): times, parking, kids
- [Food pantry](https://www.example.org/food-pantry): hours and what to bring
- [FAQ](https://www.example.org/faq)
```

## 9. Content that answers the real questions
If people ask about something you offer and no page explains it, write that page: a Plan a visit page, a food pantry page with days and hours, a kids page with safety and check-in. Plain words, current facts, one topic per page.
