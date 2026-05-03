import liff from "@line/liff";
import type { Profile } from "@liff/get-profile";

/** LIFFコンテキスト */
export type LiffContext = {
	liff: typeof liff | null;
	isReady: boolean;
	profile: Profile | null;
};
