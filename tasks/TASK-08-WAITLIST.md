# TASK-08: Waitlist Page Builder

## Context
This task builds and deploys the actual waitlist landing page. It reads the brand spec, page spec, and copy to produce a deployable static site.

## Model Assignment
- **Page generation**: Content tier (Haiku) — templated code generation
- **Copy integration**: Already produced by TASK-09, used as input

## Dependencies
- TASK-07 (brand spec, page spec)
- TASK-09 (landing page copy — can develop page shell in parallel, insert copy later)

## Deliverables

### 1. Page generator: `src/builders/waitlist-page.ts`

Reads:
- `.mvt/output/brand/BRAND.md` (colors, fonts, voice)
- `.mvt/output/brand/page-spec.md` (layout, components, responsive)
- `.mvt/output/funnel/copy/landing-page.md` (headlines, body, CTA text)
- `.mvt/output/waitlist/seo-spec.md` (meta tags, schema)
- `.mvt/output/ads/tracking-plan.md` (GTM container ID, events)

Produces a self-contained static site in `.mvt/output/waitlist/site/`:
```
site/
├── index.html          # Main landing page
├── thanks.html         # Post-signup thank you page with referral CTA
├── styles.css          # All styles (inline is also acceptable)
├── script.js           # Form handling, analytics events, referral logic
├── og-image.png        # Generated OG image (or placeholder with instructions)
└── robots.txt          # Allow all crawlers
```

### 2. Page requirements

**index.html**:
- Hero section: headline, subheadline, email capture form, CTA button
- Value propositions: 3 key benefits with icons/emoji
- Social proof placeholder: "Join X others" counter (starts at 0, updates from backend)
- Trust signals: "No spam", "Unsubscribe anytime", "Free early access"
- Footer: product name, privacy policy link placeholder
- Meta tags from SEO spec
- GTM container snippet from tracking plan
- Schema.org SoftwareApplication markup

**thanks.html**:
- Confirmation message
- Referral mechanism: "Share with friends, move up the waitlist"
- Unique referral link generation (via URL parameter)
- Social share buttons (Twitter, LinkedIn, email)

**script.js**:
- Form validation (email format)
- Form submission to configurable endpoint (default: a simple webhook URL)
- UTM parameter capture and storage
- Referral code capture from URL
- GA4 event firing: `waitlist_signup`, `referral_share`, `page_view`
- Simple A/B test: rotate between headline variants, store variant in cookie

### 3. Deployment options

The page builder should support multiple deployment targets. Implement at least one:

**Option A: Static file upload** (simplest)
- Output files ready for manual upload to Netlify/Vercel/Cloudflare Pages
- Include deployment instructions in `.mvt/output/waitlist/DEPLOY.md`

**Option B: Vercel deployment script**
- `scripts/deploy-vercel.sh` that uses the Vercel CLI
- Requires `VERCEL_TOKEN` environment variable

**Option C: GitHub Pages**
- `scripts/deploy-github-pages.sh` that pushes to a gh-pages branch
- Requires repo URL in config

### 4. Email collection backend

The simplest possible backend for collecting emails:

**Option A: Google Sheets webhook** (zero infrastructure)
- Google Apps Script that accepts POST and writes to a sheet
- Include the Apps Script code in `.mvt/output/waitlist/backend/google-sheets-webhook.gs`

**Option B: Simple API endpoint**
- A minimal Node.js/Express endpoint that writes to a JSON file or SQLite
- Include in `.mvt/output/waitlist/backend/`

Either way, the form's action URL is configurable in `config.yaml`.

### 5. A/B test framework

The page should support testing:
- 2-3 headline variants (stored in a config array in script.js)
- Variant assigned on first visit, persisted in localStorage
- Variant sent with signup event for analysis
- Conversion tracked per variant

## Acceptance Criteria
- [ ] `index.html` renders correctly in a browser (valid HTML5)
- [ ] Email form captures and submits email address
- [ ] UTM parameters are captured and sent with signup
- [ ] Referral code is generated and shareable
- [ ] `thanks.html` shows referral link with share buttons
- [ ] GA4 events fire correctly (test with GTM preview mode instructions)
- [ ] Page is mobile-responsive (works at 375px width)
- [ ] SEO meta tags are present and populated from spec
- [ ] A/B test assigns and persists variants
- [ ] At least one deployment option has working instructions
- [ ] Backend option collects emails to a retrievable store
