import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "מאמר מוסגר";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori has no bidi support and lays Hebrew out LTR; Hebrew has no
// contextual shaping, so reversing code points renders it correctly.
const rtl = (s: string) => [...s].reverse().join("");

async function loadGoogleFont(family: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`failed to locate ${family} font url`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`failed to fetch ${family} font`);
  return res.arrayBuffer();
}

const PAPER = "#f3e9d2";
const INK = "#171412";

export default async function Image() {
  const title = "מאמר מוסגר";
  const kicker = "חידת הסוגריים היומית";
  const fontText = `${title}${kicker}`;
  const [bold, regular] = await Promise.all([
    loadGoogleFont("Frank+Ruhl+Libre:wght@700", fontText),
    loadGoogleFont("Frank+Ruhl+Libre:wght@400", fontText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "44px 0 52px",
          background: PAPER,
          color: INK,
          fontFamily: "Frank Ruhl Libre",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 400, letterSpacing: 1 }}>{rtl(kicker)}</div>

        {/* Nested brackets with a hidden word inside — the puzzle's mechanic */}
        <svg width="560" height="300" viewBox="0 0 560 300" fill="none" stroke={INK} strokeWidth="18" strokeLinecap="square">
          <path d="M70 20 H20 V280 H70" />
          <path d="M490 20 H540 V280 H490" />
          <path d="M150 60 H115 V240 H150" />
          <path d="M410 60 H445 V240 H410" />
          <g stroke="none" fill={INK}>
            <rect x="195" y="130" width="40" height="40" />
            <rect x="260" y="130" width="40" height="40" />
            <rect x="325" y="130" width="40" height="40" />
          </g>
        </svg>

        <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 1 }}>{rtl(title)}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Frank Ruhl Libre", data: bold, style: "normal", weight: 700 },
        { name: "Frank Ruhl Libre", data: regular, style: "normal", weight: 400 },
      ],
    }
  );
}
