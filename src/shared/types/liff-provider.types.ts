import liff from "@line/liff";

/** LIFFコンテキスト */
export type LiffContext = {
    liff: typeof liff | null;
    isReady: boolean;
}