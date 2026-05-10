import { SettlementResult } from "@/features/settlements/types/settlements.types";
import { messagingApi } from "@line/bot-sdk";

/**
 * 精算結果のFlexメッセージを作成する関数
 * @param settlements 精算結果
 * @returns 精算結果のFlexメッセージ
 */
export const buildSettlementFlexMessage = (
	settlements: SettlementResult[],
): messagingApi.FlexMessage | messagingApi.TextMessage => {
	if (settlements.length === 0) {
		return {
			type: "text",
			text: "精算は不要です🎉",
		} satisfies messagingApi.TextMessage;
	}

	const rows = settlements.map((settlement) => {
		const isSettled = settlement.amount <= 0;
		const amountOrStatusText = isSettled
			? {
					type: "text" as const,
					text: "精算完了",
					flex: 1,
					size: "sm" as const,
					color: "#0B6E4F",
					weight: "bold" as const,
					align: "end" as const,
				}
			: {
					type: "text" as const,
					text: `¥${settlement.amount.toLocaleString("ja-JP")}`,
					flex: 1,
					size: "sm" as const,
					color: "#111111",
					weight: "bold" as const,
					align: "end" as const,
				};

		return {
			type: "box" as const,
			layout: "horizontal" as const,
			contents: [
				{
					type: "text" as const,
					text: `${settlement.fromUserName} → ${settlement.toUserName}`,
					flex: 3,
					size: "sm" as const,
					color: "#333333",
				},
				amountOrStatusText,
			],
		};
	});

	return {
		type: "flex",
		altText: "精算内容",
		contents: {
			type: "bubble",
			header: {
				type: "box",
				layout: "vertical",
				backgroundColor: "#1DB446",
				contents: [
					{
						type: "text",
						text: "💰 精算内容",
						color: "#FFFFFF",
						weight: "bold",
						size: "lg",
					},
				],
			},
			body: {
				type: "box",
				layout: "vertical",
				spacing: "md",
				contents: rows as messagingApi.FlexBox[],
			},
		},
	} satisfies messagingApi.FlexMessage;
};
