/** グループメンバー */
export type Member = {
	/** ラインユーザーID */
	lineUserId: string;
	/** 表示名 */
	displayName: string;
	/** プロフィール画像URL */
	pictureUrl: string;
};

/** 支払い登録リクエスト */
export type CreateExpenseRequest = {
	/** ライングループID */
	groupId: string;
	/** 支払い者ユーザーID */
	payerUserId: string;
	/** タイトル */
	title: string;
	/** 金額 */
	amount: string;
	/** 支払い日 */
	paidAt: string;
	/** 支出参加者 */
	expenseParticipants: ExpenseParticipant[];
};

/** 支出参加者 */
export type ExpenseParticipant = {
	/** ラインユーザーID */
	lineUserId: string;
	/** 負担金額 */
	shareAmount: string;
};
