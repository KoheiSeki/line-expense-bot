import { z } from "zod";

/**
 * 支出一覧取得スキーマ定義
 */
export const fetchExpenseListSchema = z.object({
	lineGroupId: z
		.string()
		.min(1, "グループIDの取得に失敗しました")
		.max(50, "グループIDの形式が不正です"),
});
