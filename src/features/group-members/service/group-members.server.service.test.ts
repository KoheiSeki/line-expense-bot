import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterGroupMemberReq } from "../types/group-members.types";
import { registerGroupMember } from "./group-members.server.service";

const { mockOnConflictDoUpdate, mockValues, mockInsert, mockPushMessage } =
	vi.hoisted(() => {
		const mockOnConflictDoUpdate = vi.fn().mockReturnValue(undefined);
		const mockValues = vi.fn().mockReturnValue({
			onConflictDoUpdate: mockOnConflictDoUpdate,
		});
		const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
		const mockPushMessage = vi.fn().mockResolvedValue(undefined);

		return {
			mockOnConflictDoUpdate,
			mockValues,
			mockInsert,
			mockPushMessage,
		};
	});

vi.mock("@/lib/db/client", () => ({
	db: {
		insert: mockInsert,
	},
}));

vi.mock("@/lib/line/client", () => ({
	lineClient: {
		pushMessage: mockPushMessage,
	},
}));

/** 正常なリクエスト */
const validRequest: RegisterGroupMemberReq = {
	lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	displayName: "テストユーザー",
	pictureUrl: "https://example.com/picture.png",
};

describe("registerGroupMember", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOnConflictDoUpdate.mockResolvedValue(undefined);
	});

	it("DBのinsertチェーンの後にpushMessageが1回呼ばれる", async () => {
		await registerGroupMember(validRequest);
		expect(mockInsert).toHaveBeenCalledOnce();
		expect(mockValues).toHaveBeenCalledOnce();
		expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
		expect(mockPushMessage).toHaveBeenCalledOnce();
	});

	it("pushMessageのtoにlineGroupIdが渡される", async () => {
		await registerGroupMember(validRequest);
		expect(mockPushMessage).toHaveBeenCalledWith(
			expect.objectContaining({ to: validRequest.lineGroupId }),
		);
	});

	it("通知テキストに表示名が含まれる", async () => {
		await registerGroupMember(validRequest);
		const messages = mockPushMessage.mock.calls[0][0].messages;
		const text = messages[0].text;
		expect(text).toContain(`👋 ${validRequest.displayName} が参加しました`);
	});

	it("表示名が空の場合はApiErrorを投げ、DBとLINEを呼ばない", async () => {
		await expect(
			registerGroupMember({ ...validRequest, displayName: "" }),
		).rejects.toMatchObject({
			status: 400,
			message: "表示名を入力してください",
		});

		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("DBが失敗した場合はpushMessageを呼ばない", async () => {
		mockOnConflictDoUpdate.mockRejectedValueOnce(new Error("db error"));
		await expect(registerGroupMember(validRequest)).rejects.toThrow("db error");
		expect(mockPushMessage).not.toHaveBeenCalled();
	});
});
