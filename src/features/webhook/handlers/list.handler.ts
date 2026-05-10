import { fetchExpenseList } from "@/features/expenses/service/expense-list.server.service";
import { buildExpenseListFlexMessage } from "../flex-messages/expense-list.flex";
import { lineClient } from "@/lib/line/client";

/**
 * 支出一覧を表示するハンドラー
 * @param replyToken リプライトークン
 * @param groupId グループID
 */
export async function handleList(replyToken: string, groupId: string) {
	const items = await fetchExpenseList(groupId);

	const message = buildExpenseListFlexMessage(groupId, items);

	await lineClient.replyMessage({
		replyToken,
		messages: [message],
	});
}
