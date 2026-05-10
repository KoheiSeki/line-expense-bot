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
