/** 支出削除リクエスト */
export type DeleteExpenseReq = {
	/** 支出ID */
	expenseId: number;
	/** ライングループID */
	lineGroupId: string;
};
