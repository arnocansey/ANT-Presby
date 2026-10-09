// Fails (exit 1) if any text/background pair in src/styles/tokens.css is below WCAG AA (4.5:1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
let css;
try {
  css = readFileSync(file, 'utf8');
} catch {
  console.error(`Missing ${file}`);
  process.exit(1);
}

const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No "${selector}" block in tokens.css`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((m) => [m[1], [m[2], m[3], m[4]].map(Number)])
  );
};

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [text, background] pairs that carry readable text.
const PAIRS = [
  ['foreground', 'background'],
  ['foreground', 'surface'],
  ['foreground', 'card'],
  ['muted', 'background'],
  ['muted', 'surface'],
  ['muted', 'card'],
  ['primary-foreground', 'primary'],
  ['link', 'background'],
  ['link', 'surface'],
  ['gold-ink', 'gold-soft'],
  ['success', 'background'],
  ['success', 'surface'],
  ['warning', 'background'],
  ['warning', 'surface'],
  ['danger', 'background'],
  ['danger', 'surface'],
  ['danger-solid-foreground', 'danger-solid'],
];

let failures = 0;
for (const [theme, selector] of [['light', ':root'], ['dark', '.dark']]) {
  const tokens = block(selector);
  for (const [text, bg] of PAIRS) {
    if (!tokens[text] || !tokens[bg]) {
      console.error(`${theme}: missing --${!tokens[text] ? text : bg}`);
      failures += 1;
      continue;
    }
    const value = ratio(tokens[text], tokens[bg]);
    if (value < 4.5) {
      console.error(`${theme}: ${text} on ${bg} is ${value.toFixed(2)}:1 (needs 4.5)`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`${failures} contrast problem(s)`);
  process.exit(1);
}
console.log(`All ${PAIRS.length * 2} token pairs meet WCAG AA.`);
