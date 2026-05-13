import { db } from "@/lib/db/client";
import { EditExpenseReq } from "../types/edit-expense.types";
import { isGroupExpenseManagementClosed } from "@/features/expense-closure/service/expense-closure.server.service";
import { ApiError } from "@/lib/api/error";
import { editExpenseSchema } from "../schemas/expense.schema";
import { expenseParticipants, expenses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { lineClient } from "@/lib/line/client";

/**
 * 支出を編集する関数
 * @param request 支出編集リクエスト
 */
export const editExpense = async (request: EditExpenseReq): Promise<void> => {
	await db.transaction(async (tx) => {
		const isClosed = await isGroupExpenseManagementClosed(
			tx,
			request.lineGroupId,
		);
		if (isClosed) {
			throw new ApiError(400, "グループの支出編集が締め切られています");
		}

		const result = editExpenseSchema.safeParse(request);
		if (!result.success) {
			throw new ApiError(400, result.error.issues[0].message);
		}

		/** 支出テーブルを更新 */
		const updateExpenseResult = await tx
			.update(expenses)
			.set({
				payerUserId: request.payerUserId,
				title: request.title,
				amount: parseInt(request.amount, 10),
				paidAt: request.paidAt,
			})
			.where(
				and(
					eq(expenses.expenseId, request.expenseId),
					eq(expenses.lineGroupId, request.lineGroupId),
				),
			)
			.returning({ expenseId: expenses.expenseId });
		if (updateExpenseResult.length === 0) {
			throw new ApiError(404, "支出の編集に失敗しました");
		}

		/** 支出参加者テーブルを更新 */
		const deleteExpenseParticipantResult = await tx
			.delete(expenseParticipants)
			.where(eq(expenseParticipants.expenseId, request.expenseId))
			.returning({ lineUserId: expenseParticipants.lineUserId });
		if (deleteExpenseParticipantResult.length === 0) {
			throw new ApiError(404, "支出参加者が見つかりません");
		}
		/** 支出参加者テーブルを追加 */
		const insertExpenseParticipantResult = await tx
			.insert(expenseParticipants)
			.values(
				request.expenseParticipants.map((participant) => ({
					expenseId: request.expenseId,
					lineUserId: participant.lineUserId,
					shareAmount: parseInt(participant.shareAmount, 10),
				})),
			)
			.returning({ lineUserId: expenseParticipants.lineUserId });
		if (insertExpenseParticipantResult.length === 0) {
			throw new ApiError(500, "支出参加者の追加に失敗しました");
		}
	});

	await lineClient.pushMessage({
		to: request.lineGroupId,
		messages: [
			{
				type: "text",
				text: `📝 ${request.title} ¥${Number(request.amount).toLocaleString("ja-JP")} を編集しました`,
			},
		],
	});
};
