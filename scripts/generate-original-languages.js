#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const OUTPUT_PATH = path.join(ROOT, 'data', 'original-languages.json');

function extractStudyConfig(html) {
  const needle = 'const STUDY_CONFIG = ';
  const start = html.indexOf(needle);
  if (start < 0) throw new Error('Could not find STUDY_CONFIG');
  const braceStart = html.indexOf('{', start);
  if (braceStart < 0) throw new Error('Could not find STUDY_CONFIG object start');

  let depth = 0;
  let i = braceStart;
  let inString = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (; i < html.length; i++) {
    const ch = html[i];
    const next = html[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        return html.slice(braceStart, i + 1);
      }
    }
  }

  throw new Error('Could not locate end of STUDY_CONFIG object');
}

function normalizeRef(ref) {
  return String(ref || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[._,;]+/g, ' ')
    .replace(/[^A-Za-z0-9 :\-]/g, '')
    .toLowerCase()
    .trim();
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<i[^>]*>[\s\S]*?<\/i>/gi, '')
    .replace(/<small[^>]*>[\s\S]*?<\/small>/gi, '')
    .replace(/<big[^>]*>[\s\S]*?<\/big>/gi, '')
    .replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function joinSegmentText(segment) {
  if (typeof segment === 'string') return stripHtml(segment);
  if (Array.isArray(segment)) return segment.map(joinSegmentText).filter(Boolean).join('\n');
  if (segment && typeof segment === 'object') {
    if (typeof segment.he === 'string') return stripHtml(segment.he);
    if (Array.isArray(segment.he)) return segment.he.map(joinSegmentText).filter(Boolean).join('\n');
    if (typeof segment.text === 'string') return stripHtml(segment.text);
    if (Array.isArray(segment.text)) return segment.text.map(joinSegmentText).filter(Boolean).join('\n');
  }
  return '';
}

