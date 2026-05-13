import { messagingApi, webhook } from "@line/bot-sdk";
import { handleRegister } from "./register.handler";
import { handleJoin } from "./join.handler";
import { handleDisplay } from "./display.handler";
import { handleHelp } from "./help.handler";
import { handleClose } from "./close.handler";
import { handleReopen } from "./reopen.handler";
import { lineClient } from "@/lib/line/client";
import { ApiError } from "@/lib/api/error";
import {
	handleCompleteAllSettlements,
	handleCompleteSettlement,
} from "./settlement-complete.handler";
import { GroupTextContext } from "../types/webhook.types";
import { handleList } from "./list.handler";

/**
 * メッセージイベントを処理するハンドラー
 * @param event メッセージイベント
 */
export async function handleMessage(event: webhook.MessageEvent) {
	const context = parseGroupTextContext(event);
	if (!context) return;

	const { text, replyToken, groupId, userId } = context;

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
			case "一覧":
				await handleList(replyToken, groupId);
				break;
			case "完了":
				await handleClose(replyToken, groupId);
				break;
			case "締め解除":
				await handleReopen(replyToken, groupId);
				break;
			case "済":
				await handleCompleteSettlement(replyToken, groupId, userId);
				break;
			case "全員精算完了":
				await handleCompleteAllSettlements(replyToken, groupId);
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

/**
 * グループテキストコンテキストを取得する関数
 * @param event メッセージイベント
 * @returns グループテキストコンテキスト
 */
function parseGroupTextContext(
	event: webhook.MessageEvent,
): GroupTextContext | null {
	if (event.source?.type !== "group") return null;

	const message = event.message as webhook.TextMessageContent;
	if (message.type !== "text") return null;

	const text = message.text.trim();

	const groupId = event.source.groupId;
	if (!groupId) return null;

	const userId = event.source.userId;
	if (!userId) return null;

	const replyToken = event.replyToken;
	if (!replyToken) return null;
	return {
		text,
		groupId,
		userId,
		replyToken,
	};
}
