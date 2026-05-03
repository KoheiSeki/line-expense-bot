import { fetchSettlements } from "@/features/settlements/service/settlements.server.service";
import { buildSettlementFlexMessage } from "../flex-messages/settlement.flex";
import { lineClient } from "@/lib/line/client";

/**
 * 精算結果を表示するハンドラー
 * @param replyToken リプライトークン
 * @param groupId グループID
 */
export async function handleDisplay(replyToken: string, groupId: string) {
	const settlements = await fetchSettlements(groupId);

	const message = buildSettlementFlexMessage(settlements);

	await lineClient.replyMessage({
		replyToken,
		messages: [message],
	});
}
