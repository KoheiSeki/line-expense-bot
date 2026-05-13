import { isGroupExpenseManagementClosed } from "@/features/expense-closure/service/expense-closure.server.service";
import { ApiError } from "@/lib/api/error";
import { db } from "@/lib/db/client";
import { expenseParticipants, expenses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { lineClient } from "@/lib/line/client";
import { deleteExpenseSchema } from "../schemas/expense.schema";
import { DeleteExpenseReq } from "../types/delete-expense.types";

/**
 * 支出を削除する関数
 * @param request 支出削除リクエスト
 */
export const deleteExpense = async (
	request: DeleteExpenseReq,
): Promise<void> => {
	const { lineGroupId, expenseId } = request;
	await db.transaction(async (tx) => {
		const isClosed = await isGroupExpenseManagementClosed(tx, lineGroupId);
		if (isClosed) {
			throw new ApiError(400, "グループの支出削除が締め切られています");
		}

		const result = deleteExpenseSchema.safeParse({
			expenseId,
			lineGroupId,
		});
		if (!result.success) {
			throw new ApiError(400, result.error.issues[0].message);
		}

		const deleteExpenseParticipantResult = await tx
			.delete(expenseParticipants)
			.where(eq(expenseParticipants.expenseId, expenseId))
			.returning({ lineUserId: expenseParticipants.lineUserId });
		if (deleteExpenseParticipantResult.length === 0) {
			throw new ApiError(404, "支出参加者の削除に失敗しました");
		}

		const deleteExpenseResult = await tx
			.delete(expenses)
			.where(
				and(
					eq(expenses.expenseId, expenseId),
					eq(expenses.lineGroupId, lineGroupId),
				),
			)
			.returning({ expenseId: expenses.expenseId });
		if (deleteExpenseResult.length === 0) {
			throw new ApiError(404, "支出の削除に失敗しました");
		}
	});

	await lineClient.pushMessage({
		to: lineGroupId,
		messages: [
			{
				type: "text",
				text: `📝 支出を削除しました`,
			},
		],
	});
};
