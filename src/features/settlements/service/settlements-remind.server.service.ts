import { db, DbTransaction } from "@/lib/db/client";
import { groupExpenseManagement } from "@/lib/db/schema";
import { asc, isNotNull } from "drizzle-orm";
import { fetchSettlements } from "./settlements.server.service";
import { buildSettlementRemindMessage } from "../utils/settlements-remind.utils";
import { MAX_LINE_GROUP_PER_REMIND_RUN } from "../consts/settlement-remind.consts";
import { lineClient } from "@/lib/line/client";

/**
 * 精算リマインドメッセージを送信する関数
 */
export const sendSettlementsRemind = async (): Promise<void> => {
	const closedGroups = await fetchClosedGroups();
	if (closedGroups.length === 0) return;

	let messageCount: number = 0;

	/** 対象のグループ単位で精算リマインドメッセージを送信 */
	for (const lineGroupId of closedGroups) {
		const settlements = await fetchSettlements(lineGroupId);
		const hasTargetSettlements = settlements.some(
			(settlement) => settlement.amount > 0,
		);
		if (!hasTargetSettlements) continue;

		const remindText = buildSettlementRemindMessage(settlements);
		if (remindText == null) continue;

		await sendRemindMessage(lineGroupId, remindText);

		messageCount++;
		if (messageCount >= MAX_LINE_GROUP_PER_REMIND_RUN) break;
	}
};

/**
 * 精算が締め切られたグループIDの配列を取得する関数
 * @param tx トランザクション
 * @returns 精算が締め切られたグループIDの配列
 */
const fetchClosedGroups = async (tx?: DbTransaction): Promise<string[]> => {
	const rows = await (tx ?? db)
		.select({ lineGroupId: groupExpenseManagement.lineGroupId })
		.from(groupExpenseManagement)
		.where(isNotNull(groupExpenseManagement.closedAt))
		.orderBy(asc(groupExpenseManagement.lineGroupId));

	return rows.map((row) => row.lineGroupId);
};

/**
 * 精算リマインドメッセージを送信する関数
 * @param lineGroupId ライングループID
 * @param remindText 精算リマインドメッセージ
 */
const sendRemindMessage = async (
	lineGroupId: string,
	remindText: string,
): Promise<void> => {
	await lineClient.pushMessage({
		to: lineGroupId,
		messages: [{ type: "text", text: remindText }],
	});
};
