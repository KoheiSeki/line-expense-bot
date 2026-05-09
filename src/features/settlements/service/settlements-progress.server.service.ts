import { db, DbTransaction } from "@/lib/db/client";
import { fetchGreedySettlements } from "./settlements.server.service";
import { ApiError } from "@/lib/api/error";
import { groupSettlementProgress } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Settlement } from "../types/settlements.types";

/**
 * 精算を完了する関数
 * @param lineUserId ラインユーザーID
 * @param lineGroupId ライングループID
 */
export const completeUserSettlement = async (
	lineUserId: string,
	lineGroupId: string,
): Promise<void> => {
	await db.transaction(async (tx) => {
		const settlements = await fetchGreedySettlements(lineGroupId, tx);

		const userSettlements = filterUserSettlements(lineUserId, settlements);

		await upsertSettlementProgress(userSettlements, lineGroupId, tx);
	});
};

/**
 * 該当ユーザーの精算内容を取得する関数
 * @param lineUserId ラインユーザーID
 * @param settlements 精算内容
 * @returns 該当ユーザーの精算内容
 */
const filterUserSettlements = (
	lineUserId: string,
	settlements: Settlement[],
): Settlement[] => {
	const userSettlements = settlements.filter(
		(settlement) => settlement.fromUserId === lineUserId,
	);

	if (userSettlements.length === 0) {
		throw new ApiError(400, "精算内容が存在しません");
	}

	return userSettlements;
};

/**
 * グループ精算管理テーブルに登録する関数
 * @param userSettlements 該当ユーザーの精算内容
 * @param lineGroupId ライングループID
 * @param tx トランザクション
 */
const upsertSettlementProgress = async (
	userSettlements: Settlement[],
	lineGroupId: string,
	tx: DbTransaction,
): Promise<void> => {
	await tx
		.insert(groupSettlementProgress)
		.values(
			userSettlements.map((settlement) => ({
				lineGroupId,
				fromUserId: settlement.fromUserId,
				toUserId: settlement.toUserId,
				settledAmount: settlement.amount,
				updatedAt: sql`now()`,
			})),
		)
		.onConflictDoUpdate({
			target: [
				groupSettlementProgress.lineGroupId,
				groupSettlementProgress.fromUserId,
				groupSettlementProgress.toUserId,
			],
			set: {
				settledAmount: sql`excluded.settled_amount`,
				updatedAt: sql`now()`,
			},
		});
};
