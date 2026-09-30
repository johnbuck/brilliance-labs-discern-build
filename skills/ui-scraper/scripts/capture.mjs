#!/usr/bin/env node
// Capture a website's visual style: colors, fonts, spacing, shapes, screenshots.
//
//   node capture.mjs <url> <output-folder> [--static]
//
// Writes into <output-folder>:
//   capture.json   everything measured (for Claude to read)
//   tokens.css     a starter set of CSS variables in the site's style
//   summary.md     a short human-readable summary
//   desktop.png, mobile.png   screenshots (browser mode only)
//
// Browser mode uses the person's installed Chrome or Edge through playwright-core,
// so nothing big has to be downloaded. If no browser is found (or --static is
// passed) it falls back to reading the HTML and CSS files directly.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const [, , rawUrl, outDir, ...flags] = process.argv;
if (!rawUrl || !outDir) {
  console.error('Usage: node capture.mjs <url> <output-folder> [--static]');
  process.exit(1);
}
const url = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- helpers ---
function toHex(c) {
  if (!c) return null;
  c = c.trim().toLowerCase();
  if (c.startsWith('#')) {
    if (c.length === 4) c = '#' + [...c.slice(1)].map(x => x + x).join('');
    return c.slice(0, 7);
  }
  const m = c.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/);
  if (!m) return null;
  let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  if (a < 0.5) return null; // mostly-transparent colors are decoration, not palette
  return '#' + [m[1], m[2], m[3]].map(n => Math.round(+n).toString(16).padStart(2, '0')).join('');
}
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function saturation(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
function topN(counts, n) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);
}
function firstFont(stack) {
  return (stack || '').split(',')[0].replace(/["']/g, '').trim();
}

// ------------------------------------------------------------ find browser --
async function launchBrowser() {
  let pw;
  try {
    pw = await import('playwright-core');
  } catch {
    return null;
  }
  const { chromium } = pw;
  for (const channel of ['chrome', 'msedge', 'chromium']) {
    try { return await chromium.launch({ channel }); } catch {}
  }
  // Browsers that Playwright may have downloaded before
  const caches = [
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright'),
  ].filter(Boolean);
  for (const dir of caches) {
    if (!fs.existsSync(dir)) continue;
    const builds = fs.readdirSync(dir).filter(d => /^chromium-\d+$/.test(d)).sort().reverse();
    for (const b of builds) {
      for (const exe of [
        'chrome-linux64/chrome', 'chrome-linux/chrome',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-win/chrome.exe', 'chrome-win64/chrome.exe',
      ]) {
        const p = path.join(dir, b, exe);
        if (fs.existsSync(p)) {
          try { return await chromium.launch({ executablePath: p }); } catch {}
        }
      }
    }
  }
  return null;
}

// ------------------------------------------------------------ browser mode --
// Runs inside the page. Measures what is actually rendered.
function measurePage() {
  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05;
  };
  const pick = (el, props) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const o = {};
    for (const p of props) o[p] = s.getPropertyValue(p);
    o.text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    return o;
  };
  const TEXT = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'color'];
  const BOX = ['background-color', 'border-radius', 'border', 'padding', 'box-shadow'];
  const first = sel => [...document.querySelectorAll(sel)].find(visible) || null;

  // CSS custom properties defined on :root (same-origin sheets only)
  const vars = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const walk = list => {
      for (const r of list) {
        if (r.cssRules && !r.selectorText) walk(r.cssRules);
        if (r.selectorText && /(^|,)\s*(:root|html)\s*(,|$)/.test(r.selectorText)) {
          for (const name of r.style) if (name.startsWith('--')) vars[name] = r.style.getPropertyValue(name).trim();
        }
      }
    };
    walk(rules);
  }

  // Color + font usage, weighted by visible area
  const colorArea = {}, textColor = {}, fontUse = {}, radii = {}, headingFont = {}, bodySize = {};
  let shadows = 0, elements = 0;
  const all = [...document.body.querySelectorAll('*')].slice(0, 4000);
  for (const el of all) {
    if (!visible(el)) continue;
    elements++;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const area = Math.min(r.width * r.height, 2e6);
    const bg = s.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colorArea[bg] = (colorArea[bg] || 0) + area;
    const hasOwnText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasOwnText) {
      const len = el.textContent.trim().length;
      textColor[s.color] = (textColor[s.color] || 0) + len;
      const f = s.fontFamily;
      fontUse[f] = (fontUse[f] || 0) + len;
      const size = parseFloat(s.fontSize);
      if (/^H[1-3]$/.test(el.tagName) || size >= 30) headingFont[f] = (headingFont[f] || 0) + len * size;
      else if (el.tagName === 'P' || el.tagName === 'LI') bodySize[s.fontSize + ' / ' + s.lineHeight] = (bodySize[s.fontSize + ' / ' + s.lineHeight] || 0) + len;
    }
    // Corner radius of "boxy" things (buttons, cards, inputs); circles are decoration
    const boxy = (bg && bg !== 'rgba(0, 0, 0, 0)') || parseFloat(s.borderTopWidth) > 0;
    const rad = s.borderTopLeftRadius;
    if (boxy && r.width > 24 && r.height > 24 && !rad.endsWith('%') && parseFloat(rad) < 200) radii[rad] = (radii[rad] || 0) + 1;
    if (s.boxShadow && s.boxShadow !== 'none') shadows++;
  }
  // The page background is often on <html>/<body> only
  for (const el of [document.documentElement, document.body]) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') colorArea[bg] = (colorArea[bg] || 0) + innerWidth * document.body.scrollHeight;
  }

  // Buttons: real buttons plus links that look like buttons
  const buttons = [...document.querySelectorAll('button, a, input[type=submit]')]
    .filter(visible)
    .filter(el => {
      const s = getComputedStyle(el);
      return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || (s.borderStyle !== 'none' && parseFloat(s.borderWidth) > 0);
    })
    .filter(el => { const r = el.getBoundingClientRect(); return r.bottom + scrollY > 0 && r.top + scrollY >= 0 && r.height >= 28; })
    .filter(el => !/skip to/i.test(el.innerText) && (el.innerText || '').trim().length > 1 && (el.innerText || '').trim().length < 40)
    .sort((a, b) => (b.closest('main') ? 1 : 0) - (a.closest('main') ? 1 : 0))
    .slice(0, 6)
    .map(el => pick(el, [...TEXT, ...BOX]));

  const header = first('header, nav, [role=banner]');
  const logoEl = header && [...header.querySelectorAll('img, svg')].find(visible);
  const logo = logoEl ? {
    tag: logoEl.tagName.toLowerCase(),
    src: logoEl.currentSrc || logoEl.getAttribute('src') || null,
    alt: logoEl.getAttribute('alt') || null,
    height: Math.round(logoEl.getBoundingClientRect().height),
  } : null;

  // Widest centered content container = the site's content width
  let contentWidth = 0;
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.maxWidth !== 'none' && s.maxWidth.endsWith('px') && s.marginLeft === s.marginRight) {
      contentWidth = Math.max(contentWidth, parseFloat(s.maxWidth));
    }
  }

  const outline = [...document.querySelectorAll('h1, h2, h3')].filter(visible).slice(0, 30)
    .map(h => `${h.tagName.toLowerCase()}: ${h.innerText.trim().replace(/\s+/g, ' ').slice(0, 70)}`);
  const sections = [...document.querySelectorAll('body > *, main > *, header, footer, section')]
    .filter(visible).filter(el => el.getBoundingClientRect().height > 120).slice(0, 25)
    .map(el => ({
      tag: el.tagName.toLowerCase(),
      class: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 60),
      height: Math.round(el.getBoundingClientRect().height),
      background: getComputedStyle(el).backgroundColor,
    }));

  const fontLinks = [...document.querySelectorAll('link[rel=stylesheet][href*="fonts.googleapis.com"], link[rel=stylesheet][href*="use.typekit"], link[rel=stylesheet][href*="fonts.bunny"]')]
    .map(l => l.href);

  return {
    title: document.title,
    description: document.querySelector('meta[name=description]')?.content || '',
    vars,
    pageBg: [document.body, document.documentElement].map(e => getComputedStyle(e).backgroundColor).find(c => c !== 'rgba(0, 0, 0, 0)') || 'rgb(255, 255, 255)',
    colorArea, textColor, fontUse, radii, headingFont, bodySize, shadows, elements,
    typography: {
      body: pick(document.body, TEXT),
      h1: pick(first('h1'), TEXT),
      h2: pick(first('h2'), TEXT),
      h3: pick(first('h3'), TEXT),
      p: pick(first('main p, p'), TEXT),
      link: pick(first('main a, p a, a'), TEXT),
      navLink: pick(header && [...header.querySelectorAll('a')].find(a => visible(a) && a.innerText.trim()), TEXT),
    },
    header: pick(header, [...BOX, 'height', 'position']),
    footer: pick(first('footer'), [...BOX, 'color']),
    input: pick(first('input[type=text], input[type=email], input:not([type]), textarea'), [...TEXT, ...BOX]),
    buttons, logo, contentWidth, outline, sections, fontLinks,
  };
}

