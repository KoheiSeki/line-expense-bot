import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DeleteExpenseReq } from "../types/delete-expense.types";
import { deleteExpense } from "./delete-expense.server.service";

const mockDeleteReturning = vi.fn();
const mockDeleteWhere = vi.fn().mockReturnValue({ returning: mockDeleteReturning });
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

const mockTx = {
	delete: mockDelete,
};

const {
	mockTxTransaction,
	mockPushMessage,
	mockIsGroupExpenseManagementClosed,
} = vi.hoisted(() => {
	const mockTxTransaction = vi
		.fn()
		.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) => {
			await cb(mockTx);
		});
	const mockPushMessage = vi.fn().mockResolvedValue(undefined);
	const mockIsGroupExpenseManagementClosed = vi.fn().mockResolvedValue(false);
	return {
		mockTxTransaction,
		mockPushMessage,
		mockIsGroupExpenseManagementClosed,
	};
});

vi.mock("@/lib/db/client", () => ({
	db: {
		transaction: mockTxTransaction,
	},
}));

vi.mock("@/lib/line/client", () => ({
	lineClient: {
		pushMessage: mockPushMessage,
	},
}));

vi.mock("@/features/expense-closure/service/expense-closure.server.service", () => ({
	isGroupExpenseManagementClosed: mockIsGroupExpenseManagementClosed,
}));

const validRequest: DeleteExpenseReq = {
	expenseId: 1,
	lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};

/** 1回目: 参加者削除、2回目: 支出削除 */
function setupSuccessfulDelete() {
	mockDeleteReturning.mockReset();
	mockDeleteReturning
		.mockResolvedValueOnce([{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }])
		.mockResolvedValueOnce([{ expenseId: 1 }]);
}

describe("deleteExpense", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsGroupExpenseManagementClosed.mockResolvedValue(false);
		setupSuccessfulDelete();
	});

	it("有効なリクエストでトランザクションが1回実行される", async () => {
		await deleteExpense(validRequest);
		expect(mockTxTransaction).toHaveBeenCalledOnce();
	});

	it("成功時はdeleteが2回呼ばれる（参加者→支出）", async () => {
		await deleteExpense(validRequest);
		expect(mockDelete).toHaveBeenCalledTimes(2);
	});

	it("成功後にpushMessageが1回呼ばれ、toにlineGroupIdと削除メッセージが渡される", async () => {
		await deleteExpense(validRequest);
		expect(mockPushMessage).toHaveBeenCalledOnce();
		expect(mockPushMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				to: validRequest.lineGroupId,
				messages: [
					expect.objectContaining({
						type: "text",
						text: "📝 支出を削除しました",
					}),
				],
			}),
		);
	});

	it("lineGroupIdが空の場合はApiErrorを投げ、deleteとLINEを呼ばない", async () => {
		await expect(
			deleteExpense({ ...validRequest, lineGroupId: "" }),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの取得に失敗しました",
		});
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("グループの支出削除が締め切られている場合はApiErrorを投げ、deleteとLINEを呼ばない", async () => {
		mockIsGroupExpenseManagementClosed.mockResolvedValueOnce(true);
		await expect(deleteExpense(validRequest)).rejects.toMatchObject({
			status: 400,
			message: "グループの支出削除が締め切られています",
		});
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("参加者deleteが0件の場合は404を投げ、2回目のdeleteを呼ばない", async () => {
		mockDeleteReturning.mockReset();
		mockDeleteReturning.mockResolvedValueOnce([]);
		await expect(deleteExpense(validRequest)).rejects.toMatchObject({
			status: 404,
			message: "支出参加者の削除に失敗しました",
		});
		expect(mockDelete).toHaveBeenCalledOnce();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("支出deleteが0件の場合は404を投げる", async () => {
		mockDeleteReturning.mockReset();
		mockDeleteReturning
			.mockResolvedValueOnce([{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }])
			.mockResolvedValueOnce([]);
		await expect(deleteExpense(validRequest)).rejects.toMatchObject({
			status: 404,
			message: "支出の削除に失敗しました",
		});
		expect(mockDelete).toHaveBeenCalledTimes(2);
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("db.transactionが失敗した場合はpushMessageを呼ばない", async () => {
		mockTxTransaction.mockRejectedValueOnce(new Error("db error"));
		await expect(deleteExpense(validRequest)).rejects.toThrow("db error");
		expect(mockPushMessage).not.toHaveBeenCalled();
	});
});
