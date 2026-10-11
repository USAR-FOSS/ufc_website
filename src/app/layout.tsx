import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, Fraunces, Pixelify_Sans, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/app/providers";
import { REVEAL_SCRIPT } from "@/components/home/reveal-script";
import { SITE, jsonLd } from "@/data/site";

// Landing-page type system: a chunky grotesque for display, a wonky soft serif for emphasis, a warm sans for reading, a quirky mono for labels.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic"], // only ever used in italic (the .serif class), so the upright file is never shipped
  axes: ["SOFT", "WONK", "opsz"],
});

const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
  axes: ["opsz"],
});

const spaceMono = Space_Mono({
  variable: "--font-spacemono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Caveat is kept in the repository rather than fetched from Google at build time. One build on Vercel got an answer for it that the font
// loader could not read, which failed the whole deployment, and a file we hold ourselves cannot do that. It is the latin subset of the
// variable font (weights 400 to 700), which is the part of it the site uses.
const caveat = localFont({
  src: "./fonts/caveat-latin.woff2",
  variable: "--font-hand",
  weight: "400 700",
  display: "swap",
  adjustFontFallback: "Arial",
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["500", "700"],
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
        className={`${bricolage.variable} ${fraunces.variable} ${dmSans.variable} ${spaceMono.variable} ${caveat.variable} ${pixelify.variable} antialiased`}
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
