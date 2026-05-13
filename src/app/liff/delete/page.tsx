import { DeleteExpenseConfirmForm } from "@/features/expenses/components/delete-expense-confirm-form";
import { fetchExpenseDetail } from "@/features/expenses/service/expense.server.service";
import { EditExpense } from "@/features/expenses/types/edit-expense.types";

type DeletePageProps = {
	searchParams: Promise<{ groupId?: string; expenseId?: string }>;
};

export default async function DeletePage({ searchParams }: DeletePageProps) {
	const { groupId, expenseId } = await searchParams;
	if (!groupId) return <p>グループIDが取得できません</p>;
	if (!expenseId) return <p>支出IDが取得できません</p>;

	const parsedExpenseId = Number.parseInt(expenseId, 10);
	if (!Number.isFinite(parsedExpenseId)) {
		return <p>支出IDの形式が不正です</p>;
	}

	const expense: EditExpense = await fetchExpenseDetail(parsedExpenseId, groupId);

	return (
		<main className="max-w-md mx-auto">
			<h1 className="text-xl font-bold p-6 pb-0">支出削除</h1>
			<DeleteExpenseConfirmForm expense={expense} />
		</main>
	);
}
