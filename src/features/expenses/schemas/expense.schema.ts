import { z } from "zod";

/** 支出スキーマ定義 */
export const createExpenseSchema = z.object({
	groupId: z.string().min(1).max(50),
	payerUserId: z.string().min(1).max(50),
	title: z.string().min(1).max(255),
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "金額の形式が不正です"),
	paidAt: z.iso.date(),
	expenseParticipants: z.array(
		z.object({
			lineUserId: z.string().min(1).max(50),
			shareAmount: z
				.string()
				.regex(/^\d+(\.\d{1,2})?$/, "負担金額の形式が不正です"),
		}),
	),
});
