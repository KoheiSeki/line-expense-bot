import { beforeEach, describe, expect, it, vi } from "vitest";
import * as settlementsServerService from "./settlements.server.service";
import { DbTransaction } from "@/lib/db/client";
import { ApiError } from "@/lib/api/error";

const { mockDbExecute } = vi.hoisted(() => ({
	mockDbExecute: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
	db: {
		execute: mockDbExecute,
	},
}));

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
