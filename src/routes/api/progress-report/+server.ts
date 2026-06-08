/**
 * POST /api/progress-report
 *
 * Accepts the user's progressMap from localStorage as JSON, computes
 * all stats server-side, and returns a print-optimised HTML page.
 * The client auto-triggers window.print() after it loads.
 *
 * No DB reads — all data comes from the client payload.
 */

import type { RequestHandler } from './$types';
import { State } from 'ts-fsrs';
import { CATEGORIES_BY_LEVEL } from '$lib/types';
import type { CardProgress, CEFRLevel } from '$lib/types';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

const CATEGORY_LABELS: Record<string, string> = {
  greetings: 'Greetings',
  numbers: 'Numbers',
  colors: 'Colors',
  family: 'Family',
  body: 'Body',
  food: 'Food',
  animals: 'Animals',
  home: 'Home',
  'days-months': 'Days & Months',
  classroom: 'Classroom',
  'basic-adjectives': 'Basic Adjectives',
  'basic-verbs': 'Basic Verbs',
  'pronouns-and-questions': 'Pronouns & Questions',
  feelings: 'Feelings',
  weather: 'Weather',
  transportation: 'Transportation',
  shopping: 'Shopping',
  transport: 'Transport',
  clothing: 'Clothing',
  hobbies: 'Hobbies',
  directions: 'Directions',
  occupations: 'Occupations',
  sports: 'Sports',
  'health-basic': 'Health — Basic',
  time: 'Time',
  'descriptive-adjectives': 'Descriptive Adjectives',
  cooking: 'Cooking',
  nature: 'Nature',
  'house-chores': 'House & Chores',
  communication: 'Communication',
  travel: 'Travel',
  environment: 'Environment',
  media: 'Media',
  culture: 'Culture',
  technology: 'Technology',
  relationships: 'Relationships',
  education: 'Education',
  work: 'Work',
  'city-life': 'City Life',
  traditions: 'Traditions',
  'opinion-adjectives': 'Opinion Adjectives',
  'food-cooking-advanced': 'Food & Cooking — Advanced',
  'housing-renting': 'Housing & Renting',
  'health-body-intermediate': 'Health & Body',
  'finance-banking': 'Finance & Banking',
  politics: 'Politics',
  economics: 'Economics',
  'social-issues': 'Social Issues',
  arts: 'Arts',
  science: 'Science',
  emotions: 'Emotions',
  idioms: 'Idioms',
  history: 'History',
  law: 'Law',
  literature: 'Literature',
  'advanced-adjectives': 'Advanced Adjectives',
  philosophy: 'Philosophy',
  medicine: 'Medicine',
  psychology: 'Psychology',
  business: 'Business',
  religion: 'Religion',
  uttrykk: 'Phrases (uttrykk)',
  'uttrykk-preview': 'Phrases (preview)',
  workplace: 'Workplace',
  'mental-wellbeing': 'Mental Wellbeing',
  'sports-fitness': 'Sports & Fitness',
  'arts-culture': 'Arts & Culture',
  'norwegian-society': 'Norwegian Society',
  'politics-civics': 'Politics & Civics',
  'health-system': 'Health System',
  'language-learning': 'Language Learning',
  'relationships-family': 'Relationships & Family'
};

