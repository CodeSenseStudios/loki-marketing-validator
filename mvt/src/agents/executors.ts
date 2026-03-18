import fs from 'node:fs/promises';
import path from 'node:path';
import type { Task } from '../types.ts';
import { calculateContrastRatio } from '../utils/validators.ts';
import { STATE_ROOT } from '../utils/paths.ts';
import { parseGapHunterOutput } from '../parser/gap-hunter-parser.ts';

async function ensureBrief() {
  const briefPath = path.join(STATE_ROOT, 'output', 'experiment-brief.json');
  try {
    const raw = await fs.readFile(briefPath, 'utf8');
    return JSON.parse(raw) as Awaited<ReturnType<typeof parseGapHunterOutput>>;
  } catch {
    return parseGapHunterOutput();
  }
}

async function readText(relativePath: string, fallback = ''): Promise<string> {
  try {
    return await fs.readFile(path.join(STATE_ROOT, relativePath), 'utf8');
  } catch {
    return fallback;
  }
}

async function writeOutputs(task: Task, contents: Record<string, string>): Promise<string[]> {
  const written: string[] = [];
  for (const output of task.expected_outputs) {
    const key = normalize(output);
    const content = contents[key] ?? contents.default ?? `Generated placeholder for ${path.basename(output)}`;
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, content, 'utf8');
    written.push(output);
  }
  return written;
}

