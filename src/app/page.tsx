"use client";

import liff from "@line/liff";
import { useEffect } from "react";

export default function Home() {
	useEffect(() => {
		liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
	});

	return <p>読み込み中...</p>;
}
