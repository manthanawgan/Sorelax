/** Mirrors CLI `_extract_keyword` in cli/main.py and agent/api.py */
export function extractKeyword(question: string): string {
  const stop = new Set([
    'a', 'an', 'the', 'is', 'are', 'what', 'where', 'when', 'who',
    'how', 'why', 'about', 'for', 'in', 'on', 'at', 'to', 'of',
    'and', 'or', 'with', 'from', 'tell', 'me', 'show', 'find',
  ]);

  const words = question.toLowerCase().match(/[a-zA-Z0-9_-]+/g) ?? [];
  const meaningful = words.filter((word) => !stop.has(word) && word.length > 2);

  if (meaningful.length > 0) {
    return meaningful[0];
  }

  return words.length > 0 ? words[words.length - 1] : 'project';
}
