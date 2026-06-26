import type { Card } from './types';

export interface CsvRow {
  front: string;
  back: string;
}

function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function cardsToCsv(cards: Card[]): string {
  const rows = ['Front,Back'];
  for (const card of cards) {
    const front = escapeField(card.frontText ?? '');
    const back = escapeField(card.backText ?? '');
    rows.push(`${front},${back}`);
  }
  return rows.join('\r\n');
}

// Minimal RFC-4180 parser. Handles quoted fields with embedded commas,
// quotes (escaped as ""), and newlines. Returns one entry per record using
// the first two columns as front/back; extra columns are ignored.
function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    record.push(field);
    field = '';
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ',') {
      pushField();
      i++;
      continue;
    }
    if (char === '\r') {
      // Treat \r, \n, and \r\n as a single record separator.
      pushRecord();
      i += text[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    if (char === '\n') {
      pushRecord();
      i++;
      continue;
    }
    field += char;
    i++;
  }

  // Flush the final field/record if there's trailing content.
  if (field !== '' || record.length > 0) {
    pushRecord();
  }

  return records;
}

export function parseCsv(text: string): CsvRow[] {
  const records = parseRecords(text);
  const rows: CsvRow[] = [];

  records.forEach((record, index) => {
    const front = (record[0] ?? '').trim();
    const back = (record[1] ?? '').trim();

    // Skip a leading header row like "Front,Back".
    if (index === 0 && front.toLowerCase() === 'front') return;
    // Drop fully empty rows (e.g. trailing newline).
    if (!front && !back) return;

    rows.push({ front, back });
  });

  return rows;
}
