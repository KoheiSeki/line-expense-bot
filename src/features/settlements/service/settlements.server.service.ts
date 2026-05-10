import { ApiError } from "@/lib/api/error";
import { fetchSettlementsSchema } from "../schema/settlements.schema";
import {
	SettlementResult,
	Settlement,
	UserBalance,
} from "../types/settlements.types";
import { db, DbTransaction } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { calculateSettlements } from "../utils/settlements.utils";
import { fetchGroupMembers } from "@/features/group-members/service/group-members.server.service";
import { fetchSettlementProgress } from "./settlements-progress.server.service";
import { GroupSettlementProgress } from "../types/settlement-progress.types";

/**
 * 残高を取得する関数
 * @param lineGroupId ライングループID
 * @returns 残高
 */
export const fetchSettlements = async (
	lineGroupId: string,
): Promise<SettlementResult[]> => {
	// 精算内容取得
	const settlements = await fetchGreedySettlements(lineGroupId);

	// 精算管理テーブルのデータ取得
	const settlementProgress = await fetchSettlementProgress(lineGroupId);

	// 精算内容と精算管理テーブルの内容を突き合わせ
	const mergedSettlements = mergeSettlements(settlements, settlementProgress);

	// 表示用データ取得
	const results = await buildSettlementResults(lineGroupId, mergedSettlements);

	return results;
};

/**
 * 貪欲法で精算内容を取得する関数
 * @param lineGroupId ライングループID
 * @param tx トランザクション
 * @returns 精算内容
 */
export const fetchGreedySettlements = async (
	lineGroupId: string,
	tx?: DbTransaction,
): Promise<Settlement[]> => {
	// バリデーション
	const result = fetchSettlementsSchema.safeParse({ lineGroupId });
	if (!result.success) {
		throw new ApiError(400, result.error.issues[0].message);
	}

	const balances = await fetchUserBalances(lineGroupId, tx);

	const settlements = calculateSettlements(balances);

	return settlements;
};

/**
 * ユーザー毎の残高を取得する関数
 * @param lineGroupId ライングループID
 * @param tx トランザクション
 * @returns ユーザー毎の残高
 */
export const fetchUserBalances = async (
	lineGroupId: string,
	tx?: DbTransaction,
): Promise<UserBalance[]> => {
	const rows = await (tx ?? db).execute(sql`
      SELECT user_id AS "lineUserId", SUM(paid) - SUM(owed) AS "netBalance"
      FROM (
      SELECT payer_user_id AS user_id,
              CAST(amount AS INTEGER) AS paid,
              0 AS owed
      FROM expenses
      WHERE line_group_id = ${lineGroupId}
      UNION ALL
      SELECT ep.line_user_id AS user_id,
              0 AS paid,
              CAST(ep.share_amount AS INTEGER) AS owed
      FROM expense_participants ep
      JOIN expenses e ON ep.expense_id = e.expense_id
      WHERE e.line_group_id = ${lineGroupId}
      ) t
      GROUP BY user_id
  `);
	return rows.map((row) => ({
		lineUserId: String(row.lineUserId),
		netBalance: Number(row.netBalance),
	}));
};

/**
 * 精算結果を取得する関数
 * @param lineGroupId ライングループID
 * @param settlements 精算結果
 * @returns 精算結果
 */
const buildSettlementResults = async (
	lineGroupId: string,
	settlements: Settlement[],
): Promise<SettlementResult[]> => {
	const groupMembers = await fetchGroupMembers(lineGroupId);

	const groupMemberMap: Record<string, string> = Object.fromEntries(
		groupMembers.map((member) => [member.lineUserId, member.displayName]),
	);

	const results: SettlementResult[] = settlements.map((settlement) => {
		return {
			fromUserId: settlement.fromUserId,
			fromUserName: groupMemberMap[settlement.fromUserId] ?? "未設定",
			toUserId: settlement.toUserId,
			toUserName: groupMemberMap[settlement.toUserId] ?? "未設定",
			amount: settlement.amount,
		};
	});

	return results;
};

/**
 * 精算内容と精算管理テーブルの内容を突き合わせる関数
 * @param settlements 精算内容
 * @param settlementProgress 精算管理テーブルの内容
 * @returns 突き合わせた精算内容
 */
const mergeSettlements = (
	settlements: Settlement[],
	settlementProgress: GroupSettlementProgress[],
): Settlement[] => {
	return settlements.map((settlement) => {
		const progress = settlementProgress.find(
			(progress) =>
				progress.fromUserId === settlement.fromUserId &&
				progress.toUserId === settlement.toUserId,
		);

		return {
			fromUserId: settlement.fromUserId,
			toUserId: settlement.toUserId,
			amount: Math.max(settlement.amount - (progress?.settledAmount ?? 0), 0),
		};
	});
};
