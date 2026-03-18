import fs from 'node:fs/promises';
import path from 'node:path';
import { STATE_ROOT } from '../utils/paths.ts';

function extractSection(markdown: string, heading: string): string[] {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?:\\n## |$)`, 'i');
  const match = markdown.match(regex);
  if (!match) {
    return [];
  }
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

export async function buildWaitlistPage(): Promise<void> {
  const siteDir = path.join(STATE_ROOT, 'output', 'waitlist', 'site');
  const backendDir = path.join(STATE_ROOT, 'output', 'waitlist', 'backend');
  await fs.mkdir(siteDir, { recursive: true });
  await fs.mkdir(backendDir, { recursive: true });

  const brand = await readFileOrDefault(path.join(STATE_ROOT, 'output', 'brand', 'BRAND.md'));
  const pageSpec = await readFileOrDefault(path.join(STATE_ROOT, 'output', 'brand', 'page-spec.md'));
  const copy = await readFileOrDefault(path.join(STATE_ROOT, 'output', 'funnel', 'copy', 'landing-page.md'));
  const seo = await readFileOrDefault(path.join(STATE_ROOT, 'output', 'waitlist', 'seo-spec.md'));

  const headlines = extractSection(copy, 'Headlines');
  const valueProps = extractSection(copy, 'Value Props');
  const trustSignals = extractSection(copy, 'Trust Signals');
  const cta = extractSection(copy, 'CTA')[0] ?? 'Join the Waitlist';
  const primaryHeadline = headlines[0] ?? 'Validate demand before you build';
  const subheadline = extractSection(copy, 'Subheadline')[0] ?? 'Capture real demand signals with a focused waitlist experiment.';
  const title = seo.match(/Title: (.+)/)?.[1] ?? 'Demand Validation';
  const description = seo.match(/Meta description: (.+)/)?.[1] ?? 'Validate demand before you build.';
  const palette = {
    primary: brand.match(/Primary: (#[0-9A-Fa-f]{6})/)?.[1] ?? '#0F766E',
    accent: brand.match(/Accent: (#[0-9A-Fa-f]{6})/)?.[1] ?? '#F97316',
    background: brand.match(/Background: (#[0-9A-Fa-f]{6})/)?.[1] ?? '#F8FAFC',
    text: brand.match(/Text: (#[0-9A-Fa-f]{6})/)?.[1] ?? '#0F172A'
  };

  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="./styles.css">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"${escapeHtml(title)}","applicationCategory":"BusinessApplication"}</script>
</head>
<body>
  <main class="page">
    <section class="hero">
      <p class="eyebrow">Manual deployment review required</p>
      <h1>${escapeHtml(primaryHeadline)}</h1>
      <p class="subheadline">${escapeHtml(subheadline)}</p>
      <form id="waitlist-form" class="signup-card">
        <label for="email">Work email</label>
        <input id="email" name="email" type="email" placeholder="you@company.com" required>
        <button type="submit">${escapeHtml(cta.replace('- Primary: ', ''))}</button>
        <p class="helper">${trustSignals.join(' • ')}</p>
      </form>
    </section>
    <section class="value-grid">
      ${valueProps.map((item) => `<article><h2>${escapeHtml(item)}</h2><p>Evidence-first messaging for launch validation.</p></article>`).join('')}
    </section>
    <section class="proof">
      <p>Join <span id="counter">0</span> others testing this idea.</p>
    </section>
    <footer>
      <p>${escapeHtml(title)}</p>
      <a href="#">Privacy policy</a>
    </footer>
  </main>
  <script src="./script.js"></script>
</body>
</html>`;

  const thanksHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thanks | ${escapeHtml(title)}</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="thanks-page">
    <h1>You're in.</h1>
    <p>Share your referral link and move up the waitlist.</p>
    <input id="referral-link" readonly>
    <div class="share-row">
      <button data-share="twitter">Share on X</button>
      <button data-share="linkedin">Share on LinkedIn</button>
      <button data-share="email">Share by Email</button>
    </div>
    <a href="./index.html">Back to homepage</a>
  </main>
  <script src="./script.js"></script>
</body>
</html>`;

  const styles = `:root {
  --bg: ${palette.background};
  --text: ${palette.text};
  --primary: ${palette.primary};
  --accent: ${palette.accent};
  --surface: #ffffff;
}
body { margin: 0; font-family: 'Source Sans 3', system-ui, sans-serif; background: linear-gradient(180deg, var(--bg), #ffffff); color: var(--text); }
.page, .thanks-page { max-width: 1080px; margin: 0 auto; padding: 24px; }
.hero { padding: 72px 0 32px; display: grid; gap: 16px; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary); font-weight: 700; }
h1 { font-family: 'Space Grotesk', system-ui, sans-serif; font-size: clamp(2.5rem, 5vw, 4.5rem); line-height: 0.95; margin: 0; }
.subheadline { font-size: 1.125rem; max-width: 48rem; }
.signup-card { display: grid; gap: 12px; max-width: 420px; background: var(--surface); padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); }
input, button { font: inherit; padding: 14px 16px; border-radius: 10px; border: 1px solid #cbd5e1; }
button { border: none; background: var(--accent); color: white; font-weight: 700; cursor: pointer; transition: transform 160ms ease; }
button:hover { transform: translateY(-1px); }
.value-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); padding: 24px 0; }
.value-grid article { background: var(--surface); padding: 20px; border-radius: 16px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
.proof, footer { padding: 24px 0; }
.share-row { display: flex; flex-wrap: wrap; gap: 12px; }
@media (max-width: 375px) { .page, .thanks-page { padding: 16px; } h1 { font-size: 2.2rem; } }
`;

  const script = `const headlineVariants = ${JSON.stringify(headlines.length ? headlines : [primaryHeadline])};
const form = document.querySelector('#waitlist-form');
const counter = document.querySelector('#counter');
const referralInput = document.querySelector('#referral-link');
const headline = document.querySelector('h1');
const params = new URLSearchParams(window.location.search);
const variantKey = 'mvt-headline-variant';
const existingVariant = localStorage.getItem(variantKey);
const chosenVariant = existingVariant || headlineVariants[Math.floor(Math.random() * headlineVariants.length)];
localStorage.setItem(variantKey, chosenVariant);
if (headline) headline.textContent = chosenVariant;
if (counter) counter.textContent = localStorage.getItem('mvt-signups') || '0';
if (referralInput) {
  const referralCode = params.get('ref') || crypto.randomUUID().slice(0, 8);
  referralInput.value = window.location.origin + window.location.pathname.replace('thanks.html', 'index.html') + '?ref=' + referralCode;
}
function fireEvent(name, detail) { console.log('GA4', name, detail); }
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Enter a valid email address.');
      return;
    }
    const payload = {
      email,
      variant: chosenVariant,
      referral_code: params.get('ref') || '',
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || ''
    };
    fireEvent('waitlist_signup', payload);
    const signups = Number(localStorage.getItem('mvt-signups') || '0') + 1;
    localStorage.setItem('mvt-signups', String(signups));
    window.location.href = './thanks.html';
  });
}
document.querySelectorAll('[data-share]').forEach((button) => {
  button.addEventListener('click', () => {
    fireEvent('referral_share', { channel: button.getAttribute('data-share') });
  });
});`;

  const deploy = `# Deploy\n\n## Static Upload\nUpload the contents of .mvt/output/waitlist/site to Netlify, Vercel, or Cloudflare Pages.\n\n## Manual Steps\n1. Replace placeholder domain values.\n2. Configure your form webhook endpoint in script.js.\n3. Add the real GTM snippet from the tracking plan.\n4. Verify schema, OG image, and analytics before launch.\n`;

  const webhook = `function doPost(e) {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();\n  var data = JSON.parse(e.postData.contents);\n  sheet.appendRow([new Date(), data.email, data.variant, data.utm_source, data.utm_medium, data.utm_campaign, data.referral_code]);\n  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);\n}`;

  await Promise.all([
    fs.writeFile(path.join(siteDir, 'index.html'), indexHtml, 'utf8'),
    fs.writeFile(path.join(siteDir, 'thanks.html'), thanksHtml, 'utf8'),
    fs.writeFile(path.join(siteDir, 'styles.css'), styles, 'utf8'),
    fs.writeFile(path.join(siteDir, 'script.js'), script, 'utf8'),
    fs.writeFile(path.join(siteDir, 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf8'),
    fs.writeFile(path.join(siteDir, 'og-image.png'), 'Placeholder OG image. Replace before launch.\n', 'utf8'),
    fs.writeFile(path.join(STATE_ROOT, 'output', 'waitlist', 'DEPLOY.md'), deploy, 'utf8'),
    fs.writeFile(path.join(backendDir, 'google-sheets-webhook.gs'), webhook, 'utf8')
  ]);

  void pageSpec;
}

async function readFileOrDefault(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


