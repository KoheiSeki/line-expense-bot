import { ApiError } from "@/lib/api/error";
import { fetchExpenseListSchema } from "../schemas/expense-list.schema";
import {
	buildGroupMemberMap,
	fetchGroupMembers,
} from "@/features/group-members/service/group-members.server.service";
import { Expense } from "../types/expense.types";
import { ExpenseListResult } from "../types/expense-list.types";
import { fetchExpensesByLineGroupId } from "./expense.server.service";

/**
 * 一覧コマンドの結果を取得する関数
 * @param lineGroupId ライングループID
 * @returns 一覧コマンドの結果
 */
export const fetchExpenseList = async (
	lineGroupId: string,
): Promise<ExpenseListResult[]> => {
	const result = fetchExpenseListSchema.safeParse({ lineGroupId });
	if (!result.success) {
		throw new ApiError(400, result.error.issues[0].message);
	}

	const expenses = await fetchExpensesByLineGroupId(lineGroupId);

	const results = buildExpenseListResults(lineGroupId, expenses);

	return results;
};

/**
 * 一覧コマンドの結果を作成する関数
 * @param lineGroupId ライングループID
 * @param expenses 支出テーブルのデータ
 * @returns 一覧コマンドの結果
 */
const buildExpenseListResults = async (
	lineGroupId: string,
	expenses: Expense[],
): Promise<ExpenseListResult[]> => {
	const groupMembers = await fetchGroupMembers(lineGroupId);

	const groupMemberMap = buildGroupMemberMap(groupMembers);

	const results: ExpenseListResult[] = expenses.map((expense) => ({
		expenseId: expense.expenseId,
		payerUserId: expense.payerUserId,
		payerUserName: groupMemberMap[expense.payerUserId] ?? "未設定",
		title: expense.title,
		amount: expense.amount,
		paidAt: expense.paidAt,
		createdAt: expense.createdAt,
	}));

	return results;
};
