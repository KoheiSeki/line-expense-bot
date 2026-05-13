import { db, DbTransaction } from "@/lib/db/client";
import { CreateExpenseReq, Expense } from "../types/expense.types";
import { expenseParticipants, expenses } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/error";
import { createExpenseSchema } from "../schemas/expense.schema";
import { lineClient } from "@/lib/line/client";
import { isGroupExpenseManagementClosed } from "@/features/expense-closure/service/expense-closure.server.service";
import { desc, eq, sql } from "drizzle-orm";
import {
	EditExpense,
	EditExpenseParticipant,
	EditExpenseSearchResult,
} from "../types/edit-expense.types";

/**
 * 支出を登録する関数
 * @param request 支出登録リクエスト
 */
export const createExpense = async (request: CreateExpenseReq) => {
	await db.transaction(async (tx) => {
		const isClosed = await isGroupExpenseManagementClosed(
			tx,
			request.lineGroupId,
		);
		if (isClosed) {
			throw new ApiError(400, "グループの支出追加が締め切られています");
		}

		const result = createExpenseSchema.safeParse(request);
		if (!result.success) {
			throw new ApiError(400, result.error.issues[0].message);
		}

		/** 支出テーブルに登録 */
		const [expense] = await tx
			.insert(expenses)
			.values({
				lineGroupId: request.lineGroupId,
				payerUserId: request.payerUserId,
				title: request.title,
				amount: parseInt(request.amount, 10),
				paidAt: request.paidAt,
			})
			.returning({ expenseId: expenses.expenseId });

		/** 支出参加者テーブルに登録 */
		await tx.insert(expenseParticipants).values(
			request.expenseParticipants.map((participant) => ({
				expenseId: expense.expenseId,
				lineUserId: participant.lineUserId,
				shareAmount: parseInt(participant.shareAmount, 10),
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

/**
 * 支出テーブルのデータを取得する関数
 * @param lineGroupId ライングループID
 * @param tx トランザクション
 * @returns 支出テーブルのデータ
 */
export const fetchExpensesByLineGroupId = async (
	lineGroupId: string,
	tx?: DbTransaction,
): Promise<Expense[]> => {
	const rows: Expense[] = await (tx ?? db)
		.select()
		.from(expenses)
		.where(eq(expenses.lineGroupId, lineGroupId))
		.orderBy(desc(expenses.createdAt))
		.limit(10);

	return rows;
};

/**
 * 支出の詳細（編集フォーム・削除確認など LIFF 用）を取得する
 * @param expenseId 支出ID
 * @param lineGroupId ライングループID
 * @param tx トランザクション
 */
export const fetchExpenseDetail = async (
	expenseId: number,
	lineGroupId: string,
	tx?: DbTransaction,
): Promise<EditExpense> => {
	const rows: EditExpenseSearchResult[] = await (tx ?? db).execute(sql`
		SELECT 
			e.expense_id AS "expenseId", 
			e.line_group_id AS "lineGroupId", 
			e.payer_user_id AS "payerUserId",
			gm1.display_name AS "payerDisplayName",
			gm1.picture_url AS "payerPictureUrl",
			e.title, 
			e.amount, 
			e.paid_at AS "paidAt",
			ep.line_user_id AS "participantUserId",
			gm2.display_name AS "participantDisplayName",
			gm2.picture_url AS "participantPictureUrl",
			ep.share_amount AS "shareAmount"

		FROM expenses e
		JOIN group_members gm1 ON e.line_group_id = gm1.line_group_id AND e.payer_user_id = gm1.line_user_id
		JOIN expense_participants ep ON e.expense_id = ep.expense_id
		JOIN group_members gm2 ON e.line_group_id = gm2.line_group_id AND ep.line_user_id = gm2.line_user_id
		WHERE e.expense_id = ${expenseId} AND e.line_group_id = ${lineGroupId}
	`);

	if (rows.length === 0) {
		throw new ApiError(404, "支出が見つかりません");
	}

	const expenseParticipants: EditExpenseParticipant[] = rows.map((row) => ({
		lineUserId: row.participantUserId,
		displayName: row.participantDisplayName,
		pictureUrl: row.participantPictureUrl,
		shareAmount: row.shareAmount.toString(),
	}));

	return {
		expenseId: rows[0].expenseId,
		lineGroupId: rows[0].lineGroupId,
		payerUserId: rows[0].payerUserId,
		payerDisplayName: rows[0].payerDisplayName,
		payerPictureUrl: rows[0].payerPictureUrl,
		title: rows[0].title,
		amount: rows[0].amount.toString(),
		paidAt: rows[0].paidAt,
		expenseParticipants: expenseParticipants,
	};
};
