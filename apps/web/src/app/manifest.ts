import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Needly — What do you need?",
    short_name: "Needly",
    description: "Describe a need. Get an instant, collaborative mini-app.",
    start_url: "/",
    display: "standalone",
    background_color: "#111318",
    theme_color: "#111318",
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
