/** グループ精算管理テーブル */
export type GroupSettlementProgress = {
	/** ライングループID */
	lineGroupId: string;
	/** 送金者ユーザーID */
	fromUserId: string;
	/** 受取者ユーザーID */
	toUserId: string;
	/** 精算済み金額 */
	settledAmount: number;
	/** 更新日時 */
	updatedAt: Date;
};
