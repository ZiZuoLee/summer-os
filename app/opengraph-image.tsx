import { ImageResponse } from "next/og";

export const alt = "Summer OS — A calmer system for an ambitious summer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        padding: 72,
        color: "#f2f7f8",
        background:
          "linear-gradient(135deg, #080c10 0%, #101a21 58%, #17152b 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -120,
          width: 620,
          height: 620,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(56,206,229,.34), rgba(56,206,229,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -300,
          left: 280,
          width: 700,
          height: 700,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(141,114,239,.26), rgba(141,114,239,0) 68%)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 58,
              height: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              background:
                "linear-gradient(145deg, #55e4f2, #10aec8 56%, #8d72ef)",
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 800, color: "#071216" }}>
              S
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 750,
              letterSpacing: "-0.04em",
            }}
          >
            Summer OS
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 99,
              padding: "8px 13px",
              fontSize: 13,
              color: "rgba(255,255,255,.55)",
              letterSpacing: ".08em",
            }}
          >
            PUBLIC BETA
          </div>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 76,
              lineHeight: 1.04,
              fontWeight: 720,
              letterSpacing: "-0.055em",
            }}
          >
            A calmer system for an ambitious summer.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 25,
              color: "rgba(242,247,248,.58)",
            }}
          >
            Plans, wellbeing and study — finally moving in one direction.
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