async function captureWithBrowser(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async () => {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  });
  // Scroll through the page so lazy images and scroll animations appear
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  const data = await page.evaluate(measurePage);
  const height = await page.evaluate(() => document.body.scrollHeight);
  await page.screenshot({ path: path.join(outDir, 'desktop.png'), fullPage: true, clip: { x: 0, y: 0, width: 1440, height: Math.min(height, 7000) } });
  await page.screenshot({ path: path.join(outDir, 'desktop-top.png') });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await mobile.waitForTimeout(1200);
  await mobile.screenshot({ path: path.join(outDir, 'mobile.png') });
  await browser.close();
  return { mode: 'browser', ...data };
}

// ------------------------------------------------------------- static mode --
async function captureStatic() {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (class style capture)' } });
  const html = await res.text();
  const cssUrls = [...html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)]
    .map(m => m[0].match(/href=["']([^"']+)["']/i)?.[1]).filter(Boolean)
    .map(h => new URL(h, url).href);
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  const fontLinks = cssUrls.filter(u => /fonts\.(googleapis|bunny)|typekit/.test(u));
  for (const u of cssUrls.filter(u => !fontLinks.includes(u)).slice(0, 8)) {
    try { css += '\n' + await (await fetch(u)).text(); } catch {}
  }
  const vars = {};
  for (const block of css.matchAll(/(?<![\w.#-])(?::root|html)\s*{([^}]*)}/g)) {
    for (const m of block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  }
  const resolve = v => { for (let i = 0; i < 5 && /var\(/.test(v); i++) v = v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_, k, fb) => vars[k] ?? fb ?? ''); return v.trim(); };
  const bodyRule = [...css.matchAll(/(?<![\w.#-])body\)?\s*{([^}]*)}/g)].map(m => m[1]).join(';');
  const pageBg = resolve(bodyRule.match(/background(?:-color)?\s*:\s*([^;]+)/)?.[1] || '#ffffff');
  const colorArea = {};
  for (const m of css.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgba?\([^)]+\)/gi)) colorArea[m[0]] = (colorArea[m[0]] || 0) + 1;
  const fontUse = {};
  for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) { const f = resolve(m[1]); if (f) fontUse[f] = (fontUse[f] || 0) + 1; }
  const bodyFont = resolve(bodyRule.match(/font-family\s*:\s*([^;]+)/)?.[1] || '');
  const headingFont = {};
  for (const m of css.matchAll(/(?:^|})\s*([^{}]*\b(?:h1|h2|title|display|heading)[^{}]*){([^}]*)}/gi)) {
    const f = m[2].match(/font-family\s*:\s*([^;]+)/)?.[1];
    if (f) { const r = resolve(f); headingFont[r] = (headingFont[r] || 0) + 1; }
  }
  const radii = {};
  for (const m of css.matchAll(/border-radius\s*:\s*([^;}]+)/gi)) radii[m[1].trim()] = (radii[m[1].trim()] || 0) + 1;
  const outline = [...html.matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0, 30)
    .map(m => `${m[1].toLowerCase()}: ${m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70)}`);
  return {
    mode: 'static',
    title: html.match(/<title>([^<]*)/i)?.[1]?.trim() || '',
    description: html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] || '',
    vars, pageBg, colorArea, textColor: {}, fontUse, radii, headingFont, bodySize: {},
    typography: bodyFont ? { p: { 'font-family': bodyFont } } : {}, shadows: (css.match(/box-shadow\s*:(?!\s*none)/gi) || []).length,
    buttons: [], outline, fontLinks, logo: null, contentWidth: 0, sections: [],
  };
}

