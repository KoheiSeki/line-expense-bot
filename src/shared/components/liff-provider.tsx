"use client";

import liff from "@line/liff";
import { createContext, useContext, useEffect, useState } from "react";
import type { LiffContext } from "../types/liff-provider.types";
import type { Profile } from "@liff/get-profile";

const LiffContext = createContext<LiffContext>({
	liff: null,
	isReady: false,
	profile: null,
});

type LiffProviderProps = {
	children: React.ReactNode;
};

export const LiffProvider = ({ children }: LiffProviderProps) => {
	const [isReady, setIsReady] = useState<boolean>(false);
	const [profile, setProfile] = useState<Profile | null>(null);

	useEffect(() => {
		liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(async () => {
			if (!liff.isLoggedIn()) {
				liff.login();
				return;
			}
			const profile = await liff.getProfile();
			setProfile(profile);
			setIsReady(true);
		});
	}, []);

	return (
		<LiffContext.Provider
			value={{ liff: isReady ? liff : null, isReady, profile }}
		>
			{children}
		</LiffContext.Provider>
	);
};

export const useLiff = () => useContext(LiffContext);
