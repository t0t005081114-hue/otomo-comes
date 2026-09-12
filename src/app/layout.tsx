import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTOMO COMES",
  description: "AI上司が正しく判断できる状態を作るマネジメントOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
