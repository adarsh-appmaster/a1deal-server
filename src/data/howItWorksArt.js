// Self-contained on-brand SVG illustrations for the "How A1 Deal Works" step
// cards — avoids external stock-photo URLs (which can 404/break) and keeps
// the visuals in the exact purple/pink A1 Deal palette.

const PURPLE_BG = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6236ff"/>
      <stop offset="100%" stop-color="#451886"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <circle cx="370" cy="20" r="60" fill="#ffffff" opacity="0.06"/>
  <circle cx="20" cy="290" r="90" fill="#ffffff" opacity="0.06"/>
`;

function svgUri(inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${PURPLE_BG}${inner}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ── Step 1: Create Your Account ──────────────────────────────────────────────
const createAccountA = svgUri(`
  <circle cx="200" cy="130" r="55" fill="#ffffff" opacity="0.15"/>
  <circle cx="200" cy="112" r="26" fill="#ffffff"/>
  <path d="M150 190 q50 -40 100 0 v10 q-50 30 -100 0 z" fill="#ffffff"/>
  <circle cx="255" cy="170" r="20" fill="#d6198f"/>
  <path d="M255 162 v16 M247 170 h16" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
`);

const createAccountB = svgUri(`
  <rect x="90" y="70" width="220" height="170" rx="16" fill="#ffffff"/>
  <rect x="115" y="100" width="170" height="14" rx="7" fill="#e3dbff"/>
  <rect x="115" y="130" width="170" height="14" rx="7" fill="#e3dbff"/>
  <rect x="115" y="160" width="170" height="14" rx="7" fill="#e3dbff"/>
  <rect x="115" y="195" width="170" height="30" rx="15" fill="#d6198f"/>
  <text x="200" y="216" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">SIGN UP</text>
`);

// ── Step 2: Discover Opportunities ───────────────────────────────────────────
const discoverA = svgUri(`
  <path d="M140 190 v-70 l60 -40 l60 40 v70 z" fill="#ffffff" opacity="0.85"/>
  <rect x="185" y="150" width="30" height="40" fill="#451886"/>
  <circle cx="255" cy="150" r="38" fill="none" stroke="#ffffff" stroke-width="10"/>
  <line x1="282" y1="177" x2="315" y2="210" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
`);

const discoverB = svgUri(`
  <rect x="95" y="80" width="95" height="70" rx="10" fill="#ffffff" opacity="0.9"/>
  <rect x="210" y="80" width="95" height="70" rx="10" fill="#ffffff" opacity="0.55"/>
  <rect x="95" y="165" width="95" height="70" rx="10" fill="#ffffff" opacity="0.55"/>
  <rect x="205" y="160" width="105" height="80" rx="12" fill="#ffffff"/>
  <circle cx="290" cy="172" r="8" fill="#d6198f"/>
`);

// ── Step 3: Close the Deal ───────────────────────────────────────────────────
const closeDealA = svgUri(`
  <rect x="95" y="140" width="90" height="26" rx="13" fill="#ffffff" transform="rotate(-8 140 153)"/>
  <rect x="215" y="140" width="90" height="26" rx="13" fill="#ffffff" transform="rotate(8 260 153)"/>
  <circle cx="200" cy="153" r="26" fill="#ffffff"/>
  <circle cx="200" cy="153" r="26" fill="#d6198f" opacity="0.85"/>
  <path d="M188 153 l8 8 l16 -18" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
`);

const closeDealB = svgUri(`
  <rect x="120" y="65" width="160" height="190" rx="10" fill="#ffffff"/>
  <rect x="140" y="90" width="120" height="10" rx="5" fill="#e3dbff"/>
  <rect x="140" y="112" width="120" height="10" rx="5" fill="#e3dbff"/>
  <rect x="140" y="134" width="80" height="10" rx="5" fill="#e3dbff"/>
  <circle cx="255" cy="205" r="34" fill="#d6198f"/>
  <path d="M240 205 l10 10 l20 -22" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
`);

export const HOW_IT_WORKS_ART = {
  createAccount: [createAccountA, createAccountB],
  discover:      [discoverA, discoverB],
  closeDeal:     [closeDealA, closeDealB],
};
