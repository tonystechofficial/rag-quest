/**
 * A deliberately tiny stemmer (a few Porter step-1 rules): enough to make
 * "batteries", "battery" and "Battery's" share a stem for keyword retrieval.
 */
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith('ies')) {
    w = w.slice(0, -3) + 'i';
  } else if (w.length > 4 && w.endsWith('sses')) {
    w = w.slice(0, -2);
  } else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) {
    w = w.slice(0, -1);
  }
  if (w.length > 3 && w.endsWith('y')) {
    w = w.slice(0, -1) + 'i';
  }
  return w;
}
