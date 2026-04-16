import { http, HttpResponse } from "msw";

const defaultFamilies = [
  { family: "Inter", category: "sans-serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
];

export const googleFontsHandlers = [
  http.get("https://www.googleapis.com/webfonts/v1/webfonts", () =>
    HttpResponse.json({ items: defaultFamilies }),
  ),
];
