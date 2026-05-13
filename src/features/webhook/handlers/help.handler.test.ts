import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleHelp } from "./help.handler";
import { HELP_MESSAGE } from "../consts/messages.consts";

const { mockReplyMessage } = vi.hoisted(() => ({
	mockReplyMessage: vi.fn(),
}));

vi.mock("@/lib/line/client", () => ({
	lineClient: {
		replyMessage: mockReplyMessage,
	},
}));

describe("helpHandler", () => {
	beforeEach(() => {
		mockReplyMessage.mockClear();
	});

	it("replyMessageが1回呼ばれる", async () => {
		await handleHelp("token");
		expect(mockReplyMessage).toHaveBeenCalledOnce();
	});

	it("replyTokenが正しく渡される", async () => {
		await handleHelp("test-token");
		expect(mockReplyMessage).toHaveBeenCalledWith(
			expect.objectContaining({ replyToken: "test-token" }),
		);
	});

	it("HELP_MESSAGEの内容が返信される", async () => {
		await handleHelp("token");
		const messages = mockReplyMessage.mock.calls[0][0].messages;
		expect(messages[0].text).toBe(HELP_MESSAGE);
	});

	it("一覧・締めの案内を含む", async () => {
		await handleHelp("token");
		const text = mockReplyMessage.mock.calls[0][0].messages[0].text;
		expect(text).toContain("一覧");
		expect(text).toContain("締め済み");
		expect(text).toContain("編集");
		expect(text).toContain("削除");
	});
});
