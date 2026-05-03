/** グループメンバー登録リクエスト */
export type RegisterGroupMemberReq = {
	/** ライングループID */
	lineGroupId: string;
	/** ラインユーザーID */
	lineUserId: string;
	/** 表示名 */
	displayName: string;
	/** プロフィール画像URL */
	pictureUrl: string;
};
