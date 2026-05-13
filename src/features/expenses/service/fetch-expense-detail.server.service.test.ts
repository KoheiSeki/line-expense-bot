import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchExpenseDetail } from "./expense.server.service";

const { mockExecute } = vi.hoisted(() => ({
	mockExecute: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
	db: {
		execute: mockExecute,
	},
}));

const groupId = "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

describe("fetchExpenseDetail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("SQL結果が2行のとき参加者が2人のEditExpenseを返す", async () => {
		const rowBase = {
			expenseId: 1,
			lineGroupId: groupId,
			payerUserId: "U1111111111111111111111111111111",
			payerDisplayName: "太郎",
			payerPictureUrl: undefined as string | undefined,
			title: "ランチ",
			amount: 1500,
			paidAt: "2026-01-01",
		};
		mockExecute.mockResolvedValue([
			{
				...rowBase,
				participantUserId: "U1111111111111111111111111111111",
				participantDisplayName: "太郎",
				participantPictureUrl: undefined,
				shareAmount: 1000,
			},
			{
				...rowBase,
				participantUserId: "U2222222222222222222222222222222",
				participantDisplayName: "次郎",
				participantPictureUrl: undefined,
				shareAmount: 500,
			},
		]);

		const result = await fetchExpenseDetail(1, groupId);

		expect(result.expenseId).toBe(1);
		expect(result.lineGroupId).toBe(groupId);
		expect(result.title).toBe("ランチ");
		expect(result.amount).toBe("1500");
		expect(result.payerDisplayName).toBe("太郎");
		expect(result.expenseParticipants).toHaveLength(2);
		expect(result.expenseParticipants[0]).toMatchObject({
			lineUserId: "U1111111111111111111111111111111",
			displayName: "太郎",
			shareAmount: "1000",
		});
		expect(result.expenseParticipants[1]).toMatchObject({
			lineUserId: "U2222222222222222222222222222222",
			displayName: "次郎",
			shareAmount: "500",
		});
		expect(mockExecute).toHaveBeenCalledOnce();
	});

	it("結果が0行のとき404のApiErrorを投げる", async () => {
		mockExecute.mockResolvedValue([]);
		await expect(fetchExpenseDetail(999, groupId)).rejects.toMatchObject({
			status: 404,
			message: "支出が見つかりません",
		});
	});
});
