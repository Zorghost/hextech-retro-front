export const metadata = {
  title: "TheNextGameStation",
  description: "TheNextGameStation - Admin",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const dynamic = "force-dynamic";

export default function MainLayout({ children }) {
  return <div>{children}</div>;
}
