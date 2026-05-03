/** 表示コマンドの結果 */
export type SettlementResult = {
	/** 送金者ユーザーID */
	fromUserId: string;
	/** 送金者名 */
	fromUserName: string;
	/** 受取者ユーザーID */
	toUserId: string;
	/** 受取者名 */
	toUserName: string;
	/** 支払い額 */
	amount: number;
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
