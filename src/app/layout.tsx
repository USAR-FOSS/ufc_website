import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/app/providers";
import { REVEAL_SCRIPT } from "@/components/home/reveal-script";
import { SITE, jsonLd } from "@/data/site";

// Landing-page type system: a chunky grotesque for display, a wonky soft serif for emphasis, a warm sans for reading, a quirky mono for labels.
//
// Every font is a file in this repository (src/app/fonts) rather than something fetched from Google while the site is built. A build on
// Vercel was twice handed an answer for one of them that the font loader could not read (a different font each time), and that failed the whole
// deployment. A file we hold cannot do that. They are the exact files `next/font/google` used to serve: the latin subset, which is the only
// part of each font the site's text uses. Characters outside it (arrows, box drawing, Devanagari) were never in any Google subset either, and
// fall back to the system fonts exactly as before.
const bricolage = localFont({
  src: [{ path: "./fonts/bricolage-grotesque-latin.woff2", weight: "200 800", style: "normal" }],
  variable: "--font-bricolage",
  display: "swap",
  adjustFontFallback: "Arial",
});

// Only ever used in italic (the .serif class), so the upright file was never shipped and still is not.
const fraunces = localFont({
  src: [{ path: "./fonts/fraunces-italic-latin.woff2", weight: "100 900", style: "italic" }],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const dmSans = localFont({
  src: [{ path: "./fonts/dm-sans-latin.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-dmsans",
  display: "swap",
  adjustFontFallback: "Arial",
});

const spaceMono = localFont({
  src: [
    { path: "./fonts/space-mono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/space-mono-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-spacemono",
  display: "swap",
  adjustFontFallback: "Arial",
});

// The latin subset of the variable font (weights 400 to 700).
const caveat = localFont({
  src: [{ path: "./fonts/caveat-latin.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-hand",
  display: "swap",
  adjustFontFallback: "Arial",
});

// A variable font too (weights 400 to 700); the site uses 500 and 700.
const pixelify = localFont({
  src: [{ path: "./fonts/pixelify-sans-latin.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-pixel",
  display: "swap",
  adjustFontFallback: "Arial",
});

// The Cyrillic part of Pixelify Sans. The one character the site takes from it is № (on the ticket sticker). A font file here has no
// unicode-range of its own, so it is a font of its own, placed behind the latin one in the --f-pixel stack (see home.css).
const pixelifyCyrillic = localFont({
  src: [{ path: "./fonts/pixelify-sans-cyrillic.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-pixel-cyrillic",
  display: "swap",
  adjustFontFallback: false,
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "UFC, the USAR FOSS Club | Open Source at GGSIPU, Delhi",
    template: "%s | UFC",
  },
  description: SITE.description,
  applicationName: SITE.name,
  appleWebApp: { title: SITE.name, capable: true },
  keywords: [
    "USAR FOSS Club",
    "UFC",
    "FOSS club",
    "open source club",
    "GGSIPU",
    "IPU Delhi",
    "University School of Automation and Robotics",
    "student developer community",
    "open source for beginners",
    "FOSS United",
  ],
  authors: [{ name: "UFC", url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: "/",
    title: "UFC, the USAR FOSS Club: Open Source, Open Minds",
    description: SITE.description,
    siteName: SITE.name,
    images: [SITE.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "UFC, the USAR FOSS Club: Open Source, Open Minds",
    description: SITE.description,
    images: [SITE.ogImage.url],
    creator: "@ufc_tech",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/ufc-logo.svg", type: "image/svg+xml" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = { themeColor: "#090c0a", colorScheme: "dark light" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Who we are, and what this site is. Home page and every other page share it, so search engines learn the name once.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        alternateName: [...SITE.alternateNames, "IPU FOSS Club"],
        description: SITE.description,
        url: SITE.url,
        logo: { "@type": "ImageObject", url: `${SITE.url}/brand/icon-512.png`, width: 512, height: 512 },
        image: `${SITE.url}${SITE.ogImage.url}`,
        slogan: "Open Source, Open Minds.",
        foundingDate: "2025-08-09",
        areaServed: "Delhi, India",
        parentOrganization: {
          "@type": "CollegeOrUniversity",
          name: "University School of Automation and Robotics, Guru Gobind Singh Indraprastha University",
        },
        sameAs: SITE.sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        alternateName: SITE.alternateNames,
        description: SITE.description,
        inLanguage: "en-IN",
        publisher: { "@id": `${SITE.url}/#organization` },
      },
    ],
  };

  return (
    <html lang="en-IN">
      <head>
        <noscript>
          <style>{`[data-reveal="r"]{opacity:1!important;transform:none!important}[data-reveal="m"]>.mask-line{transform:none!important}`}</style>
        </noscript>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />
      </head>
      <body
        className={`${bricolage.variable} ${fraunces.variable} ${dmSans.variable} ${spaceMono.variable} ${caveat.variable} ${pixelify.variable} ${pixelifyCyrillic.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
        {/* Page views for the Vercel dashboard. It only reports from a Vercel deployment, so it does nothing locally. */}
        <Analytics />
        {/* Real visitors' load times (the Core Web Vitals), in the same dashboard. Also does nothing outside Vercel. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
