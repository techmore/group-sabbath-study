#!/usr/bin/env node
/**
 * Extract clean Koine Greek text from Codex Sinaiticus TEI XML
 *
 * Source:
 *   Codex Sinaiticus Project
 *   Official repository: https://github.com/itsee-birmingham/codex-sinaiticus
 *   Transcription file: FINAL_TRANSCRIPTION_version104.xml (version 1.04, 2014)
 *
 * License / Attribution:
 *   The Codex Sinaiticus transcription is made available for non-commercial re-use
 *   provided attribution is given to the original creators.
 *   See: https://github.com/itsee-birmingham/codex-sinaiticus
 *
 * Usage:
 *   node scripts/extract-greek-nt.js JOHN > data/greek/nt/john.json
 *   node scripts/extract-greek-nt.js MATT > data/greek/nt/matthew.json
 *   node scripts/extract-greek-nt.js 1JOHN > data/greek/nt/1john.json
 *
 * This is an initial proof-of-concept extractor.
 * It focuses on getting readable Greek text per verse from the diplomatic transcription.
 */

const fs = require('fs');
const path = require('path');

const XML_PATH = path.join(__dirname, '..', 'FINAL_TRANSCRIPTION_version104.xml');

function extractBook(bookCode) {
  console.error(`Extracting ${bookCode} from Codex Sinaiticus...`);

  const content = fs.readFileSync(XML_PATH, 'utf8');

  // Pattern for verse blocks.
  // We look for exact book code at the end of the id, e.g. -33-MATT or -JOHN
  const verseRegex = new RegExp(
    `id="V-B\\d+K(\\d+)V(\\d+)-[^"]*?-${bookCode}"[^>]*>([\\s\\S]*?)(?=<ab id="V-|</ab>|$)`,
    'gi'
  );

  const result = {};
  let match;

  while ((match = verseRegex.exec(content)) !== null) {
    const chapter = parseInt(match[1], 10);
    const verse = parseInt(match[2], 10);
    let raw = match[3];

    // Very rough text extraction: pull out text content from <w> tags
    // This is a simplified first pass. A better version would walk the DOM.
    let text = raw
      .replace(/<lb[^>]*>/g, ' ')           // line breaks become spaces
      .replace(/<w[^>]*>/g, '')             // open word tags
      .replace(/<\/w>/g, '')                // close word tags
      .replace(/<hi[^>]*>/g, '')            // formatting
      .replace(/<\/hi>/g, '')
      .replace(/<app[^>]*>[\s\S]*?<\/app>/g, '') // drop apparatus for now
      .replace(/<[^>]+>/g, '')              // any remaining tags
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) continue;

    if (!result[chapter]) result[chapter] = {};
    result[chapter][verse] = {
      text: text,
      // translit and meaning left empty for now — to be added during curation
    };
  }

  return result;
}

// Main
if (require.main === module) {
  const book = process.argv[2];
  if (!book) {
    console.error('Usage: node scripts/extract-greek-nt.js <BOOKCODE>');
    console.error('Example book codes: JOHN, MATT, MARK, LUKE, ACTS, ROM, 1COR, 1JOHN, 1PET, 1THESS, etc.');
    process.exit(1);
  }

  const data = extractBook(book.toUpperCase());

  const output = {
    _source: "Codex Sinaiticus (diplomatic transcription)",
    _repository: "https://github.com/itsee-birmingham/codex-sinaiticus",
    _transcription: "FINAL_TRANSCRIPTION_version104.xml (v1.04, 25 March 2014)",
    _project: "Codex Sinaiticus Project",
    _note: "This is extracted text from a 4th-century manuscript. It is diplomatic (not normalized). Transliteration and meaning should be added during curation in data/original-languages.json.",
    _extractedWith: "scripts/extract-greek-nt.js",
    data: data
  };

  console.log(JSON.stringify(output, null, 2));
}
