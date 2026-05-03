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

/** ユーザーの残高 */
export type UserBalance = {
	/** ラインユーザーID */
	lineUserId: string;
	/** 残高 */
	netBalance: number;
};

/** 精算結果 */
export type Settlement = {
	/** 送金者ユーザーID */
	fromUserId: string;
	/** 受取者ユーザーID */
	toUserId: string;
	/** 支払い額 */
	amount: number;
};
