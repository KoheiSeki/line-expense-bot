import { db } from "@/lib/db/client";
import { CreateExpenseReq } from "../types/expense.types";
import { expenseParticipants, expenses } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/error";
import { createExpenseSchema } from "../schemas/expense.schema";
import { lineClient } from "@/lib/line/client";

/**
 * 支出を登録する関数
 * @param request 支出登録リクエスト
 */
export const createExpense = async (request: CreateExpenseReq) => {
	const result = createExpenseSchema.safeParse(request);
	if (!result.success) {
		throw new ApiError(400, result.error.issues[0].message);
	}

	await db.transaction(async (tx) => {
		/** 支出テーブルに登録 */
		const [expense] = await tx
			.insert(expenses)
			.values({
				lineGroupId: request.lineGroupId,
				payerUserId: request.payerUserId,
				title: request.title,
				amount: request.amount,
				paidAt: request.paidAt,
			})
			.returning({ expenseId: expenses.expenseId });

		/** 支出参加者テーブルに登録 */
		await tx.insert(expenseParticipants).values(
			request.expenseParticipants.map((participant) => ({
				expenseId: expense.expenseId,
				lineUserId: participant.lineUserId,
				shareAmount: participant.shareAmount,
			})),
		);
	});

	await lineClient.pushMessage({
		to: request.lineGroupId,
		messages: [
			{
				type: "text",
				text: `📝 ${request.title} ¥${Number(request.amount).toLocaleString("ja-JP")} を登録しました`,
			},
		],
	});
};
