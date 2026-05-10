import { ExpenseListResult } from "@/features/expenses/types/expense-list.types";
import { formatDateJp } from "@/lib/utils/format-date";
import { messagingApi } from "@line/bot-sdk";

const LIST_LIMIT = 10;

/**
 * 支出一覧の Flex メッセージを作成する関数（直近 {LIST_LIMIT} 件想定）
 */
export const buildExpenseListFlexMessage = (
	items: ExpenseListResult[],
): messagingApi.FlexMessage | messagingApi.TextMessage => {
	if (items.length === 0) {
		return {
			type: "text",
			text: "まだ支出が登録されていません",
		} satisfies messagingApi.TextMessage;
	}

	const rows = items.map((item) => ({
		type: "box" as const,
		layout: "vertical" as const,
		spacing: "xs" as const,
		margin: "lg" as const,
		contents: [
			{
				type: "box" as const,
				layout: "horizontal" as const,
				contents: [
					{
						type: "text" as const,
						text: item.title,
						flex: 2,
						size: "sm" as const,
						color: "#333333",
						weight: "bold" as const,
						wrap: true,
					},
					{
						type: "text" as const,
						text: `¥${item.amount.toLocaleString("ja-JP")}`,
						flex: 1,
						size: "sm" as const,
						color: "#111111",
						weight: "bold" as const,
						align: "end" as const,
					},
				],
			},
			{
				type: "text" as const,
				text: `${item.payerUserName} · 支払日 ${formatDateJp(item.paidAt)}`,
				size: "xs" as const,
				color: "#888888",
			},
		],
	}));

	return {
		type: "flex",
		altText: `支出一覧（最新${LIST_LIMIT}件まで・${items.length}件表示）`,
		contents: {
			type: "bubble",
			header: {
				type: "box",
				layout: "vertical",
				backgroundColor: "#426EB8",
				contents: [
					{
						type: "text",
						text: "📋 支出一覧",
						color: "#FFFFFF",
						weight: "bold",
						size: "lg",
					},
					{
						type: "text",
						text: `作成日時が新しい順に、最新${LIST_LIMIT}件のみ表示しています`,
						color: "#E8EEF8",
						size: "xs",
						margin: "sm",
						wrap: true,
					},
				],
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "none",
				contents: rows as messagingApi.FlexBox[],
			},
			footer: {
				type: "box",
				layout: "vertical",
				spacing: "sm",
				contents: [
					{
						type: "text",
						text: `※支出の表示は、作成日時が新しい順に最大${LIST_LIMIT}件までです。`,
						size: "xs",
						color: "#888888",
						wrap: true,
					},
				],
			},
		},
	} satisfies messagingApi.FlexMessage;
};
