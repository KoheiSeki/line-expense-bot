import { lineClient } from "@/lib/line/client";
import { HELP_MESSAGE } from "../consts/messages.consts";

/**
 * ヘルプメッセージを送信するハンドラー
 * @param replyToken リプライトークン
 */
export async function handleHelp(replyToken: string) {
	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: "text",
				text: HELP_MESSAGE,
			},
		],
	});
}
