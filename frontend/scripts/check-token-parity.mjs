// Fails (exit 1) if the app palette (mobile/src/constants/tokens.ts) differs from the web tokens.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
const css = read('../src/styles/tokens.css');
const ts = read('../../mobile/src/constants/tokens.ts');

const cssBlock = (selector) => {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((m) => [
      m[1],
      `#${[m[2], m[3], m[4]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`.toUpperCase(),
    ])
  );
};
const tsBlock = (scheme) => {
  const start = ts.indexOf(`${scheme}: {`);
  const body = ts.slice(start, ts.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2].toUpperCase()]));
};

// app key -> web token
const MAP = {
  background: 'background',
  surface: 'surface',
  card: 'card',
  border: 'border',
  input: 'input',
  text: 'foreground',
  muted: 'muted',
  primary: 'primary',
  primaryHover: 'primary-hover',
  onPrimary: 'primary-foreground',
  link: 'link',
  gold: 'gold',
  goldSoft: 'gold-soft',
  goldInk: 'gold-ink',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  dangerSolid: 'danger-solid',
  onDangerSolid: 'danger-solid-foreground',
};

let problems = 0;
for (const [scheme, selector] of [['light', ':root'], ['dark', '.dark']]) {
  const web = cssBlock(selector);
  const app = tsBlock(scheme);
  for (const [appKey, webKey] of Object.entries(MAP)) {
    if (web[webKey] !== app[appKey]) {
      console.error(`${scheme}: app ${appKey}=${app[appKey]} but web --${webKey}=${web[webKey]}`);
      problems += 1;
    }
  }
}
if (problems > 0) {
  console.error(`${problems} token mismatch(es)`);
  process.exit(1);
}
console.log(`Web and app palettes match (${Object.keys(MAP).length * 2} values).`);
