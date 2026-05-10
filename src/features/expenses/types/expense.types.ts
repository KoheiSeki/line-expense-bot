/** グループメンバー */
export type Member = {
	/** ラインユーザーID */
	lineUserId: string;
	/** 表示名 */
	displayName: string;
	/** プロフィール画像URL */
	pictureUrl: string | undefined;
};

/** 支払い登録リクエスト */
export type CreateExpenseReq = {
	/** ライングループID */
	lineGroupId: string;
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

/** 支出フォーム */
export type ExpenseForm = {
	/** 支払い者ユーザーID */
	payerUserId: string;
	/** 支出タイトル */
	title: string;
	/** 金額 */
	amount: string;
	/** 支払い日 */
	paidAt: string;
	/** 支出参加者 */
	expenseParticipants: ExpenseParticipant[];
};

/** 支出テーブル */
export type Expense = {
	/** 支出ID */
	expenseId: number;
	/** ライングループID */
	lineGroupId: string;
	/** 支払い者ユーザーID */
	payerUserId: string;
	/** タイトル */
	title: string;
	/** 金額 */
	amount: number;
	/** 支払い日 */
	paidAt: string;
	/** 作成日時 */
	createdAt: Date;
};
