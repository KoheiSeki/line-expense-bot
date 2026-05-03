import { z } from "zod";

/** 支出参加者スキーマ定義 */
const participantSchema = z.object({
	lineUserId: z.string().min(1).max(50),
	shareAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "負担金額の形式が不正です"),
});

/** 支出フォーム検証スキーマ定義 */
export const expenseFormSchema = z
	.object({
		payerUserId: z
			.string()
			.min(1, "支払い者を選択してください")
			.max(50, "ユーザーIDの形式が不正です"),
		title: z
			.string()
			.min(1, "タイトルを入力してください")
			.max(255, "タイトルは255文字以内にしてください"),
		amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "金額の形式が不正です"),
		paidAt: z.iso.date("支払い日を選択してください"),
		expenseParticipants: z
			.array(participantSchema)
			.min(1, "支出参加者を1人以上選択してください"),
	})
	.refine(
		(data) => {
			const total = data.expenseParticipants.reduce(
				(acc, participant) => acc + Number(participant.shareAmount),
				0,
			);
			return total === Number(data.amount);
		},
		{
			message: "負担金額の合計が合計金額と一致しません",
			path: ["expenseParticipants"],
		},
	);

/** 支出登録スキーマ定義 */
export const createExpenseSchema = expenseFormSchema.and(
	z.object({
		lineGroupId: z
			.string()
			.min(1, "グループIDの取得に失敗しました")
			.max(50, "ユーザーIDの形式が不正です"),
	}),
);
