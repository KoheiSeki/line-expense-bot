import { db, DbTransaction } from "@/lib/db/client";
import { eq, sql } from "drizzle-orm";
import { groupExpenseManagement } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/error";

/**
 * グループの支出追加が締め切られているか判定する関数
 * @param tx トランザクション
 * @param lineGroupId ライングループID
 * @returns グループの支出追加締切フラグ
 */
export const isGroupExpenseManagementClosed = async (
	tx: DbTransaction | undefined,
	lineGroupId: string,
) => {
	const result = await (tx ?? db)
		.select({ closedAt: groupExpenseManagement.closedAt })
		.from(groupExpenseManagement)
		.where(eq(groupExpenseManagement.lineGroupId, lineGroupId));

	return result.length > 0 && result[0].closedAt !== null;
};

/**
 * グループの支出追加を締める関数
 * @param lineGroupId ライングループID
 */
export const closeGroupExpenseManagement = async (lineGroupId: string) => {
	await db
		.insert(groupExpenseManagement)
		.values({ lineGroupId })
		.onConflictDoUpdate({
			target: [groupExpenseManagement.lineGroupId],
			set: {
				closedAt: sql`now()`,
				updatedAt: sql`now()`,
			},
		});
};

/**
 * グループの支出追加を再開する関数
 * @param lineGroupId ライングループID
 */
export const reopenGroupExpenseManagement = async (lineGroupId: string) => {
	await db.transaction(async (tx) => {
		const rows = await tx
			.select({ closedAt: groupExpenseManagement.closedAt })
			.from(groupExpenseManagement)
			.where(eq(groupExpenseManagement.lineGroupId, lineGroupId));

		if (rows.length === 0 || rows[0].closedAt === null) {
			throw new ApiError(400, "支出の追加は締め切られていません。");
		}

		await tx
			.update(groupExpenseManagement)
			.set({
				closedAt: null,
				updatedAt: sql`now()`,
			})
			.where(eq(groupExpenseManagement.lineGroupId, lineGroupId));
	});
};
