import { completeUserSettlement } from "@/features/settlements/service/settlements-progress.server.service";
import { lineClient } from "@/lib/line/client";
import { messagingApi } from "@line/bot-sdk";

/**
 * 精算を完了するハンドラー
 * @param replyToken リプライトークン
 * @param groupId グループID
 * @param userId ユーザーID
 */
export async function handleSettlementComplete(
	replyToken: string,
	groupId: string,
	userId: string,
) {
	await completeUserSettlement(userId, groupId);

	await lineClient.replyMessage({
		replyToken,
		messages: [
			{
				type: "text",
				text: "精算を完了しました",
			} satisfies messagingApi.TextMessage,
		],
	});
}
