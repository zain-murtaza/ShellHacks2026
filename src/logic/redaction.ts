import type { SensitiveItem } from '@/types';

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const idRegex = /\b([A-Z]{2,4}[-]?\d{4,8}|ID[-]?\d{4,8}|\d{6,9})\b/g;

const commonNames = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph',
  'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Nancy',
  'Daniel', 'Lisa', 'Matthew', 'Margaret', 'Anthony', 'Sandra', 'Mark', 'Ashley',
  'Donald', 'Kimberly', 'Steven', 'Emily', 'Paul', 'Donna', 'Andrew', 'Michelle',
  'Joshua', 'Carol', 'Kenneth', 'Amanda', 'Kevin', 'Dorothy', 'Brian', 'Melissa',
  'George', 'Deborah', 'Edward', 'Stephanie', 'Ronald', 'Rebecca', 'Timothy',
  'Sharon', 'Jason', 'Laura', 'Jeffrey', 'Cynthia', 'Ryan', 'Kathleen', 'Jacob',
  'Amy', 'Gary', 'Shirley', 'Nicholas', 'Angela', 'Eric', 'Helen', 'Jonathan',
  'Anna', 'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Nicole', 'Scott',
  'Emma', 'Brandon', 'Samantha', 'Benjamin', 'Katherine', 'Samuel', 'Christine',
];

const nameRegex = new RegExp(
  `\\b(?:${commonNames.join('|')})\\b`,
  'g'
);

export function detectSensitive(text: string): SensitiveItem[] {
  const items: SensitiveItem[] = [];
  let id = 0;

  const collect = (
    regex: RegExp,
    type: SensitiveItem['type'],
    label: string
  ) => {
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      const value = match[0];
      items.push({
        id: `item-${id++}`,
        type,
        label,
        value,
        start: match.index,
        end: match.index + value.length,
      });
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
  };

  collect(emailRegex, 'email', 'Email address');
  collect(phoneRegex, 'phone', 'Phone number');
  collect(idRegex, 'id', 'ID-like string');
  collect(nameRegex, 'name', 'Possible personal name');

  return items.sort((a, b) => a.start - b.start);
}

export function redactText(
  text: string,
  items: SensitiveItem[]
): { redacted: string; count: number } {
  if (items.length === 0) return { redacted: text, count: 0 };

  const sorted = [...items].sort((a, b) => b.start - a.start);
  let result = text;
  let count = 0;

  for (const item of sorted) {
    const placeholder = `[${item.label.toUpperCase()}]`;
    result = result.slice(0, item.start) + placeholder + result.slice(item.end);
    count++;
  }

  return { redacted: result, count };
}

export function highlightText(
  text: string,
  items: SensitiveItem[]
): { segments: { text: string; type: SensitiveItem['type'] | 'plain' }[] } {
  if (items.length === 0) {
    return { segments: [{ text, type: 'plain' }] };
  }

  const sorted = [...items].sort((a, b) => a.start - b.start);
  const segments: { text: string; type: SensitiveItem['type'] | 'plain' }[] = [];
  let cursor = 0;

  for (const item of sorted) {
    if (item.start > cursor) {
      segments.push({ text: text.slice(cursor, item.start), type: 'plain' });
    }
    segments.push({ text: text.slice(item.start, item.end), type: item.type });
    cursor = item.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), type: 'plain' });
  }

  return { segments };
}
