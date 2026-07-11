import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Summer OS — 夏日个人系统",
    short_name: "Summer OS",
    description: "把生活、健康与备考放进一个清晰、可持续的个人系统。",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#090d11",
    theme_color: "#090d11",
    lang: "zh-CN",
    categories: ["productivity", "health", "education", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "今日",
        short_name: "今日",
        description: "查看今日计划",
        url: "/today",
      },
      {
        name: "快速打卡",
        short_name: "打卡",
        description: "记录今天的状态",
        url: "/check-in",
      },
      {
        name: "数据趋势",
        short_name: "数据",
        description: "查看个人趋势",
        url: "/analytics",
      },
    ],
  };
}
