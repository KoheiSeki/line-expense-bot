import { describe, it, expect } from "vitest";
import { calculateSettlements } from "./settlements.utils";
import { UserBalance } from "../types/settlements.types";

describe("calculateSettlements", () => {
	it("支出が存在しない場合は空配列を返す", () => {
		expect(calculateSettlements([])).toEqual([]);
	});

	it("残高がすべて0の場合は空配列を返す", () => {
		expect(
			calculateSettlements([
				{ lineUserId: "user1", netBalance: 0 },
				{ lineUserId: "user2", netBalance: 0 },
			]),
		).toEqual([]);
	});

	it("2人の場合に正しく精算ペアを返す", () => {
		const balances: UserBalance[] = [
			{ lineUserId: "user1", netBalance: 1000 },
			{ lineUserId: "user2", netBalance: -1000 },
		];

		expect(calculateSettlements(balances)).toEqual([
			{
				fromUserId: "user2",
				toUserId: "user1",
				amount: 1000,
			},
		]);
	});

	it("3人の場合に最小ペア数で精算できる", () => {
		const balances: UserBalance[] = [
			{ lineUserId: "user1", netBalance: 1000 },
			{ lineUserId: "user2", netBalance: -300 },
			{ lineUserId: "user3", netBalance: -700 },
		];

		const result = calculateSettlements(balances);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			fromUserId: "user2",
			toUserId: "user1",
			amount: 300,
		});
		expect(result).toContainEqual({
			fromUserId: "user3",
			toUserId: "user1",
			amount: 700,
		});
	});

	it("複数の債権者がいる場合に正しく精算できる", () => {
		const balances: UserBalance[] = [
			{ lineUserId: "A", netBalance: 800 },
			{ lineUserId: "B", netBalance: 200 },
			{ lineUserId: "C", netBalance: -1000 },
		];

		const result = calculateSettlements(balances);
		// C → A: 800, C → B: 200
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			fromUserId: "C",
			toUserId: "A",
			amount: 800,
		});
		expect(result).toContainEqual({
			fromUserId: "C",
			toUserId: "B",
			amount: 200,
		});
	});

	it("均等割りの場合に正しく精算できる", () => {
		const balances: UserBalance[] = [
			{ lineUserId: "A", netBalance: 2000 },
			{ lineUserId: "B", netBalance: -1000 },
			{ lineUserId: "C", netBalance: -1000 },
		];
		// B → A: 1000, C → A: 1000
		const result = calculateSettlements(balances);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			fromUserId: "B",
			toUserId: "A",
			amount: 1000,
		});
		expect(result).toContainEqual({
			fromUserId: "C",
			toUserId: "A",
			amount: 1000,
		});
	});

	it("1人が複数の債権者に分割して支払う場合", () => {
		// A が一人で B と C に借りている
		const balances: UserBalance[] = [
			{ lineUserId: "A", netBalance: -500 }, // 債務者
			{ lineUserId: "B", netBalance: 300 }, // 債権者1
			{ lineUserId: "C", netBalance: 200 }, // 債権者2
		];
		const result = calculateSettlements(balances);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			fromUserId: "A",
			toUserId: "B",
			amount: 300,
		});
		expect(result).toContainEqual({
			fromUserId: "A",
			toUserId: "C",
			amount: 200,
		});
	});

	it("複数の債権者と債務者が混在する場合", () => {
		const balances: UserBalance[] = [
			{ lineUserId: "A", netBalance: 800 }, // 債権者
			{ lineUserId: "B", netBalance: 200 }, // 債権者
			{ lineUserId: "C", netBalance: -600 }, // 債務者
			{ lineUserId: "D", netBalance: -400 }, // 債務者
		];
		// 貪欲法: C→A:600, D→A:200, D→B:200
		const result = calculateSettlements(balances);
		expect(result).toHaveLength(3);
		expect(result).toContainEqual({
			fromUserId: "C",
			toUserId: "A",
			amount: 600,
		});
		expect(result).toContainEqual({
			fromUserId: "D",
			toUserId: "A",
			amount: 200,
		});
		expect(result).toContainEqual({
			fromUserId: "D",
			toUserId: "B",
			amount: 200,
		});
	});
});
