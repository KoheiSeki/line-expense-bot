import type { Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
	width:
		"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
	initialScale: 1,
	maximumScale: 1, // iOSでinput focus時の自動ズームを防止
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="w-full h-full antialiased">
			<body className="min-h-full flex flex-col bg-zinc-50">{children}</body>
		</html>
	);
}
