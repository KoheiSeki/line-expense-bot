import { expenseFormSchema } from "../schemas/expense.schema";
import { ExpenseForm } from "../types/expense.types";

/**
 * 支出フォームを検証する関数
 * @param expenseForm 支出フォーム
 * @returns エラーメッセージ
 */
export const validateExpenseForm = (
	expenseForm: ExpenseForm,
): string | null => {
	return (
		expenseFormSchema.safeParse(expenseForm).error?.issues[0].message ?? null
	);
};
