import { beforeEach, describe, expect, it, vi } from "vitest";
import { messagingApi } from "@line/bot-sdk";

const {
	mockFetchSettlements,
	mockBuildSettlementFlexMessage,
	mockReplyMessage,
} = vi.hoisted(() => ({
	mockFetchSettlements: vi.fn(),
	mockBuildSettlementFlexMessage: vi.fn(),
	mockReplyMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/line/client", () => ({
	lineClient: {
		replyMessage: mockReplyMessage,
	},
}));

vi.mock("@/features/settlements/service/settlements.server.service", () => ({
	fetchSettlements: mockFetchSettlements,
}));

vi.mock("../flex-messages/settlement.flex", () => ({
	buildSettlementFlexMessage: mockBuildSettlementFlexMessage,
}));

import { handleDisplay } from "./display.handler";

const sampleSettlements = [
	{
		fromUserId: "U2",
		fromUserName: "Bob",
		toUserId: "U1",
		toUserName: "Alice",
		amount: 500,
	},
];

describe("handleDisplay", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchSettlements.mockResolvedValue(sampleSettlements);
		mockBuildSettlementFlexMessage.mockReturnValue({
			type: "text",
			text: "精算スタブ",
		} satisfies messagingApi.TextMessage);
	});

	it("fetchSettlementsにgroupIdを渡す", async () => {
		await handleDisplay("reply-token", "Cgroupxxxxxxxx");

		expect(mockFetchSettlements).toHaveBeenCalledExactlyOnceWith("Cgroupxxxxxxxx");
	});

	it("buildSettlementFlexMessageに取得結果を渡す", async () => {
		await handleDisplay("reply-token", "Cgroupxxxxxxxx");

		expect(mockBuildSettlementFlexMessage).toHaveBeenCalledExactlyOnceWith(
			sampleSettlements,
		);
	});

	it("replyMessageにreplyTokenとメッセージを渡す", async () => {
		const flexMessage = {
			type: "flex",
			altText: "精算内容",
			contents: {
				type: "bubble",
				body: {
					type: "box",
					layout: "vertical",
					contents: [],
				},
			},
		} satisfies messagingApi.FlexMessage;
		mockBuildSettlementFlexMessage.mockReturnValueOnce(flexMessage);

		await handleDisplay("my-reply-token", "Cgroupxxxxxxxx");

		expect(mockReplyMessage).toHaveBeenCalledOnce();
		expect(mockReplyMessage).toHaveBeenCalledWith({
			replyToken: "my-reply-token",
			messages: [flexMessage],
		});
	});
});
