import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditExpenseReq } from "../types/edit-expense.types";
import { editExpense } from "./edit-expense.server.service";

const mockUpdateReturning = vi.fn();
const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning });
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

const mockDeleteReturning = vi.fn();
const mockDeleteWhere = vi.fn().mockReturnValue({ returning: mockDeleteReturning });
const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

const mockTx = {
	update: mockUpdate,
	delete: mockDelete,
	insert: mockInsert,
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

const validRequest: EditExpenseReq = {
	expenseId: 1,
	lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	title: "ランチ",
	amount: "1000",
	paidAt: "2026-01-15",
	expenseParticipants: [
		{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", shareAmount: "1000" },
	],
};

function setupSuccessfulDb() {
	mockUpdateReturning.mockResolvedValue([{ expenseId: 1 }]);
	mockDeleteReturning.mockResolvedValue([{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }]);
	mockInsertReturning.mockResolvedValue([{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }]);
}

describe("editExpense", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsGroupExpenseManagementClosed.mockResolvedValue(false);
		setupSuccessfulDb();
	});

	it("有効なリクエストでトランザクションが1回実行される", async () => {
		await editExpense(validRequest);
		expect(mockTxTransaction).toHaveBeenCalledOnce();
	});

	it("成功時はupdate・delete・insertがそれぞれ1回呼ばれる", async () => {
		await editExpense(validRequest);
		expect(mockUpdate).toHaveBeenCalledOnce();
		expect(mockDelete).toHaveBeenCalledOnce();
		expect(mockInsert).toHaveBeenCalledOnce();
	});

	it("成功後にpushMessageが1回呼ばれ、toにlineGroupIdが渡される", async () => {
		await editExpense(validRequest);
		expect(mockPushMessage).toHaveBeenCalledOnce();
		expect(mockPushMessage).toHaveBeenCalledWith(
			expect.objectContaining({ to: validRequest.lineGroupId }),
		);
	});

	it("通知テキストにタイトルと金額と「編集しました」が含まれる", async () => {
		await editExpense(validRequest);
		const payload = mockPushMessage.mock.calls[0][0];
		const text = payload.messages[0].text;
		expect(text).toContain(
			`📝 ${validRequest.title} ¥${Number(validRequest.amount).toLocaleString("ja-JP")} を編集しました`,
		);
	});

	it("グループの支出編集が締め切られている場合はApiErrorを投げ、DB更新とLINEを呼ばない", async () => {
		mockIsGroupExpenseManagementClosed.mockResolvedValueOnce(true);
		await expect(editExpense(validRequest)).rejects.toMatchObject({
			status: 400,
			message: "グループの支出編集が締め切られています",
		});
		expect(mockUpdate).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("lineGroupIdが空の場合はApiErrorを投げ、updateとLINEを呼ばない", async () => {
		await expect(
			editExpense({ ...validRequest, lineGroupId: "" }),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの取得に失敗しました",
		});
		expect(mockUpdate).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("負担合計が金額と一致しない場合はApiErrorを投げ、updateを呼ばない", async () => {
		await expect(
			editExpense({
				...validRequest,
				expenseParticipants: [
					{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", shareAmount: "500" },
				],
			}),
		).rejects.toMatchObject({
			status: 400,
			message: "負担金額の合計が合計金額と一致しません",
		});
		expect(mockUpdate).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("支出のupdateが0件の場合は404を投げ、insertまで進まない", async () => {
		mockUpdateReturning.mockResolvedValueOnce([]);
		await expect(editExpense(validRequest)).rejects.toMatchObject({
			status: 404,
			message: "支出の編集に失敗しました",
		});
		expect(mockDelete).not.toHaveBeenCalled();
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("参加者deleteが0件の場合は404を投げ、insertを呼ばない", async () => {
		mockDeleteReturning.mockResolvedValueOnce([]);
		await expect(editExpense(validRequest)).rejects.toMatchObject({
			status: 404,
			message: "支出参加者が見つかりません",
		});
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("参加者insertのreturningが空の場合は500を投げる", async () => {
		mockInsertReturning.mockResolvedValueOnce([]);
		await expect(editExpense(validRequest)).rejects.toMatchObject({
			status: 500,
			message: "支出参加者の追加に失敗しました",
		});
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("db.transactionが失敗した場合はpushMessageを呼ばない", async () => {
		mockTxTransaction.mockRejectedValueOnce(new Error("db error"));
		await expect(editExpense(validRequest)).rejects.toThrow("db error");
		expect(mockPushMessage).not.toHaveBeenCalled();
	});
});