// ----------------------------------------------------------------- analyse --
function analyse(d) {
  // Palette: merge background area + text usage into hex swatches
  const swatches = {};
  const add = (c, w) => { const h = toHex(c); if (h) swatches[h] = (swatches[h] || 0) + w; };
  for (const [c, w] of Object.entries(d.colorArea)) add(c, w);
  const totalText = Object.values(d.textColor).reduce((a, b) => a + b, 0) || 1;
  const totalArea = Object.values(d.colorArea).reduce((a, b) => a + b, 0) || 1;
  for (const [c, w] of Object.entries(d.textColor)) add(c, (w / totalText) * totalArea * 0.3);
  const ranked = topN(swatches, 24).map(([hex]) => hex);

  const bgHex = toHex(d.pageBg) ||
    topN(Object.fromEntries(Object.entries(d.colorArea).map(([c, w]) => [toHex(c), w]).filter(([h]) => h)), 1)[0]?.[0] || '#ffffff';
  const textHex = toHex(topN(d.textColor, 1)[0]?.[0]) || toHex(d.typography.body?.color) ||
    ranked.find(h => Math.abs(luminance(h) - luminance(bgHex)) > 0.5) || '#1a1a1a';
  const fills = topN(Object.fromEntries(Object.entries(d.colorArea).map(([c, w]) => [toHex(c), w]).filter(([h]) => h)), 24).map(([h]) => h);
  const accents = [...new Set([...fills, ...ranked])].filter(h => saturation(h) > 0.35 && luminance(h) > 0.04 && luminance(h) < 0.8);
  const neutrals = ranked.filter(h => saturation(h) <= 0.35);
  const dark = neutrals.find(h => luminance(h) < 0.03) || '#111111';
  const alt = neutrals.find(h => h !== bgHex && Math.abs(luminance(h) - luminance(bgHex)) < 0.15) || bgHex;

  const fonts = topN(d.fontUse, 6).map(([stack, n]) => ({ family: firstFont(stack), stack, weight: n }));
  const headingFont = topN(d.headingFont || {}, 1)[0]?.[0] || d.typography.h1?.['font-family'] || d.typography.h2?.['font-family'] || fonts[0]?.stack || 'system-ui, sans-serif';
  const bodyFont = (d.mode === 'static' && d.typography.p?.['font-family']) || topN(d.fontUse, 1)[0]?.[0] || d.typography.p?.['font-family'] || d.typography.body?.['font-family'] || fonts[0]?.stack || 'system-ui, sans-serif';
  const radius = topN(d.radii, 1)[0]?.[0] || '0px';
  const bodySize = topN(d.bodySize || {}, 1)[0]?.[0] || null;
  const btn = d.buttons[0] || null;

  return {
    palette: { background: bgHex, alt, text: textHex, dark, accents: accents.slice(0, 4), neutrals: neutrals.slice(0, 6), ranked },
    fonts: { heading: headingFont, body: bodyFont, bodySize, all: fonts },
    radius, usesShadows: d.shadows > 10, button: btn,
  };
}

