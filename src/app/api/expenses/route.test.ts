import { ApiError } from "@/lib/api/error";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockEditExpense, mockDeleteExpense } = vi.hoisted(() => ({
	mockEditExpense: vi.fn().mockResolvedValue(undefined),
	mockDeleteExpense: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/expenses/service/edit-expense.server.service", () => ({
	editExpense: mockEditExpense,
}));

vi.mock("@/features/expenses/service/delete-expense.server.service", () => ({
	deleteExpense: mockDeleteExpense,
}));

import { DELETE, PUT } from "./route";

const validBody = {
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

function makePutRequest(body: unknown): NextRequest {
	return new NextRequest("http://localhost/api/expenses", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function makeDeleteRequest(body: unknown): NextRequest {
	return new NextRequest("http://localhost/api/expenses", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("PUT /api/expenses", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockEditExpense.mockResolvedValue(undefined);
	});

	it("editExpense が成功すると 200 とメッセージを返し、ボディを渡す", async () => {
		const req = makePutRequest(validBody);
		const res = await PUT(req);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "支出を編集しました" });
		expect(mockEditExpense).toHaveBeenCalledExactlyOnceWith(validBody);
	});

	it("editExpense が ApiError のときは同じステータスと message を返す", async () => {
		mockEditExpense.mockRejectedValueOnce(
			new ApiError(404, "支出の編集に失敗しました"),
		);
		const req = makePutRequest(validBody);
		const res = await PUT(req);

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			message: "支出の編集に失敗しました",
		});
	});

	it("editExpense が ApiError 以外を投げたときは 500 を返す", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockEditExpense.mockRejectedValueOnce(new Error("db failure"));
		const req = makePutRequest(validBody);
		const res = await PUT(req);

		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ message: "Internal Server Error" });
		consoleSpy.mockRestore();
	});
});

const validDeleteBody = {
	expenseId: 1,
	lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
};

describe("DELETE /api/expenses", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDeleteExpense.mockResolvedValue(undefined);
	});

	it("deleteExpense が成功すると 200 とメッセージを返し、ボディを渡す", async () => {
		const req = makeDeleteRequest(validDeleteBody);
		const res = await DELETE(req);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ message: "支出を削除しました" });
		expect(mockDeleteExpense).toHaveBeenCalledExactlyOnceWith(validDeleteBody);
	});

	it("deleteExpense が ApiError のときは同じステータスと message を返す", async () => {
		mockDeleteExpense.mockRejectedValueOnce(
			new ApiError(404, "支出の削除に失敗しました"),
		);
		const req = makeDeleteRequest(validDeleteBody);
		const res = await DELETE(req);

		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({
			message: "支出の削除に失敗しました",
		});
	});
});
