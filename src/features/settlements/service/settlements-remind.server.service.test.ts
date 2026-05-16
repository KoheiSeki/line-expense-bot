import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendSettlementsRemind } from "./settlements-remind.server.service";

const { mockFetchSettlements, mockOrderBy } = vi.hoisted(() => ({
	mockFetchSettlements: vi.fn(),
	mockOrderBy: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => ({
					orderBy: mockOrderBy,
				})),
			})),
		})),
	},
}));

vi.mock("./settlements.server.service", () => ({
	fetchSettlements: mockFetchSettlements,
}));

vi.mock("../consts/settlement-remind.consts", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("../consts/settlement-remind.consts")
		>();
	return {
		...actual,
		MAX_LINE_GROUP_PER_REMIND_RUN: 2,
	};
});

describe("sendSettlementsRemind", () => {
	beforeEach(() => {
		mockFetchSettlements.mockReset();
		mockOrderBy.mockReset();
	});

	it("締め済みグループが無いときは fetchSettlements を呼ばない", async () => {
		mockOrderBy.mockResolvedValue([]);

		await sendSettlementsRemind();

		expect(mockFetchSettlements).not.toHaveBeenCalled();
	});

	it("締め済みだが未精算が無いグループは fetch のみで送信対象に含めない", async () => {
		mockOrderBy.mockResolvedValue([{ lineGroupId: "g-closed" }]);
		mockFetchSettlements.mockResolvedValue([
			{
				fromUserId: "a",
				fromUserName: "A",
				toUserId: "b",
				toUserName: "B",
				amount: 0,
			},
		]);

		await sendSettlementsRemind();

		expect(mockFetchSettlements).toHaveBeenCalledTimes(1);
		expect(mockFetchSettlements).toHaveBeenCalledWith("g-closed");
	});

	it("未精算がある締めグループで fetchSettlements が呼ばれる", async () => {
		mockOrderBy.mockResolvedValue([{ lineGroupId: "g1" }]);
		mockFetchSettlements.mockResolvedValue([
			{
				fromUserId: "a",
				fromUserName: "太郎",
				toUserId: "b",
				toUserName: "花子",
				amount: 500,
			},
		]);

		await sendSettlementsRemind();

		expect(mockFetchSettlements).toHaveBeenCalledTimes(1);
		expect(mockFetchSettlements).toHaveBeenCalledWith("g1");
	});

	it("複数の締めグループを順に処理する", async () => {
		mockOrderBy.mockResolvedValue([
			{ lineGroupId: "g-aa" },
			{ lineGroupId: "g-bb" },
		]);
		mockFetchSettlements
			.mockResolvedValueOnce([
				{
					fromUserId: "a",
					fromUserName: "A",
					toUserId: "b",
					toUserName: "B",
					amount: 1,
				},
			])
			.mockResolvedValueOnce([
				{
					fromUserId: "c",
					fromUserName: "C",
					toUserId: "d",
					toUserName: "D",
					amount: 2,
				},
			]);

		await sendSettlementsRemind();

		expect(mockFetchSettlements).toHaveBeenCalledTimes(2);
		expect(mockFetchSettlements).toHaveBeenNthCalledWith(1, "g-aa");
		expect(mockFetchSettlements).toHaveBeenNthCalledWith(2, "g-bb");
	});

	it("送信対象が MAX_LINE_GROUP_PER_REMIND_RUN（テストでは 2）に達したら打ち切る", async () => {
		mockOrderBy.mockResolvedValue([
			{ lineGroupId: "g1" },
			{ lineGroupId: "g2" },
			{ lineGroupId: "g3" },
		]);
		const row = {
			fromUserId: "a",
			fromUserName: "A",
			toUserId: "b",
			toUserName: "B",
			amount: 100,
		};
		mockFetchSettlements.mockResolvedValue([row]);

		await sendSettlementsRemind();

		expect(mockFetchSettlements).toHaveBeenCalledTimes(2);
		expect(mockFetchSettlements).toHaveBeenNthCalledWith(1, "g1");
		expect(mockFetchSettlements).toHaveBeenNthCalledWith(2, "g2");
	});
});
