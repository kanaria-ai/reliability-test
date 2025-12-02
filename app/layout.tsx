import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reliability Test",
  description: "S3 버킷의 이미지 및 JSON 파일을 실시간으로 조회하는 뷰어",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
