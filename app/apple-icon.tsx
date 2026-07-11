import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1116",
      }}
    >
      <div
        style={{
          width: 148,
          height: 148,
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 48,
          background:
            "linear-gradient(145deg, #55e4f2 0%, #12afc8 54%, #8d72ef 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 31,
            right: 32,
            width: 13,
            height: 13,
            borderRadius: 99,
            background: "#ddfbff",
          }}
        />
        <div
          style={{
            width: 84,
            height: 31,
            borderRadius: "32px 32px 8px 32px",
            background: "white",
            transform: "translateY(-19px) skewX(-17deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 86,
            height: 32,
            borderRadius: "8px 32px 32px 32px",
            background: "#071216",
            transform: "translateY(22px) skewX(17deg)",
          }}
        />
      </div>
    </div>,
    size,
  );
}
