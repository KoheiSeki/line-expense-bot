import { lineClient } from "@/lib/line/client";
import { messagingApi } from "@line/bot-sdk";

export async function handleJoin(replyToken: string, groupId: string) {
	const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?/liff/join?groupId=${groupId}`;

	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: "text",
				text: `参加登録\n${liffUrl}`,
			} satisfies messagingApi.TextMessage,
		],
	});
}
