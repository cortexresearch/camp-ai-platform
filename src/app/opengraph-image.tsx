import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function OpengraphImage() {
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
          position: "relative",
          backgroundColor: "#05070b",
          backgroundImage:
            "radial-gradient(circle at 78% 0%, rgba(255,122,26,0.32), transparent 60%), radial-gradient(circle at 6% 6%, rgba(22,188,216,0.24), transparent 55%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(140,170,210,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(140,170,210,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 128 }}>🏕️</div>
          <div style={{ display: "flex", fontSize: 148, fontWeight: 700, color: "#f2f5f9", letterSpacing: -4 }}>
            AI
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 40, fontWeight: 600, color: "#f2f5f9" }}>
          Build with AI. Ship in 30 minutes.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#ff9036",
          }}
        >
          Compete all season
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#5d6879",
          }}
        >
          campai.cortexresearch.group
        </div>
      </div>
    ),
    { ...size }
  );
}
