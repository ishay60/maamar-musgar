import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "מאמר מוסגר — Bracket City Hebrew";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(family: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`failed to locate ${family} font url`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`failed to fetch ${family} font`);
  return res.arrayBuffer();
}

export default async function Image() {
  const title = "מאמר מוסגר";
  const subtitle = "חידת הסוגריים היומית";
  const fontText = `${title}${subtitle}`;
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
          justifyContent: "center",
          background: "#f5f5f5",
          color: "#171412",
          fontFamily: "Frank Ruhl Libre",
        }}
      >
        <div style={{ fontSize: 240, lineHeight: 1 }}>📜</div>
        <div style={{ fontSize: 110, fontWeight: 700, marginTop: 32 }}>{title}</div>
        <div style={{ fontSize: 48, color: "#6b6356", marginTop: 16 }}>{subtitle}</div>
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
