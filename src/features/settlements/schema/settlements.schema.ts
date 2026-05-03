import { z } from "zod";

/** 残高取得スキーマ定義 */
export const fetchSettlementsSchema = z.object({
	lineGroupId: z
		.string()
		.min(1, "グループIDの取得に失敗しました")
		.max(50, "ユーザーIDの形式が不正です"),
});
