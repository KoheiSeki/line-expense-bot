import { closeGroupExpenseManagement } from "@/features/expense-closure/service/expense-closure.server.service";
import { lineClient } from "@/lib/line/client";
import { messagingApi } from "@line/bot-sdk";

/**
 * 支出の追加を締め切るハンドラー
 * @param replyToken リプライトークン
 * @param groupId グループID
 */
export async function handleClose(replyToken: string, groupId: string) {
	await closeGroupExpenseManagement(groupId);

	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: "text",
				text: "支出の追加を締め切りました",
			} satisfies messagingApi.TextMessage,
		],
	});
}