function getBookKey(ref) {
  const r = String(ref || '').trim();
  const m = r.match(/^((?:\d+\s+)?[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\b/);
  return m ? m[1].trim() : r;
}

function isNtRef(ref) {
  const book = getBookKey(ref).toLowerCase();
  return [
    'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1 corinthians', '2 corinthians',
    'galatians', 'ephesians', 'philippians', 'colossians', '1 thessalonians', '2 thessalonians',
    '1 timothy', '2 timothy', 'titus', 'philemon', 'hebrews', 'james', '1 peter', '2 peter',
    '1 john', '2 john', '3 john', 'jude', 'revelation'
  ].includes(book);
}

function isAramaicWeekReading(ref) {
  const normalized = normalizeRef(ref);
  return normalized.startsWith('ezra 4') || normalized.startsWith('daniel');
}

function toSefariaRef(readingRef) {
  const cleaned = String(readingRef || '').replace(/\s*\(.*?\)\s*/g, '').trim();

  if (cleaned.includes(',')) {
    throw new Error(`Composite ref should be expanded first: ${readingRef}`);
  }

  let ref = cleaned.replace(/\s+/g, '.');
  ref = ref.replace(/^1\./, '1_').replace(/^2\./, '2_').replace(/^3\./, '3_');
  ref = ref.replace(/\.([IVX]+)\./g, '.$1.');
  return ref;
}

function expandCompositeReading(ref) {
  const cleaned = String(ref || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  if (cleaned.includes(',')) {
    const m = cleaned.match(/^([1-3]?\s*[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s+(.+)$/);
    if (m) {
      const book = m[1].replace(/\s+/g, ' ').trim();
      return m[2].split(',').map(part => `${book} ${part.trim()}`.replace(/\s+/g, ' '));
    }
  }
  return [cleaned];
}

async function fetchSefariaReading(readingRef) {
  const ref = toSefariaRef(readingRef);
  const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&pad=0&lang=he`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sefaria error ${res.status} for ${readingRef}`);
  const json = await res.json();

  const passages = [];
  const pieces = Array.isArray(json.he) ? json.he : [json.he];
  pieces.forEach(piece => {
    const text = joinSegmentText(piece);
    if (text) passages.push(text);
  });

  return passages.join('\n\n');
}

function originsCodeForRef(ref) {
  const book = getBookKey(ref).toLowerCase();
  const codeMap = {
    genesis: 'GEN', exodus: 'EXO', leviticus: 'LEV', numbers: 'NUM', deuteronomy: 'DEU',
    joshua: 'JOS', judges: 'JDG', ruth: 'RUT', '1 samuel': '1SA', '2 samuel': '2SA',
    '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
    ezra: 'EZR', nehemiah: 'NEH', esther: 'EST', job: 'JOB', psalm: 'PSA', proverbs: 'PRO',
    ecclesiastes: 'ECC', 'song of solomon': 'SNG', isaiah: 'ISA', jeremiah: 'JER',
    lamentations: 'LAM', ezekiel: 'EZK', daniel: 'DAN', hosea: 'HOS', joel: 'JOL',
    amos: 'AMO', obadiah: 'OBA', jonah: 'JON', micah: 'MIC', nahum: 'NAM', habakkuk: 'HAB',
    zephaniah: 'ZEP', haggai: 'HAG', zechariah: 'ZEC', malachi: 'MAL',
    matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT',
    romans: 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO', galatians: 'GAL',
    ephesians: 'EPH', philippians: 'PHP', colossians: 'COL', '1 thessalonians': '1TH',
    '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI', titus: 'TIT',
    philemon: 'PHM', hebrews: 'HEB', james: 'JAS', '1 peter': '1PE', '2 peter': '2PE',
    '1 john': '1JN', '2 john': '2JN', '3 john': '3JN', jude: 'JUD', revelation: 'REV'
  };
  return codeMap[book];
}

function parseChapterVerse(ref) {
  const cleaned = String(ref || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  const m = cleaned.match(/^(.+?)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/);
  if (!m) {
    const m2 = cleaned.match(/^(.+?)\s+(\d+)(?:-(\d+))?$/);
    if (!m2) return null;
    return { book: m2[1].trim(), chapter: Number(m2[2]), startVerse: null, endVerse: m2[3] ? Number(m2[3]) : null };
  }
  return {
    book: m[1].trim(),
    chapter: Number(m[2]),
    startVerse: m[3] ? Number(m[3]) : null,
    endVerse: m[4] ? Number(m[4]) : null,
  };
}

async function fetchOriginsVerse(code, chapter, verse) {
  const url = `https://bible-tr.originsapi.com/${code}.${chapter}.${verse}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OriginsAPI error ${res.status} for ${code}.${chapter}.${verse}`);
  return res.json();
}

async function fetchGreekReading(readingRef) {
  const bookCode = originsCodeForRef(readingRef);
  if (!bookCode) throw new Error(`No OriginsAPI code for ${readingRef}`);
  const parsed = parseChapterVerse(readingRef);
  if (!parsed) throw new Error(`Cannot parse NT ref: ${readingRef}`);

  const startVerse = parsed.startVerse || 1;
  const endVerse = parsed.endVerse;
  let chapter = parsed.chapter;
  let verse = startVerse;
  const parts = [];

  while (true) {
    const data = await fetchOriginsVerse(bookCode, chapter, verse);
    parts.push(stripHtml(data.text));

    if (endVerse && chapter === parsed.chapter && verse >= endVerse) break;
    if (!endVerse && data.next && data.next.startsWith(`${bookCode}.${chapter}.`) ) {
      const nextVerse = Number(data.next.split('.').pop());
      verse = nextVerse;
      continue;
    }
    if (endVerse && data.next) {
      const nextParts = data.next.split('.');
      const nextChapter = Number(nextParts[1]);
      const nextVerse = Number(nextParts[2]);
      if (nextChapter > parsed.chapter) break;
      if (nextChapter === parsed.chapter && nextVerse > endVerse) break;
      chapter = nextChapter;
      verse = nextVerse;
      continue;
    }
    break;
  }

  return parts.join('\n');
}

function detectLanguage(ref) {
  const book = getBookKey(ref).toLowerCase();
  if (isNtRef(ref)) return 'Greek';
  if (isAramaicWeekReading(ref)) return 'Aramaic';
  return 'Hebrew';
}

async function main() {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const objText = extractStudyConfig(html);
  const config = Function(`return (${objText})`)();

  const output = {
    _comment: "Source of truth for full original-language biblical text used in the 'Full Original Text' toggle. The app loads this at runtime. Curated passages are generated per weekly reading.",
    _sources: {
      hebrew: {
        description: 'Hebrew text drawn from the Masoretic Text via Sefaria API',
        url: 'https://www.sefaria.org',
        license: 'Various (see individual editions on Sefaria)',
      },
      aramaic: {
        description: 'Aramaic text drawn from Sefaria API',
        url: 'https://www.sefaria.org',
        license: 'Various (see individual editions on Sefaria)',
      },
      greek: {
        description: 'Koine Greek text derived from OriginsAPI public-domain Textus Receptus source',
        repository: 'https://originsapi.com/',
        translation: 'TR',
        note: 'Public-domain Greek source text served as static JSON.',
      },
    },
  };

  for (const week of config.weeks) {
    const entries = [];
    const readings = week.readings || [];
    for (const reading of readings) {
      const expanded = expandCompositeReading(reading.ref);
      const collected = [];
      for (const part of expanded) {
        if (isNtRef(part)) {
          const text = await fetchGreekReading(part);
          collected.push(text);
        } else {
          const text = await fetchSefariaReading(part);
          collected.push(text);
        }
      }
      entries.push({
        ref: reading.ref,
        language: detectLanguage(reading.ref),
        text: collected.join('\n\n'),
        translit: '',
        meaning: '',
      });
    }
    output[String(week.id)] = entries;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
