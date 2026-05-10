import { z } from "zod";

export const fetchSettlementProgressSchema = z.object({
	lineGroupId: z
		.string()
		.min(1, "グループIDの取得に失敗しました")
		.max(50, "グループIDの形式が不正です"),
});
