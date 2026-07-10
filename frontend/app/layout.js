import "./globals.css";

export const metadata = {
  title: "Drop-CI/CD",
  description: "A mini CI/CD dashboard that builds projects inside Docker containers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
