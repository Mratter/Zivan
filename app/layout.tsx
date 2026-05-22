import type { Metadata } from "next";
import "./globals.css";
import { ZivanProvider } from "@/components/zivan-provider";

export const metadata: Metadata = {
  title: "Zivan",
  description: "A dark community platform for focused discussions.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <ZivanProvider>{children}</ZivanProvider>
      </body>
    </html>
  );
}
