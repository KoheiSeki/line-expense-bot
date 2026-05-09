import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import {
	completeAllUserSettlement,
	completeUserSettlement,
} from "./settlements-progress.server.service";

const {
	mockTx,
	mockInsert,
	mockValues,
	mockOnConflictDoUpdate,
	mockTxTransaction,
	mockFetchGreedySettlements,
} = vi.hoisted(() => {
	const mockOnConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
	const mockValues = vi.fn().mockReturnValue({
		onConflictDoUpdate: mockOnConflictDoUpdate,
	});
	const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
	const mockTx = { insert: mockInsert };
	const mockTxTransaction = vi
		.fn()
		.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) => {
			await cb(mockTx);
		});
	const mockFetchGreedySettlements = vi.fn();
	return {
		mockTx,
		mockInsert,
		mockValues,
		mockOnConflictDoUpdate,
		mockTxTransaction,
		mockFetchGreedySettlements,
	};
});

vi.mock("@/lib/db/client", () => ({
	db: {
		transaction: mockTxTransaction,
	},
}));

vi.mock("./settlements.server.service", () => ({
	fetchGreedySettlements: mockFetchGreedySettlements,
}));

const lineGroupId = "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const lineUserId = "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const otherUserId = "Uyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy";

describe("completeUserSettlement", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOnConflictDoUpdate.mockResolvedValue(undefined);
		mockFetchGreedySettlements.mockResolvedValue([
			{ fromUserId: lineUserId, toUserId: otherUserId, amount: 1000 },
		]);
	});

	it("トランザクション内でfetchGreedySettlementsがlineGroupIdとtxで呼ばれる", async () => {
		await completeUserSettlement(lineUserId, lineGroupId);

		expect(mockTxTransaction).toHaveBeenCalledOnce();
		expect(mockFetchGreedySettlements).toHaveBeenCalledWith(
			lineGroupId,
			mockTx,
		);
	});

	it("該当ユーザーが送金元の精算のみupsertされる", async () => {
		await completeUserSettlement(lineUserId, lineGroupId);

		expect(mockInsert).toHaveBeenCalledOnce();
		expect(mockValues).toHaveBeenCalledOnce();
		expect(mockValues.mock.calls[0][0]).toEqual([
			expect.objectContaining({
				lineGroupId,
				fromUserId: lineUserId,
				toUserId: otherUserId,
				settledAmount: 1000,
			}),
		]);
		expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
	});

	it("同一ユーザーがfromの精算が複数ある場合はすべてupsertされる", async () => {
		mockFetchGreedySettlements.mockResolvedValue([
			{ fromUserId: lineUserId, toUserId: otherUserId, amount: 500 },
			{ fromUserId: lineUserId, toUserId: otherUserId, amount: 300 },
		]);

		await completeUserSettlement(lineUserId, lineGroupId);

		expect(mockValues.mock.calls[0][0]).toHaveLength(2);
	});

	it("該当ユーザーが送金元の精算がない場合はApiErrorを投げinsertしない", async () => {
		mockFetchGreedySettlements.mockResolvedValue([
			{ fromUserId: otherUserId, toUserId: lineUserId, amount: 1000 },
		]);

		await expect(
			completeUserSettlement(lineUserId, lineGroupId),
		).rejects.toMatchObject({
			status: 400,
			message: "精算内容が存在しません",
		});
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it("精算配列が空の場合はApiErrorを投げinsertしない", async () => {
		mockFetchGreedySettlements.mockResolvedValue([]);

		await expect(
			completeUserSettlement(lineUserId, lineGroupId),
		).rejects.toMatchObject({
			status: 400,
			message: "精算内容が存在しません",
		});
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it("fetchGreedySettlementsが失敗した場合は例外を伝播しinsertしない", async () => {
		mockFetchGreedySettlements.mockRejectedValueOnce(
			new ApiError(400, "グループIDの取得に失敗しました"),
		);

		await expect(
			completeUserSettlement(lineUserId, lineGroupId),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの取得に失敗しました",
		});
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it("db.transactionが失敗した場合はfetchが呼ばれない", async () => {
		mockTxTransaction.mockRejectedValueOnce(new Error("db error"));

		await expect(
			completeUserSettlement(lineUserId, lineGroupId),
		).rejects.toThrow("db error");
		expect(mockFetchGreedySettlements).not.toHaveBeenCalled();
	});
});

describe("completeAllUserSettlement", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOnConflictDoUpdate.mockResolvedValue(undefined);
		mockFetchGreedySettlements.mockResolvedValue([
			{ fromUserId: lineUserId, toUserId: otherUserId, amount: 1000 },
		]);
	});

	it("精算が存在する場合は全件をupsertする", async () => {
		const settlements = [
			{ fromUserId: lineUserId, toUserId: otherUserId, amount: 1000 },
			{ fromUserId: otherUserId, toUserId: lineUserId, amount: 500 },
		];
		mockFetchGreedySettlements.mockResolvedValue(settlements);

		await completeAllUserSettlement(lineGroupId);

		expect(mockTxTransaction).toHaveBeenCalledOnce();
		expect(mockFetchGreedySettlements).toHaveBeenCalledWith(
			lineGroupId,
			mockTx,
		);
		expect(mockValues.mock.calls[0][0]).toHaveLength(2);
		expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
	});

	it("精算配列が空の場合はApiErrorを投げinsertしない", async () => {
		mockFetchGreedySettlements.mockResolvedValue([]);

		await expect(completeAllUserSettlement(lineGroupId)).rejects.toMatchObject(
			{
				status: 400,
				message: "精算内容が存在しません",
			},
		);
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it("fetchGreedySettlementsが失敗した場合は例外を伝播しinsertしない", async () => {
		mockFetchGreedySettlements.mockRejectedValueOnce(
			new ApiError(400, "精算内容が存在しません"),
		);

		await expect(completeAllUserSettlement(lineGroupId)).rejects.toMatchObject(
			{
				status: 400,
				message: "精算内容が存在しません",
			},
		);
		expect(mockInsert).not.toHaveBeenCalled();
	});
});
