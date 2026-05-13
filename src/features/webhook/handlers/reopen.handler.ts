import { reopenGroupExpenseManagement } from "@/features/expense-closure/service/expense-closure.server.service";
import { lineClient } from "@/lib/line/client";
import { messagingApi } from "@line/bot-sdk";

/**
 * 支出の追加を再開するハンドラー
 * @param replyToken リプライトークン
 * @param groupId グループID
 */
export async function handleReopen(replyToken: string, groupId: string) {
	await reopenGroupExpenseManagement(groupId);

	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: "text",
				text: "支出の追加を再開しました",
			} satisfies messagingApi.TextMessage,
		],
	});
}