function tokensCss(a, d) {
  const acc = a.palette.accents;
  const h = d.typography;
  // The heading sample that actually uses the heading font (h1 is sometimes just a lede)
  const hd = [h.h1, h.h2, h.h3].find(x => x && firstFont(x['font-family']) === firstFont(a.fonts.heading)) || h.h2 || h.h1;
  return `/* Style tokens captured from ${url} on ${new Date().toISOString().slice(0, 10)}.
   Starting point only: check against the screenshots and adjust. */
${d.fontLinks.length ? d.fontLinks.map(l => `/* font: <link rel="stylesheet" href="${l}"> */`).join('\n') + '\n' : ''}
:root {
  /* Colors */
  --bg:        ${a.palette.background};
  --bg-alt:    ${a.palette.alt};
  --ink:       ${a.palette.text};
  --dark:      ${a.palette.dark};
  --accent:    ${acc[0] || a.palette.dark};
${acc.slice(1).map((c, i) => `  --accent-${i + 2}:  ${c};`).join('\n')}
  --border:    color-mix(in srgb, var(--ink) 12%, transparent);
  --muted:     color-mix(in srgb, var(--ink) 65%, var(--bg));

  /* Type */
  --font-heading: ${a.fonts.heading};
  --font-body:    ${a.fonts.body};
  --heading-size:    ${hd?.['font-size'] || '48px'};
  --heading-weight:  ${hd?.['font-weight'] || '700'};
  --heading-case:    ${hd?.['text-transform'] || 'none'};
  --heading-spacing: ${hd?.['letter-spacing'] || 'normal'};
  --heading-line:    ${hd?.['line-height'] || '1.1'};
  --body-size:    ${a.fonts.bodySize?.split(' / ')[0] || h.body?.['font-size'] || '17px'};
  --body-line:    ${a.fonts.bodySize?.split(' / ')[1] || h.body?.['line-height'] || '1.6'};

  /* Shape */
  --radius:       ${a.radius};
  --shadow:       ${a.usesShadows ? '0 8px 24px rgba(0,0,0,0.08)' : 'none'};
  --content-width: ${d.contentWidth ? d.contentWidth + 'px' : '1200px'};
}
${Object.keys(d.vars).length ? `
/* The site's own CSS variables, exactly as published */
:root {
${Object.entries(d.vars).slice(0, 80).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
}
` : ''}`;
}

function summaryMd(a, d) {
  const b = a.button;
  return `# Style capture: ${d.title || url}

- **URL:** ${url}
- **Captured:** ${new Date().toISOString().slice(0, 16).replace('T', ' ')} (${d.mode} mode${d.mode === 'static' ? ': no screenshots, colors counted from CSS files' : ''})
- **Description:** ${d.description || 'n/a'}

## Colors
- Background: \`${a.palette.background}\`   Alternate: \`${a.palette.alt}\`
- Text: \`${a.palette.text}\`   Dark: \`${a.palette.dark}\`
- Accents: ${a.palette.accents.map(c => `\`${c}\``).join(', ') || 'none detected'}
- Most-used overall: ${a.palette.ranked.slice(0, 10).map(c => `\`${c}\``).join(' ')}

