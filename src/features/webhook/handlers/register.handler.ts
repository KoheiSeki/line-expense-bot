import { lineClient } from "@/lib/line/client";
import { messagingApi } from "@line/bot-sdk";

/**
 * 登録コマンドのハンドラー
 * @param replyToken リプライトークン
 * @param groupId グループID
 */
export async function handleRegister(replyToken: string, groupId: string) {
    const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?groupId=${groupId}`;

    await lineClient.replyMessage({replyToken, messages: [{
        type: "text",
        text: `支出を入力してください👇\n${liffUrl}`,
    } satisfies messagingApi.TextMessage,]}) 
}