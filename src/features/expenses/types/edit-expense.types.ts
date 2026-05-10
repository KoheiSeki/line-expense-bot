import { ExpenseParticipant } from "./expense.types";

/** 支出編集リクエスト */
export type EditExpenseReq = {
	/** 支出ID */
	expenseId: number;
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

/** 編集対象の支出の検索結果 */
export type EditExpenseSearchResult = {
	/** 支出ID */
	expenseId: number;
	/** ライングループID */
	lineGroupId: string;
	/** 支払い者ユーザーID */
	payerUserId: string;
	/** 支払い者表示名 */
	payerDisplayName: string;
	/** 支払い者プロフィール画像URL */
	payerPictureUrl: string | undefined;
	/** タイトル */
	title: string;
	/** 金額 */
	amount: number;
	/** 支払い日 */
	paidAt: string;
	/** 支出参加者 */
	participantUserId: string;
	/** 支出参加者表示名 */
	participantDisplayName: string;
	/** 支出参加者プロフィール画像URL */
	participantPictureUrl: string | undefined;
	/** 支出参加者負担金額 */
	shareAmount: number;
};

/** 編集対象の支出のフォーム */
export type EditExpense = {
	/** 支出ID */
	expenseId: number;
	/** ライングループID */
	lineGroupId: string;
	/** 支払い者ユーザーID */
	payerUserId: string;
	/** 支払い者表示名 */
	payerDisplayName: string;
	/** 支払い者プロフィール画像URL */
	payerPictureUrl: string | undefined;
	/** タイトル */
	title: string;
	/** 金額 */
	amount: string;
	/** 支払い日 */
	paidAt: string;
	/** 支出参加者 */
	expenseParticipants: EditExpenseParticipant[];
};

/** 編集対象の支出の参加者 */
export type EditExpenseParticipant = {
	/** ラインユーザーID */
	lineUserId: string;
	/** 表示名 */
	displayName: string;
	/** プロフィール画像URL */
	pictureUrl: string | undefined;
	/** 負担金額 */
	shareAmount: string;
};
