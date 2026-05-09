import { messagingApi, webhook } from "@line/bot-sdk";
import { handleRegister } from "./register.handler";
import { handleJoin } from "./join.handler";
import { handleDisplay } from "./display.handler";
import { handleHelp } from "./help.handler";
import { handleClose } from "./close.handler";
import { handleReopen } from "./reopen.handler";
import { lineClient } from "@/lib/line/client";
import { ApiError } from "@/lib/api/error";

/**
 * メッセージイベントを処理するハンドラー
 * @param event メッセージイベント
 */
export async function handleMessage(event: webhook.MessageEvent) {
	if (event.source?.type !== "group") return;

	const message = event.message as webhook.TextMessageContent;
	if (message.type !== "text") return;

	const text = message.text.trim();
	const groupId = event.source.groupId;
	const replyToken = event.replyToken!;

	try {
		switch (text) {
			case "参加":
				await handleJoin(replyToken, groupId);
				break;
			case "登録":
				await handleRegister(replyToken, groupId);
				break;
			case "表示":
				await handleDisplay(replyToken, groupId);
				break;
			case "完了":
				await handleClose(replyToken, groupId);
				break;
			case "締め解除":
				await handleReopen(replyToken, groupId);
				break;
			case "ヘルプ":
				await handleHelp(replyToken);
				break;
			default:
		}
	} catch (err) {
		console.error("[Error] Failed to handle message", err);

		const errorMessage =
			err instanceof ApiError
				? err.message
				: "エラーが発生しました。時間をおいて再度お試しください。";

		await lineClient.replyMessage({
			replyToken,
			messages: [
				{
					type: "text",
					text: errorMessage,
				} satisfies messagingApi.TextMessage,
			],
		});
	}
}
