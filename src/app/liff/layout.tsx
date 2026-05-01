import { LiffProvider } from "@/shared/components/liff-provider";

type LiffLayoutProps = {
    children: React.ReactNode;
}

export default function LiffLayout({children}: LiffLayoutProps) {
    return (
        <LiffProvider>
            {children}
        </LiffProvider>
    )
}