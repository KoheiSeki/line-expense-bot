import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchExpenseList } from "./expense-list.server.service";

const { mockFetchExpensesByLineGroupId, mockFetchGroupMembers } = vi.hoisted(
	() => ({
		mockFetchExpensesByLineGroupId: vi.fn(),
		mockFetchGroupMembers: vi.fn(),
	}),
);

vi.mock("./expense.server.service", () => ({
	fetchExpensesByLineGroupId: mockFetchExpensesByLineGroupId,
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

const validGroupId = "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

const sampleExpense = {
	expenseId: 1,
	lineGroupId: validGroupId,
	payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	title: "ランチ",
	amount: 1200,
	paidAt: new Date("2026-06-01T12:00:00"),
	createdAt: new Date("2026-06-02T00:00:00.000Z"),
};

describe("fetchExpenseList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchGroupMembers.mockResolvedValue([
			{
				lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				displayName: "支払太郎",
				pictureUrl: undefined,
			},
		]);
		mockFetchExpensesByLineGroupId.mockResolvedValue([sampleExpense]);
	});

	it("lineGroupIdが空の場合はApiErrorを投げ、支出取得を呼ばない", async () => {
		await expect(fetchExpenseList("")).rejects.toMatchObject({
			status: 400,
			message: "グループIDの取得に失敗しました",
		});
		expect(mockFetchExpensesByLineGroupId).not.toHaveBeenCalled();
		expect(mockFetchGroupMembers).not.toHaveBeenCalled();
	});

	it("lineGroupIdが50文字を超える場合はApiErrorを投げ、支出取得を呼ばない", async () => {
		await expect(fetchExpenseList("a".repeat(51))).rejects.toMatchObject({
			status: 400,
			message: "グループIDの形式が不正です",
		});
		expect(mockFetchExpensesByLineGroupId).not.toHaveBeenCalled();
	});

	it("fetchExpensesByLineGroupIdとfetchGroupMembersを呼び、ExpenseListResultを返す", async () => {
		const result = await fetchExpenseList(validGroupId);

		expect(mockFetchExpensesByLineGroupId).toHaveBeenCalledExactlyOnceWith(
			validGroupId,
		);
		expect(mockFetchGroupMembers).toHaveBeenCalledExactlyOnceWith(validGroupId);
		expect(result).toEqual([
			{
				expenseId: 1,
				payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				payerUserName: "支払太郎",
				title: "ランチ",
				amount: 1200,
				paidAt: sampleExpense.paidAt,
				createdAt: sampleExpense.createdAt,
			},
		]);
	});

	it("支払者がグループメンバーにいない場合はpayerUserNameが未設定", async () => {
		mockFetchExpensesByLineGroupId.mockResolvedValueOnce([
			{
				...sampleExpense,
				expenseId: 2,
				payerUserId: "Uyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
			},
		]);

		const result = await fetchExpenseList(validGroupId);

		expect(result[0].payerUserName).toBe("未設定");
	});

	it("支出が0件の場合は空配列を返す", async () => {
		mockFetchExpensesByLineGroupId.mockResolvedValueOnce([]);

		const result = await fetchExpenseList(validGroupId);

		expect(result).toEqual([]);
		expect(mockFetchGroupMembers).toHaveBeenCalledOnce();
	});
});
