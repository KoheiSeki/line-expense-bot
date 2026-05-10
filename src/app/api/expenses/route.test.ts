import { ApiError } from "@/lib/api/error";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockEditExpense } = vi.hoisted(() => ({
	mockEditExpense: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/expenses/service/edit-expense.server.service", () => ({
	editExpense: mockEditExpense,
}));

import { PUT } from "./route";

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
