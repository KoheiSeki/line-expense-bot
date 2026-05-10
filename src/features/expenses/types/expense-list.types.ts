/** 一覧コマンドの結果  */
export type ExpenseListResult = {
	expenseId: number;
	payerUserId: string;
	payerUserName: string;
	title: string;
	amount: number;
	/** 支払日（表示は `formatDateJp` で整形） */
	paidAt: string;
	createdAt: Date;
};
