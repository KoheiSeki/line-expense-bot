import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import {
	handleCompleteAllSettlements,
	handleCompleteSettlement,
} from "./settlement-complete.handler";

const {
	mockReplyMessage,
	mockCompleteUserSettlement,
	mockCompleteAllUserSettlement,
} = vi.hoisted(() => ({
	mockReplyMessage: vi.fn().mockResolvedValue(undefined),
	mockCompleteUserSettlement: vi.fn().mockResolvedValue(undefined),
	mockCompleteAllUserSettlement: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/line/client", () => ({
	lineClient: {
		replyMessage: mockReplyMessage,
	},
}));

vi.mock("@/features/settlements/service/settlements-progress.server.service", () => ({
	completeUserSettlement: mockCompleteUserSettlement,
	completeAllUserSettlement: mockCompleteAllUserSettlement,
}));

describe("handleCompleteSettlement", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCompleteUserSettlement.mockResolvedValue(undefined);
		mockReplyMessage.mockResolvedValue(undefined);
	});

	it("completeUserSettlementにuserIdとgroupIdを渡す", async () => {
		await handleCompleteSettlement("reply-token", "Cgroupxxxxxxxx", "Uuserxxxxxx");

		expect(mockCompleteUserSettlement).toHaveBeenCalledOnce();
		expect(mockCompleteUserSettlement).toHaveBeenCalledWith(
			"Uuserxxxxxx",
			"Cgroupxxxxxxxx",
		);
	});

	it("成功後にreplyMessageが1回呼ばれ、文言が精算完了である", async () => {
		await handleCompleteSettlement("rt", "gid", "uid");

		expect(mockReplyMessage).toHaveBeenCalledOnce();
		expect(mockReplyMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				replyToken: "rt",
				messages: [
					expect.objectContaining({
						type: "text",
						text: "精算を完了しました",
					}),
				],
			}),
		);
	});

	it("completeUserSettlementが失敗した場合はreplyMessageを呼ばない", async () => {
		mockCompleteUserSettlement.mockRejectedValueOnce(
			new ApiError(400, "精算内容が存在しません"),
		);

		await expect(
			handleCompleteSettlement("rt", "gid", "uid"),
		).rejects.toMatchObject({
			status: 400,
			message: "精算内容が存在しません",
		});
		expect(mockReplyMessage).not.toHaveBeenCalled();
	});
});

describe("handleCompleteAllSettlements", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCompleteAllUserSettlement.mockResolvedValue(undefined);
		mockReplyMessage.mockResolvedValue(undefined);
	});

	it("completeAllUserSettlementにgroupIdを渡す", async () => {
		await handleCompleteAllSettlements("reply-token", "Cgroupxxxxxxxx");

		expect(mockCompleteAllUserSettlement).toHaveBeenCalledOnce();
		expect(mockCompleteAllUserSettlement).toHaveBeenCalledWith("Cgroupxxxxxxxx");
	});

	it("成功後にreplyMessageが1回呼ばれ、文言が全員精算完了である", async () => {
		await handleCompleteAllSettlements("rt", "gid");

		expect(mockReplyMessage).toHaveBeenCalledOnce();
		expect(mockReplyMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				replyToken: "rt",
				messages: [
					expect.objectContaining({
						type: "text",
						text: "全員の精算を完了しました",
					}),
				],
			}),
		);
	});

	it("completeAllUserSettlementが失敗した場合はreplyMessageを呼ばない", async () => {
		mockCompleteAllUserSettlement.mockRejectedValueOnce(
			new ApiError(400, "精算内容が存在しません"),
		);

		await expect(
			handleCompleteAllSettlements("rt", "gid"),
		).rejects.toMatchObject({
			status: 400,
			message: "精算内容が存在しません",
		});
		expect(mockReplyMessage).not.toHaveBeenCalled();
	});
});
