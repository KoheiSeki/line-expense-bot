import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateExpenseReq } from "../types/expense.types";
import { createExpense } from "./expense.server.service";

const {
	mockReturning,
	mockValues,
	mockInsert,
	mockTxTransaction,
	mockPushMessage,
	mockIsGroupExpenseManagementClosed,
} = vi.hoisted(() => {
	const mockReturning = vi.fn().mockReturnValue([{ expenseId: 1 }]);
	const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
	const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
	const mockTx = { insert: mockInsert };
	const mockTxTransaction = vi
		.fn()
		.mockImplementation(async (cb) => await cb(mockTx));
	const mockPushMessage = vi.fn().mockResolvedValue(undefined);
	const mockIsGroupExpenseManagementClosed = vi.fn().mockResolvedValue(false);
	return {
		mockReturning,
		mockValues,
		mockInsert,
		mockTx,
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

/** 正常なリクエスト */
const validRequest: CreateExpenseReq = {
	lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	title: "ランチ",
	amount: "1000",
	paidAt: "2026-01-15",
	expenseParticipants: [
		{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", shareAmount: "1000" },
	],
};

/** 正常トランザクションのモック */
function setupDbMockForSuccessfulTransaction() {
	mockValues
		.mockReturnValueOnce({ returning: mockReturning })
		.mockReturnValueOnce(Promise.resolve());
}

describe("createExpense", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsGroupExpenseManagementClosed.mockResolvedValue(false);
		mockReturning.mockResolvedValue([{ expenseId: 1 }]);
		setupDbMockForSuccessfulTransaction();
	});

	it("有効なリクエストでトランザクションが1回実行される", async () => {
		await createExpense(validRequest);
		expect(mockTxTransaction).toHaveBeenCalledOnce();
	});

	it("トランザクション内でinsertが2回呼ばれる", async () => {
		await createExpense(validRequest);
		expect(mockInsert).toHaveBeenCalledTimes(2);
	});

	it("成功後にpushMessageが1回呼ばれ、toにlineGroupIdが渡される", async () => {
		await createExpense(validRequest);
		expect(mockPushMessage).toHaveBeenCalledOnce();
		expect(mockPushMessage).toHaveBeenCalledWith(
			expect.objectContaining({ to: validRequest.lineGroupId }),
		);
	});

	it("通知テキストにタイトルと金額が含まれる", async () => {
		await createExpense(validRequest);
		const payload = mockPushMessage.mock.calls[0][0];
		const text = payload.messages[0].text;
		expect(text).toContain(
			`📝 ${validRequest.title} ¥${Number(validRequest.amount).toLocaleString("ja-JP")} を登録しました`,
		);
	});

	it("lineGroupIdが空の場合はApiErrorを投げ、insertとLINEを呼ばない", async () => {
		await expect(
			createExpense({ ...validRequest, lineGroupId: "" }),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの取得に失敗しました",
		});
		expect(mockTxTransaction).toHaveBeenCalledOnce();
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("lineGroupIdが50文字を超える場合はApiErrorを投げ、insertとLINEを呼ばない", async () => {
		await expect(
			createExpense({ ...validRequest, lineGroupId: "a".repeat(51) }),
		).rejects.toMatchObject({
			status: 400,
			message: "グループIDの形式が不正です",
		});
		expect(mockTxTransaction).toHaveBeenCalledOnce();
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("グループの支出追加が締め切られている場合はApiErrorを投げ、insertとLINEを呼ばない", async () => {
		mockIsGroupExpenseManagementClosed.mockResolvedValueOnce(true);
		await expect(createExpense(validRequest)).rejects.toMatchObject({
			status: 400,
			message: "グループの支出追加が締め切られています",
		});
		expect(mockIsGroupExpenseManagementClosed).toHaveBeenCalledOnce();
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockPushMessage).not.toHaveBeenCalled();
	});

	it("db.transactionが失敗した場合はpushMessageを呼ばない", async () => {
		mockTxTransaction.mockRejectedValueOnce(new Error("db error"));
		await expect(createExpense(validRequest)).rejects.toThrow("db error");
		expect(mockPushMessage).not.toHaveBeenCalled();
	});
});
