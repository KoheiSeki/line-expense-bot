import { z } from "zod";

/** グループ参加フォーム検証スキーマ定義 */
export const joinFormSchema = z.object({
	displayName: z
		.string()
		.min(1, "表示名を入力してください")
		.max(100, "表示名は100文字以内にしてください"),
});

/** グループメンバースキーマ定義 */
export const createGroupMembersSchema = joinFormSchema.and(
	z.object({
		lineGroupId: z
			.string()
			.min(1, "グループIDの取得に失敗しました")
			.max(50, "ユーザーIDの形式が不正です"),
		lineUserId: z
			.string()
			.min(1, "ユーザーIDの取得に失敗しました")
			.max(50, "ユーザーIDの形式が不正です"),
		pictureUrl: z
			.string()
			.max(500, "プロフィール画像URLの形式が不正です")
			.optional(),
	}),
);
