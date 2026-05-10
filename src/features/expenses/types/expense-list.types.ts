/** 一覧コマンドの結果  */
export type ExpenseListResult = {
	expenseId: number;
	payerUserId: string;
	payerUserName: string;
	title: string;
	amount: number;
	paidAt: string;
	createdAt: Date;
};
