import type { Metadata } from "next";
import "./globals.css";
import GlobalAtmosphere from "./components/GlobalAtmosphere";
import VinylPlayer from "./components/VinylPlayer";

export const metadata: Metadata = {
  title: "Room 1913",
  description: "A midnight study, a quiet conversation across time."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        <GlobalAtmosphere />
        <div className="app-shell">{children}</div>
        <VinylPlayer />
      </body>
    </html>
  );
}
