// ============================================================
//  SITE CONFIGURATION — edit this file to change colours,
//  nav labels, and personal links. No other files need to change.
// ============================================================

const SITE_CONFIG = {

  // ── Personal info ──────────────────────────────────────────
  name:    "Aditi Pathak",
  tagline: "Integrated PhD Student · NCBS Bangalore",
  version: 25,
  email:   "aditipathak@ncbs.res.in",

  // ── Social links ──────────────────────────────────────────
  scholar:  "https://scholar.google.co.in/citations?hl=en&user=CHFBco4AAAAJ&view_op=list_works&gmla=AF9nlQufPjA2Q1bmgZpn7FJKj7zQNUq0NKzPS1_IIOuD68PjsrXTbR5dE57dbQ058OVC2p7eC7bV9k_XZwpfGReo",
  linkedin: "http://linkedin.com/in/aditi-pathak-97923816a/",
  github:   "https://github.com/AdiPat48",

  // ── Colour palette ────────────────────────────────────────
  // Change any hex value here and the whole site updates.
  palette: {
    dark:        "#2d3142",   // deep indigo — navbar, hero bg
    teal:        "#4f5d75",   // steel blue — accents, highlights, links
    cream:       "#bfc0c0",   // silver — borders, mid tones
    lightCream:  "#f0f0f0",   // very light grey — alternating section bg
    white:       "#ffffff",   // pure white — main backgrounds
    textDark:    "#1e2233",   // near-black for headings
    textMid:     "#4a4e5e",   // mid-tone for body copy
    textLight:   "#7a7f95",   // lighter secondary text
    accent:      "#c9a84c",   // warm amber/gold — category badges
  },

  // ── Navigation labels ─────────────────────────────────────
  // Each item: { label, id }  — id must match <section id="..."> in index.html
  nav: [
    { label: "Home",          id: "home" },
    { label: "About",         id: "about" },
    { label: "Research",      id: "research" },
    { label: "Publications",  id: "publications" },
    { label: "Outreach",      id: "outreach" },
    { label: "Community",     id: "community" },
  ],
};
