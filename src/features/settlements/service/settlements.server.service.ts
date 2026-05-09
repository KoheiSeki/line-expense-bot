import { ApiError } from "@/lib/api/error";
import { fetchSettlementsSchema } from "../schema/settlements.schema";
import {
	SettlementResult,
	Settlement,
	UserBalance,
} from "../types/settlements.types";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { calculateSettlements } from "../utils/settlements.utils";
import { fetchGroupMembers } from "@/features/group-members/service/group-members.server.service";

/**
 * 残高を取得する関数
 * @param lineGroupId ライングループID
 * @returns 残高
 */
export const fetchSettlements = async (
	lineGroupId: string,
): Promise<SettlementResult[]> => {
	// バリデーション
	const result = fetchSettlementsSchema.safeParse({ lineGroupId });
	if (!result.success) {
		throw new ApiError(400, result.error.issues[0].message);
	}

	// メンバー毎の残高取得
	const balances = await fetchUserBalances(lineGroupId);

	// 精算計算（貪欲法）
	const settlements: Settlement[] = calculateSettlements(balances);

	// 表示用データ取得
	const results = await buildSettlementResults(lineGroupId, settlements);

	return results;
};

/**
 * ユーザー毎の残高を取得する関数
 * @param lineGroupId ライングループID
 * @returns ユーザー毎の残高
 */
const fetchUserBalances = async (
	lineGroupId: string,
): Promise<UserBalance[]> => {
	const rows = await db.execute(sql`
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