function labelFor(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface LevelStat {
  level: CEFRLevel;
  seen: number;
  memorized: number;
  learning: number;
  forgotten: number;
  due: number;
  totalCategories: number;
  seenCategories: number;
}

interface CategoryStat {
  level: CEFRLevel;
  category: string;
  label: string;
  seen: number;
  memorized: number;
  due: number;
}

function computeStats(progressMap: Record<string, CardProgress>) {
  const now = new Date();
  const allCards = Object.values(progressMap);

  // Total counts
  const totalSeen = allCards.length;
  const totalMemorized = allCards.filter((c) => c.fsrs.state === State.Review).length;
  const totalDue = allCards.filter((c) => new Date(c.fsrs.due) <= now).length;

  // CEFR estimate
  const seenCatsByLevel: Record<CEFRLevel, Set<string>> = {
    A1: new Set(),
    A2: new Set(),
    B1: new Set(),
    B2: new Set(),
    C: new Set()
  };
  for (const card of allCards) {
    seenCatsByLevel[card.level].add(card.category);
  }
  const categoryCountByLevel = Object.fromEntries(
    LEVELS.map((l) => [l, CATEGORIES_BY_LEVEL[l].length])
  ) as Record<CEFRLevel, number>;

  let solidLevel: CEFRLevel | null = null;
  let growingLevel: CEFRLevel | null = null;
  const coverage = LEVELS.map((level) => ({
    level,
    pct: Math.min(
      100,
      Math.round((seenCatsByLevel[level].size / categoryCountByLevel[level]) * 100)
    )
  }));
  for (const { level, pct } of coverage) {
    if (pct >= 50) solidLevel = level;
    else if (pct > 0 && !growingLevel) growingLevel = level;
  }

  let cefrLabel: string;
  let cefrDetail: string;
  if (!solidLevel && !growingLevel) {
    cefrLabel = '—';
    cefrDetail = 'No cards reviewed yet.';
  } else if (solidLevel && growingLevel) {
    const sPct = coverage.find((c) => c.level === solidLevel)?.pct ?? 0;
    const gPct = coverage.find((c) => c.level === growingLevel)?.pct ?? 0;
    cefrLabel = solidLevel;
    cefrDetail = `${sPct}% of ${solidLevel} covered · growing into ${growingLevel} (${gPct}%)`;
  } else if (solidLevel) {
    const sPct = coverage.find((c) => c.level === solidLevel)?.pct ?? 0;
    cefrLabel = solidLevel;
    cefrDetail = `${sPct}% of ${solidLevel} categories covered`;
  } else {
    const a1pct = coverage.find((c) => c.level === 'A1')?.pct ?? 0;
    const a2pct = coverage.find((c) => c.level === 'A2')?.pct ?? 0;
    cefrLabel = 'Getting started';
    cefrDetail = `${a1pct}% of A1 · ${a2pct}% of A2`;
  }

  // Per-level stats
  const levelStats: LevelStat[] = LEVELS.map((level) => {
    const cards = allCards.filter((c) => c.level === level);
    return {
      level,
      seen: cards.length,
      memorized: cards.filter((c) => c.fsrs.state === State.Review).length,
      learning: cards.filter(
        (c) => c.fsrs.state === State.Learning || c.fsrs.state === State.Relearning
      ).length,
      forgotten: cards.filter((c) => c.fsrs.state === State.Relearning).length,
      due: cards.filter((c) => new Date(c.fsrs.due) <= now).length,
      totalCategories: categoryCountByLevel[level],
      seenCategories: seenCatsByLevel[level].size
    };
  }).filter((l) => l.seen > 0);

  // Per-category stats — top 8 strongest and weakest
  const catMap = new Map<string, CategoryStat>();
  for (const card of allCards) {
    const key = `${card.level}/${card.category}`;
    if (!catMap.has(key)) {
      catMap.set(key, {
        level: card.level,
        category: card.category,
        label: labelFor(card.category),
        seen: 0,
        memorized: 0,
        due: 0
      });
    }
    const s = catMap.get(key)!;
    s.seen++;
    if (card.fsrs.state === State.Review) s.memorized++;
    if (new Date(card.fsrs.due) <= now) s.due++;
  }

  const allCats = [...catMap.values()].filter(
    (c) => c.category !== 'uttrykk' && c.category !== 'uttrykk-preview'
  );
  const strongest = [...allCats]
    .filter((c) => c.seen >= 5)
    .sort((a, b) => b.memorized / b.seen - a.memorized / a.seen)
    .slice(0, 6);
  const needsWork = [...allCats]
    .filter((c) => c.seen >= 5)
    .sort((a, b) => a.memorized / a.seen - b.memorized / b.seen)
    .slice(0, 6);

  return {
    totalSeen,
    totalMemorized,
    totalDue,
    cefrLabel,
    cefrDetail,
    levelStats,
    strongest,
    needsWork,
    coverage
  };
}

function bar(value: number, max: number, color: string): string {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return `<div style="background:#e5e7eb;border-radius:4px;height:8px;width:100%;margin-top:4px">
    <div style="background:${color};border-radius:4px;height:8px;width:${pct}%"></div>
  </div>`;
}

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A1: '#10b981',
  A2: '#14b8a6',
  B1: '#3b82f6',
  B2: '#6366f1',
  C: '#a855f7'
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let progressMap: Record<string, CardProgress>;
  try {
    const body = await request.json();
    progressMap = body.progressMap ?? {};
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const stats = computeStats(progressMap);
  const displayName =
    (
      await import('$lib/server/profile').then((m) =>
        m.getProfile(locals.supabase, locals.user!.id)
      )
    )?.display_name ?? null;

  const name = displayName ?? locals.user.email?.split('@')[0] ?? 'Learner';
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const levelRows = stats.levelStats
    .map((l) => {
      const pct = l.seen > 0 ? Math.round((l.memorized / l.seen) * 100) : 0;
      const color = LEVEL_COLORS[l.level];
      return `
      <tr>
        <td style="padding:10px 12px;font-weight:600;color:${color}">${l.level}</td>
        <td style="padding:10px 12px;text-align:center">${l.seen}</td>
        <td style="padding:10px 12px;text-align:center">${l.memorized}</td>
        <td style="padding:10px 12px;text-align:center">${l.due}</td>
        <td style="padding:10px 12px;min-width:120px">
          ${bar(l.memorized, l.seen, color)}
          <span style="font-size:11px;color:#6b7280">${pct}% memorized · ${l.seenCategories}/${l.totalCategories} categories</span>
        </td>
      </tr>`;
    })
    .join('');

  function catCard(c: CategoryStat): string {
    const pct = c.seen > 0 ? Math.round((c.memorized / c.seen) * 100) : 0;
    const color = LEVEL_COLORS[c.level];
    return `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-size:13px;font-weight:600;color:#111">${c.label}</span>
          <span style="font-size:11px;color:${color};font-weight:600">${c.level}</span>
        </div>
        ${bar(c.memorized, c.seen, color)}
        <span style="font-size:11px;color:#6b7280">${pct}% · ${c.memorized}/${c.seen} cards</span>
      </div>`;
  }

  const strongestHtml =
    stats.strongest.length > 0
      ? stats.strongest.map(catCard).join('')
      : '<p style="font-size:13px;color:#9ca3af">Study at least 5 cards in a category to see it here.</p>';

  const needsWorkHtml =
    stats.needsWork.length > 0
      ? stats.needsWork.map(catCard).join('')
      : '<p style="font-size:13px;color:#9ca3af">Study at least 5 cards in a category to see it here.</p>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Progress Report — ${name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 700; color: #111; }
    h2 { font-size: 15px; font-weight: 700; color: #374151; margin: 28px 0 12px; text-transform: uppercase; letter-spacing: .05em; }
    .meta { color: #6b7280; font-size: 13px; margin-top: 4px; }
    .cefr-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px 22px; margin: 24px 0; display: flex; align-items: center; gap: 20px; }
    .cefr-level { font-size: 48px; font-weight: 800; color: #2563eb; line-height: 1; }
    .cefr-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #3b82f6; }
    .cefr-detail { font-size: 13px; color: #374151; margin-top: 4px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; }
    .summary-value { font-size: 28px; font-weight: 700; }
    .summary-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
    th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    th:not(:first-child) { text-align: center; }
    tbody tr { border-bottom: 1px solid #f3f4f6; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .col-head { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 0; }
      @page { margin: 20mm 18mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <h1>Progress Report</h1>
      <p class="meta">${name} · Generated ${date}</p>
    </div>
    <div style="font-size:20px;font-weight:800;color:#6366f1;letter-spacing:-.5px">Norskeord</div>
  </div>

  <!-- CEFR estimate -->
  <div class="cefr-box">
    <div>
      <div class="cefr-label">Estimated CEFR Level</div>
      <div class="cefr-level">${stats.cefrLabel}</div>
    </div>
    <div>
      <div class="cefr-detail">${stats.cefrDetail}</div>
    </div>
  </div>

  <!-- Summary -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-value" style="color:#111">${stats.totalSeen}</div>
      <div class="summary-label">Cards seen</div>
    </div>
    <div class="summary-card">
      <div class="summary-value" style="color:#10b981">${stats.totalMemorized}</div>
      <div class="summary-label">Memorized</div>
    </div>
    <div class="summary-card">
      <div class="summary-value" style="color:#ef4444">${stats.totalDue}</div>
      <div class="summary-label">Due for review</div>
    </div>
  </div>

  <!-- Per-level table -->
  <h2>By Level</h2>
  <table>
    <thead>
      <tr>
        <th>Level</th>
        <th>Seen</th>
        <th>Memorized</th>
        <th>Due</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>${levelRows}</tbody>
  </table>

  <!-- Category breakdown -->
  <h2>Category Breakdown</h2>
  <div class="two-col">
    <div>
      <div class="col-head">💪 Strongest</div>
      ${strongestHtml}
    </div>
    <div>
      <div class="col-head">📖 Needs work</div>
      ${needsWorkHtml}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>norskeord.no</span>
    <span>Printed ${date}</span>
  </div>

  <script>window.print();</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
