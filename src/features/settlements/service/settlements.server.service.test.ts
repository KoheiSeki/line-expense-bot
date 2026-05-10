import { beforeEach, describe, expect, it, vi } from "vitest";
import * as settlementsServerService from "./settlements.server.service";
import { DbTransaction } from "@/lib/db/client";
import { ApiError } from "@/lib/api/error";

const { mockDbExecute, mockFetchSettlementProgress, mockFetchGroupMembers } =
	vi.hoisted(() => ({
		mockDbExecute: vi.fn(),
		mockFetchSettlementProgress: vi.fn(),
		mockFetchGroupMembers: vi.fn(),
	}));

vi.mock("@/lib/db/client", () => ({
	db: {
		execute: mockDbExecute,
	},
}));

vi.mock("./settlements-progress.server.service", () => ({
	fetchSettlementProgress: mockFetchSettlementProgress,
}));

vi.mock("@/features/group-members/service/group-members.server.service", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("@/features/group-members/service/group-members.server.service")
		>();
	return {
		...actual,
		fetchGroupMembers: mockFetchGroupMembers,
	};
});

const validGroupId = "testGroupId";

/**
 * `fetchGreedySettlements` と `fetchUserBalances` は同一モジュール内のため、
 * `import * as svc` + `vi.spyOn(svc, "fetchUserBalances")` では
 * 内部呼び出しが記録されない（Vitest + Vite ESM で確認済み）。
 * 引数・実行経路は `db.execute` / `tx.execute` のモックで間接的に検証する。
 */
describe("fetchGreedySettlements", () => {
	beforeEach(() => {
		mockDbExecute.mockClear();
	});

	it("lineGroupIdが空の場合はApiErrorを投げる", async () => {
		await expect(
			settlementsServerService.fetchGreedySettlements(""),
		).rejects.toThrow(ApiError);
		await expect(
			settlementsServerService.fetchGreedySettlements(""),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの取得に失敗しました",
		});
		expect(mockDbExecute).not.toHaveBeenCalled();
	});

	it("lineGroupIdが50文字を超える場合はApiErrorを投げる", async () => {
		await expect(
			settlementsServerService.fetchGreedySettlements("a".repeat(51)),
		).rejects.toThrow(ApiError);
		await expect(
			settlementsServerService.fetchGreedySettlements("a".repeat(51)),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの形式が不正です",
		});
		expect(mockDbExecute).not.toHaveBeenCalled();
	});

	it("残高取得後に貪欲法の結果を返す", async () => {
		mockDbExecute.mockResolvedValue([
			{
				lineUserId: "user1",
				netBalance: 1000,
			},
			{
				lineUserId: "user2",
				netBalance: -1000,
			},
		]);

		const result =
			await settlementsServerService.fetchGreedySettlements(validGroupId);

		expect(mockDbExecute).toHaveBeenCalledOnce();
		expect(result).toEqual([
			{
				fromUserId: "user2",
				toUserId: "user1",
				amount: 1000,
			},
		]);
	});

	it("残高が空の場合は空配列を返す", async () => {
		mockDbExecute.mockResolvedValue([]);

		const result =
			await settlementsServerService.fetchGreedySettlements(validGroupId);

		expect(mockDbExecute).toHaveBeenCalledOnce();
		expect(result).toEqual([]);
	});

	it("第2引数txをfetchUserBalances経由でexecuteに渡す", async () => {
		const mockTxExecute = vi.fn().mockResolvedValue([]);
		const mockTx = { execute: mockTxExecute } as unknown as DbTransaction;

		await settlementsServerService.fetchGreedySettlements(validGroupId, mockTx);

		expect(mockTxExecute).toHaveBeenCalledOnce();
		expect(mockDbExecute).not.toHaveBeenCalled();
	});
});

describe("fetchSettlements", () => {
	const greedyPair = {
		fromUserId: "user2",
		toUserId: "user1",
		amount: 1000,
	};

	const membersForGreedyPair = [
		{
			lineUserId: "user2",
			displayName: "送金者",
			pictureUrl: undefined as string | undefined,
		},
		{
			lineUserId: "user1",
			displayName: "受取者",
			pictureUrl: undefined as string | undefined,
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
		mockDbExecute.mockResolvedValue([
			{ lineUserId: "user1", netBalance: 1000 },
			{ lineUserId: "user2", netBalance: -1000 },
		]);
		mockFetchSettlementProgress.mockResolvedValue([]);
		mockFetchGroupMembers.mockResolvedValue(membersForGreedyPair);
	});

	it("精算進捗が空のとき貪欲の金額がそのままSettlementResult.amountになる", async () => {
		const result =
			await settlementsServerService.fetchSettlements(validGroupId);

		expect(mockFetchSettlementProgress).toHaveBeenCalledOnce();
		expect(mockFetchSettlementProgress).toHaveBeenCalledWith(validGroupId);
		expect(mockFetchGroupMembers).toHaveBeenCalledWith(validGroupId);
		expect(result).toEqual([
			{
				fromUserId: "user2",
				fromUserName: "送金者",
				toUserId: "user1",
				toUserName: "受取者",
				amount: 1000,
			},
		]);
	});

	it("settledAmountが貪欲額より小さいとき残額が差し引かれる", async () => {
		mockFetchSettlementProgress.mockResolvedValue([
			{
				lineGroupId: validGroupId,
				fromUserId: greedyPair.fromUserId,
				toUserId: greedyPair.toUserId,
				settledAmount: 350,
				updatedAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		]);

		const result =
			await settlementsServerService.fetchSettlements(validGroupId);

		expect(result[0].amount).toBe(650);
	});

	it("settledAmountが貪欲額以上のときamountは0になる", async () => {
		mockFetchSettlementProgress.mockResolvedValue([
			{
				lineGroupId: validGroupId,
				fromUserId: greedyPair.fromUserId,
				toUserId: greedyPair.toUserId,
				settledAmount: 1000,
				updatedAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		]);

		const result =
			await settlementsServerService.fetchSettlements(validGroupId);

		expect(result[0].amount).toBe(0);
	});

	it("lineGroupIdが無効なときは貪欲のバリデーションで失敗し進捗取得を呼ばない", async () => {
		await expect(settlementsServerService.fetchSettlements("")).rejects.toMatchObject(
			{
				status: 400,
				message: "グループIDの取得に失敗しました",
			},
		);
		expect(mockFetchSettlementProgress).not.toHaveBeenCalled();
		expect(mockFetchGroupMembers).not.toHaveBeenCalled();
	});
});
