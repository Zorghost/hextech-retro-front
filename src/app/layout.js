import { Inter, Dela_Gothic_One } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/siteUrl";
import Script from "next/script";
import { Suspense } from "react";
import { GoogleAnalyticsRouteTracker } from "@/components/analytics/google-analytics";

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
  const gaMeasurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.GA_MEASUREMENT_ID ||
    "G-YQXYSJGK8L";

  return (
    <html lang="en">
      <head>
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');
              `.trim()}
            </Script>
          </>
        ) : null}
      </head>
      <body
        className={`${InterBodyFont.variable} ${DeltaHeadingFont.variable} antialiased bg-main`}
      >
        {gaMeasurementId ? (
          <Suspense fallback={null}>
            <GoogleAnalyticsRouteTracker measurementId={gaMeasurementId} />
          </Suspense>
        ) : null}
        {children}
      </body>
    </html>
  );
}
