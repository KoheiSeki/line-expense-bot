import { beforeEach, describe, expect, it, vi } from "vitest";
import { messagingApi } from "@line/bot-sdk";

const {
	mockFetchExpenseList,
	mockBuildExpenseListFlexMessage,
	mockReplyMessage,
} = vi.hoisted(() => ({
	mockFetchExpenseList: vi.fn(),
	mockBuildExpenseListFlexMessage: vi.fn(),
	mockReplyMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/line/client", () => ({
	lineClient: {
		replyMessage: mockReplyMessage,
	},
}));

vi.mock("@/features/expenses/service/expense-list.server.service", () => ({
	fetchExpenseList: mockFetchExpenseList,
}));

vi.mock("../flex-messages/expense-list.flex", () => ({
	buildExpenseListFlexMessage: mockBuildExpenseListFlexMessage,
}));

import { handleList } from "./list.handler";

const sampleItems = [
	{
		expenseId: 1,
		payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
		payerUserName: "太郎",
		title: "ランチ",
		amount: 1000,
		paidAt: new Date("2026-01-15T12:00:00"),
		createdAt: new Date("2026-01-15T12:00:00.000Z"),
	},
];

describe("handleList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchExpenseList.mockResolvedValue(sampleItems);
		mockBuildExpenseListFlexMessage.mockReturnValue({
			type: "text",
			text: "一覧スタブ",
		} satisfies messagingApi.TextMessage);
	});

	it("fetchExpenseListにgroupIdを渡す", async () => {
		await handleList("reply-token", "Cgroupxxxxxxxx");

		expect(mockFetchExpenseList).toHaveBeenCalledExactlyOnceWith("Cgroupxxxxxxxx");
	});

	it("buildExpenseListFlexMessageにgroupIdと取得結果を渡す", async () => {
		await handleList("reply-token", "Cgroupxxxxxxxx");

		expect(mockBuildExpenseListFlexMessage).toHaveBeenCalledExactlyOnceWith(
			"Cgroupxxxxxxxx",
			sampleItems,
		);
	});

	it("replyMessageにreplyTokenとFlexメッセージを渡す", async () => {
		const flexMessage = {
			type: "flex",
			altText: "支出一覧",
			contents: {
				type: "bubble",
				body: {
					type: "box",
					layout: "vertical",
					contents: [],
				},
			},
		} satisfies messagingApi.FlexMessage;
		mockBuildExpenseListFlexMessage.mockReturnValueOnce(flexMessage);

		await handleList("my-reply-token", "Cgroupxxxxxxxx");

		expect(mockReplyMessage).toHaveBeenCalledOnce();
		expect(mockReplyMessage).toHaveBeenCalledWith({
			replyToken: "my-reply-token",
			messages: [flexMessage],
		});
	});
});
