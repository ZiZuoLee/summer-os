import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #090d11 0%, #111b22 100%)",
      }}
    >
      <div
        style={{
          width: 404,
          height: 404,
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 128,
          background:
            "linear-gradient(145deg, #55e4f2 0%, #12afc8 54%, #8d72ef 100%)",
          boxShadow: "0 28px 80px rgba(0,0,0,.38)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 86,
            right: 89,
            width: 38,
            height: 38,
            borderRadius: 99,
            background: "#ddfbff",
          }}
        />
        <div
          style={{
            width: 245,
            height: 170,
            display: "flex",
            flexDirection: "column",
            transform: "rotate(-5deg)",
          }}
        >
          <div
            style={{
              width: 220,
              height: 68,
              marginLeft: 12,
              borderRadius: "70px 70px 20px 70px",
              background: "rgba(255,255,255,.96)",
              transform: "skewX(-17deg)",
            }}
          />
          <div
            style={{
              width: 224,
              height: 70,
              marginTop: 18,
              marginLeft: 12,
              borderRadius: "20px 70px 70px 70px",
              background: "#071216",
              transform: "skewX(17deg)",
            }}
          />
        </div>
      </div>
    </div>,
    size,
  );
}
