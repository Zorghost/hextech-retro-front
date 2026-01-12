import { Inter, Dela_Gothic_One } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/siteUrl";
import Script from "next/script";

const InterBodyFont = Inter({
  subsets: ["latin"],
  variable: "--body-font",
});

const DeltaHeadingFont = Dela_Gothic_One({
  subsets: ["latin"],
  variable: "--heading-font",
  weight: "400",
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "The Next Game Platform",
    template: "%s | The Next Game Platform",
  },
  description: "Retro gaming platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "The Next Game Platform",
    title: "The Next Game Platform",
    description: "Retro gaming platform.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Next Game Platform",
    description: "Retro gaming platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(() => {\n  try {\n    const stored = localStorage.getItem('theme');\n    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;\n    const isDark = stored ? stored === 'dark' : prefersDark;\n    document.documentElement.classList.toggle('dark', isDark);\n  } catch (e) {\n    // ignore\n  }\n})();`,
          }}
        />
      </head>
      <body
        className={`${InterBodyFont.variable} ${DeltaHeadingFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