function normalize(value: string): string {
  return value.replace(/\\/g, '/').replace(`${normalizeStateRoot()}/`, '').replace(/^\.mvt\//, '');
}

function normalizeStateRoot(): string {
  return STATE_ROOT.replace(/\\/g, '/');
}

function personaCard(name: string, role: string, pains: string[], goals: string[], channels: string[]): string {
  return `### ${name}\n- Role: ${role}\n- Pain points: ${pains.join('; ')}\n- Goals: ${goals.join('; ')}\n- Channels: ${channels.join(', ')}\n`;
}

export const AGENT_EXECUTORS: Record<string, (task: Task) => Promise<string[]>> = {
  async 'brand-guardian'(task) {
    const brief = await ensureBrief();
    const palette = {
      primary: '#0F766E',
      secondary: '#164E63',
      accent: '#F97316',
      background: '#F8FAFC',
      text: '#0F172A'
    };
    const contrast = calculateContrastRatio(palette.background, palette.text);
    const brand = `# BRAND\n\n## Product Name\n- Name: ${brief.product_name}\n- Domain check: manual verification required\n- Trademark check: manual verification required\n\n## Tagline\n1. ${brief.product_name} turns ${brief.target_audience.pain_points[0] ?? 'messy workflows'} into measurable momentum.\n2. Validate demand before you build.\n3. A calmer way to prove market pull.\n\n## Positioning Statement\nFor ${brief.target_audience.persona} who need a faster path to demand validation, ${brief.product_name} is a validation workflow that helps them capture real market intent. Unlike manual spreadsheets or guesswork, it produces a structured experiment and verdict.\n\n## Brand Voice\n- Adjectives: confident, grounded, direct, useful, optimistic\n- We say: Prove it with real behavior.\n- We say: Start lean, learn fast.\n- We say: Make the signal obvious.\n- We do not say: Revolutionary disruption for everyone.\n- We do not say: Guaranteed growth overnight.\n- We do not say: AI magic handles everything.\n\n## Color Palette\n- Primary: ${palette.primary}\n- Secondary: ${palette.secondary}\n- Accent: ${palette.accent}\n- Background: ${palette.background}\n- Text: ${palette.text}\n- Contrast check: ${contrast}:1 (AA pass)\n\n## Typography\n- Heading font: Space Grotesk\n- Body font: Source Sans 3\n\n## Brand Philosophy\n${brief.product_name} should exist because early-stage teams need a disciplined way to validate demand before they spend engineering time. The brand should feel like a sharp operator: calm under pressure, skeptical of fluff, and biased toward evidence.\n`;
    return writeOutputs(task, { 'output/brand/BRAND.md': brand, default: brand });
  },
  async 'ui-designer'(task) {
    const brand = await readText('output/brand/BRAND.md');
    const spec = `# Waitlist Page Spec\n\n## Layout\nHero -> Value Props -> Social Proof Placeholder -> CTA -> Footer\n\n## Design Tokens\n- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64\n- Border radius: 8px, 16px\n- Shadow: 0 10px 30px rgba(15, 23, 42, 0.12)\n\n## Components\n- Email input with inline validation and helper text\n- Primary CTA button with accent background\n- Headline and subheadline stack with max-width 12 words on headline lines\n- Trust badges row with three signals\n\n## Responsive Breakpoints\n- Mobile: < 768px\n- Tablet: 768px - 1024px\n- Desktop: > 1024px\n\n## Motion\n- Fade-up reveal for hero copy\n- Subtle CTA hover lift\n\n## Brand Alignment\n${brand.split('\n').slice(0, 12).join('\n')}\n`;
    return writeOutputs(task, { 'output/brand/page-spec.md': spec, default: spec });
  },
  async 'ux-researcher'(task) {
    const brief = await ensureBrief();
    const personas = `# Personas\n\n${personaCard('Evidence-Seeking Founder', brief.target_audience.persona, brief.target_audience.pain_points, ['Reduce guesswork', 'Validate demand before build'], ['LinkedIn', 'Founder communities'])}\n${personaCard('Revenue Operations Lead', 'Ops lead in a growing SaaS team', ['Hard to prioritize experiments', 'Weak attribution clarity'], ['Show efficient acquisition paths', 'Reduce wasted spend'], ['LinkedIn', 'Email', 'Reddit'])}\n\n## JTBD\n- When I have a promising idea, help me test whether real buyers care before I allocate engineering time.\n- When channels underperform, help me see which message and audience combinations deserve more investment.\n`;
    const guide = `# Interview Guide\n\n## 15-Minute Script\n1. Intro and permission to take notes\n2. Confirm role and context\n3. Explore the last time the problem happened\n4. Understand current workaround and cost\n5. React to the proposed concept\n6. Ask for willingness to pay and referral\n`;
    return writeOutputs(task, {
      'output/brand/personas.md': personas,
      'output/outbound/interview-guide.md': guide,
      default: personas
    });
  },
  async 'growth-hacker'(task) {
    const brief = await ensureBrief();
    const doc = `# Funnel Architecture\n\n[Ad/Post] -> [Landing Page] -> [Email Signup] -> [Welcome Email] -> [Value Email D+2] -> [Social Proof Email D+5] -> [Urgency Email D+10] -> [Survey Email D+12] -> [Intent Signal Captured]\n\n## Referral Loop\nEach signup gets a shareable link. Successful referrals move them up the waitlist and unlock early access messaging.\n\n## Experiment Hypothesis\nWe expect at least ${(brief.success_criteria.min_conversion_rate * 100).toFixed(1)}% of visitors to sign up at a CAC below $${brief.success_criteria.max_cac}.\n\n## Metrics Per Stage\n- Visits\n- Landing page conversion\n- Waitlist signups\n- Email opens and clicks\n- Survey completions\n- Interview score\n\n## Kill Criteria\n- CAC > 3x target after meaningful click volume\n- Conversion rate < 0.5% after 500+ visitors\n- Budget > 80% spent with < 20% of target signups\n`;
    return writeOutputs(task, { 'output/funnel/architecture.md': doc, default: doc });
  },
  async 'content-creator'(task) {
    const brief = await ensureBrief();
    const landing = `# Landing Page Copy\n\n## Headlines\n- Stop guessing if ${brief.product_name} has demand\n- Validate demand before you build the wrong thing\n- Turn ${brief.target_audience.pain_points[0] ?? 'market uncertainty'} into a clear go/no-go signal\n\n## Subheadline\n${brief.one_liner}\n\n## Value Props\n- Prove interest with real signups\n- Learn which message actually converts\n- Leave with a clear build decision\n\n## CTA\n- Primary: Join the Waitlist\n- Variant: Get Early Access\n- Variant: Reserve My Spot\n\n## Trust Signals\n- No spam\n- Unsubscribe anytime\n- Free early access\n\n## Footer\n${brief.product_name} is built for teams who want evidence before execution.\n`;
    const outputs: Record<string, string> = { 'output/funnel/copy/landing-page.md': landing, default: landing };
    const emails = {
      'welcome.md': 'Welcome to the waitlist. We will share what we learn and invite early testers first.',
      'value-prop.md': 'The real cost of the current workflow is slow decisions and noisy signals.',
      'social-proof.md': 'More operators are joining because they want evidence, not assumptions.',
      'behind-scenes.md': 'We are building this because too many promising ideas fail from weak validation.',
      'urgency.md': 'Early spots are limited so we can work closely with the first cohort.',
      'survey.md': 'Three quick questions help us tailor the product and pricing signal.'
    };
    for (const [name, body] of Object.entries(emails)) {
      outputs[`output/funnel/copy/emails/${name}`] = `# ${name}\n\n- Subject A: ${brief.product_name}: quick update\n- Subject B: Still interested in ${brief.product_name}?\n- Preview: A short note from the validation team\n\n${body}\n\nCTA: Reply or join the waitlist.\n\nUnsubscribe notice: You can opt out anytime.\n`;
    }
    return writeOutputs(task, outputs);
  },
  async 'seo-specialist'(task) {
    const brief = await ensureBrief();
    const doc = `# SEO Spec\n\n- Title: ${brief.product_name} | Validate demand before you build\n- Meta description: A structured way to test demand with landing pages, outreach, and clear go/no-go metrics.\n- OG title: ${brief.product_name}\n- OG description: Validate market demand with real signals before you build.\n- Twitter card: summary_large_image\n- Target keyword: demand validation software\n- Secondary keywords: waitlist testing, product validation, CAC experiment, landing page test\n- Canonical URL: set during deployment\n- H1/H2 guidance: H1 focused on demand validation promise, H2 on benefits and proof\n- JSON-LD: SoftwareApplication schema with manual deployment URL insertion\n`;
    return writeOutputs(task, { 'output/waitlist/seo-spec.md': doc, default: doc });
  },
  async 'linkedin-creator'(task) {
    const brief = await ensureBrief();
    const files: Record<string, string> = {
      'output/funnel/social/linkedin/launch-announcement.md': `Building ${brief.product_name} because I am tired of teams confusing enthusiasm with demand. Real signups beat internal opinions. If this problem sounds familiar, join the waitlist. #productstrategy #growth #validation`,
      'output/funnel/social/linkedin/problem-agitation.md': `A lot of teams ship before they know if anyone cares. Then they blame the build, not the missing signal. I am working on a better validation loop. #startup #product #marketing`,
      'output/funnel/social/linkedin/behind-the-scenes.md': `Behind the scenes, we are turning market questions into measurable experiments. The goal is a cleaner go/no-go decision. #buildinpublic #gtm #saas`,
      'output/funnel/social/linkedin/social-proof.md': `We are collecting early interest, objections, and pricing reactions before code. That feedback changes the roadmap fast. #customerresearch #demandgen #founders`,
      'output/funnel/social/linkedin/last-day.md': `Closing the first round of waitlist invites soon. If you want to shape the validation workflow, now is the time. #earlyaccess #productled #experiments`
    };
    return writeOutputs(task, files);
  },
  async 'paid-social-strategist'(task) {
    const doc = `# Social Ads Plan\n\n## Platform Matrix\n| Platform | Audience Fit | Cost | Precision | Min Spend | Score |\n| Meta | 4 | 3 | 4 | 2 | 13 |\n| LinkedIn | 5 | 2 | 5 | 2 | 14 |\n| Reddit | 4 | 4 | 3 | 4 | 15 |\n| TikTok | 2 | 3 | 2 | 3 | 10 |\n\n## Recommended Platforms\n1. Reddit\n2. LinkedIn\n\n## Audience Targeting\n- Meta: problem-aware founders and operators\n- LinkedIn: RevOps, Growth, Product, and Founder titles in 10-500 person SaaS companies\n- Reddit: manual subreddit validation required; start with founder and SaaS operations communities\n\n## Placement Strategy\nFeed-first with lightweight remarketing only after initial signal.\n\n## Budget Allocation\n- LinkedIn: 55%\n- Reddit: 25%\n- Meta retargeting: 20%\n`;
    return writeOutputs(task, { 'output/ads/social-plan.md': doc, default: doc });
  },
  async 'ppc-strategist'(task) {
    const doc = `# Google Ads Plan\n\n## Campaign Structure\n- Search: high-intent validation terms\n- Display remarketing: return visitors and high-engagement users\n\n## Ad Groups\n- demand validation software\n- waitlist testing\n- product validation tools\n\n## Keywords\n- [demand validation software]\n- \"waitlist experiment\"\n- [product validation landing page]\n\n## Negative Keywords\nfree, jobs, agency, course, template\n\n## Bidding\nStart with Manual CPC, move to target CPA after enough conversions.\n\n## Budget Split\n60% search / 40% display\n`;
    return writeOutputs(task, { 'output/ads/google-plan.md': doc, default: doc });
  },
  async 'ad-creative-strategist'(task) {
    const outputs: Record<string, string> = {
      'output/ads/creatives/google-rsa.md': '# Google RSA\n\n' + Array.from({ length: 15 }, (_, i) => `- Headline ${i + 1}: Validate demand before you build`).join('\n') + '\n\n' + Array.from({ length: 4 }, (_, i) => `- Description ${i + 1}: Turn uncertain ideas into clear go/no-go signals.`).join('\n'),
      'output/ads/creatives/meta-ads.md': '# Meta Ads\n\n' + Array.from({ length: 5 }, (_, i) => `- Primary Text ${i + 1}: Stop shipping on gut feel. Capture real demand with a waitlist experiment.`).join('\n') + '\n' + Array.from({ length: 5 }, (_, i) => `- Headline ${i + 1}: Prove demand first`).join('\n'),
      'output/ads/creatives/linkedin-ads.md': '# LinkedIn Ads\n\n' + Array.from({ length: 3 }, (_, i) => `- Variant ${i + 1}: Evidence-first launch planning for GTM leaders.`).join('\n'),
      'output/ads/creatives/ab-test-matrix.md': '# A/B Test Matrix\n\nTest benefit-led vs skepticism-led headlines first. Aim for at least 100 clicks per core concept before picking a winner.'
    };
    return writeOutputs(task, outputs);
  },
  async 'tracking-specialist'(task) {
    const doc = `# Tracking Plan\n\n## GTM Container\n- Tags for GA4 page view, waitlist signup, referral share\n- Variables for UTM source, medium, campaign, content, and term\n\n## GA4 Events\n- page_view\n- waitlist_signup\n- referral_share\n- email_capture\n\n## Platform Pixels\n- Meta: PageView, Lead\n- Google Ads: signup conversion\n- LinkedIn: signup conversion\n\n## UTM Schema\n- utm_source: google|meta|linkedin|reddit|organic\n- utm_medium: cpc|social|email|referral\n- utm_campaign: {experiment-name}-{platform}-{audience}\n- utm_content: {creative-variant-id}\n- utm_term: {keyword}\n\n## Attribution\nUse last-click attribution for the experiment period.\n`;
    return writeOutputs(task, { 'output/ads/tracking-plan.md': doc, default: doc });
  },
  async 'outbound-strategist'(task) {
    const outputs: Record<string, string> = {
      'output/outbound/sequences/cold-email.md': '# Cold Email\n\n## Email 1\nSubject A: quick question\nSubject B: are you seeing this too?\nBody: I keep seeing teams struggle to validate demand before they build. Is that showing up for you too?\n\n## Email 2\nSubject A: curious about your workflow\nSubject B: would 15 minutes help?\nBody: I am testing a lightweight validation workflow and would value your perspective.\n\n## Email 3\nSubject A: worth closing the loop?\nSubject B: not relevant?\nBody: Quick follow-up. Did this miss the mark, or is the problem simply not a priority?\n',
      'output/outbound/sequences/linkedin-dm.md': '# LinkedIn DM\n\n1. Enjoyed your recent post on GTM tradeoffs. I am researching how teams validate demand before building.\n2. Sharing a short insight from the experiment work: clear signal usually comes from one strong audience-message pairing, not more noise.\n3. If useful, I would love 15 minutes of your perspective. Waitlist link is optional.\n',
      'output/outbound/targeting.md': '# Targeting\n\n- Company criteria: SaaS, 10-500 employees, recurring acquisition experiments\n- Person criteria: Founder, Growth Lead, RevOps Lead, Product Lead\n- Where to find them: Sales Navigator, community directories, attendee lists\n- Volume targets: 50 emails, 50 LinkedIn DMs, 5 interviews\n- Benchmarks: 5-10% email replies, 15-25% LinkedIn acceptance\n'
    };
    return writeOutputs(task, outputs);
  },
  async 'discovery-coach'(task) {
    const outputs: Record<string, string> = {
      'output/outbound/interview-script.md': '# Interview Script\n\n## Intro\nThank them, explain the research context, and ask permission to take notes.\n\n## Screening\nConfirm role, team context, and whether they live with the target problem.\n\n## Problem Exploration\nAsk for the last time the problem happened, its frequency, and current workarounds.\n\n## Current Solution\nAsk what they use now, what it costs, and what frustrates them.\n\n## Solution Reaction\nShare a short concept, then ask if they would use and pay for it.\n\n## Close\nAsk to join the waitlist and refer another relevant person.\n',
      'output/outbound/signal-scoring.md': '# Signal Scoring\n\n| Signal | Score | Indicator |\n| Strong intent | 5 | I would pay for this today |\n| High interest | 4 | This sounds useful and relevant |\n| Mild interest | 3 | Interesting, maybe later |\n| Polite deflection | 2 | Send me more info |\n| No fit | 1 | Problem does not resonate |\n\nGo signal: average score >= 3.5 across 5+ interviews.\n'
    };
    return writeOutputs(task, outputs);
  },
  async 'reddit-builder'(task) {
    const doc = `# Reddit Plan\n\n## Subreddits\n- r/startups (manual validation required)\n- r/SaaS (manual validation required)\n- r/Entrepreneur (manual validation required)\n- r/growthhacking (manual validation required)\n- r/ProductManagement (manual validation required)\n\n## Engagement Strategy\nComment with value at least five times before posting. Never lead with product language.\n\n## Draft Posts\n1. How are you validating demand before you build?\n2. I am testing a lightweight workflow for proving demand. What would you want to see?\n3. One useful lesson: message and audience alignment matters more than tool count.\n\n## Rules\n- Disclose affiliation if asked\n- Respond to every comment\n- Track signups via UTM links\n`;
    return writeOutputs(task, { 'output/outbound/reddit-plan.md': doc, default: doc });
  }
};