## Fonts
- Headings: ${a.fonts.heading}${d.typography.h2 ? ` (e.g. h2 ${d.typography.h2['font-size']}, weight ${d.typography.h2['font-weight']}, text-transform ${d.typography.h2['text-transform']})` : ''}
- Body: ${a.fonts.body}${a.fonts.bodySize ? ` (${a.fonts.bodySize})` : ''}
- Font files: ${d.fontLinks.length ? d.fontLinks.join(', ') : 'none from Google Fonts/Typekit found'}

## Shape
- Most common corner radius: ${a.radius}${a.radius === '0px' ? ' (square corners)' : ''}
- Shadows: ${a.usesShadows ? 'used' : 'rarely or never used'}
- Content width: ${d.contentWidth ? d.contentWidth + 'px' : 'unknown'}
${b ? `- Main button: background ${b['background-color']}, text ${b.color}, radius ${b['border-radius']}, ${b['text-transform']}, "${b.text}"` : ''}

## Page outline
${d.outline.map(o => `- ${o}`).join('\n') || '- (none found)'}

## Site CSS variables found
${Object.keys(d.vars).length ? Object.keys(d.vars).length + ' variables. See tokens.css.' : 'None (the site does not publish CSS variables).'}
`;
}

// -------------------------------------------------------------------- main --
const forceStatic = flags.includes('--static');
let data;
const browser = forceStatic ? null : await launchBrowser();
if (browser) {
  console.log('Using browser mode (real rendering + screenshots)…');
  try { data = await captureWithBrowser(browser); }
  catch (e) { console.log(`Browser capture failed (${e.message.split('\n')[0]}); falling back to static mode…`); await browser.close().catch(() => {}); }
}
if (!data) {
  if (!forceStatic) console.log('No Chrome or Edge found: using static mode (no screenshots).');
  data = await captureStatic();
}
const analysis = analyse(data);
fs.writeFileSync(path.join(outDir, 'capture.json'), JSON.stringify({ url, capturedAt: new Date().toISOString(), analysis, raw: data }, null, 2));
fs.writeFileSync(path.join(outDir, 'tokens.css'), tokensCss(analysis, data));
fs.writeFileSync(path.join(outDir, 'summary.md'), summaryMd(analysis, data));
console.log(`\nDone. Wrote ${fs.readdirSync(outDir).join(', ')} to ${outDir}\n`);
console.log(fs.readFileSync(path.join(outDir, 'summary.md'), 'utf8'));
