export const metadata = {
  title: "TheNextGameStation",
  description: "Retro Hextech admin dashboard for managing games, uploads, categories, and publishing settings from a protected control panel.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function MainLayout({ children }) {
  return <div>{children}</div>;
}
