import type liff from "@line/liff";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EditExpense } from "../types/edit-expense.types";
import { useEditExpenseForm } from "./use-edit-expense-form";

const { mockEditExpenseRequest } = vi.hoisted(() => ({
	mockEditExpenseRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../service/expense.client.service", () => ({
	editExpenseRequest: mockEditExpenseRequest,
}));

const baseExpense: EditExpense = {
	expenseId: 42,
	lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	payerDisplayName: "太郎",
	payerPictureUrl: undefined,
	title: "ランチ",
	amount: "1000",
	paidAt: "2026-01-15",
	expenseParticipants: [
		{
			lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			displayName: "太郎",
			pictureUrl: undefined,
			shareAmount: "1000",
		},
	],
};

describe("useEditExpenseForm", () => {
	const mockCloseWindow = vi.fn();
	const mockLiff = { closeWindow: mockCloseWindow } as unknown as typeof liff;

	beforeEach(() => {
		vi.clearAllMocks();
		mockEditExpenseRequest.mockResolvedValue(undefined);
	});

	it("送信が成功すると editExpenseRequest に expenseId と lineGroupId を含めて呼び、closeWindow する", async () => {
		const { result } = renderHook(() =>
			useEditExpenseForm({ expense: baseExpense, liff: mockLiff }),
		);

		await act(async () => {
			result.current.handleSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		await waitFor(() => {
			expect(mockEditExpenseRequest).toHaveBeenCalledOnce();
		});

		expect(mockEditExpenseRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				expenseId: 42,
				lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				title: "ランチ",
				amount: "1000",
				paidAt: "2026-01-15",
			}),
		);
		expect(mockCloseWindow).toHaveBeenCalledOnce();
	});

	it("タイトルを空にして送信するとバリデーションエラーになり API を呼ばない", async () => {
		const { result } = renderHook(() =>
			useEditExpenseForm({ expense: baseExpense, liff: mockLiff }),
		);

		act(() => {
			result.current.setTitle("");
		});

		await act(async () => {
			result.current.handleSubmit({
				preventDefault: vi.fn(),
			} as unknown as React.FormEvent);
		});

		await waitFor(() => {
			expect(result.current.error).toBeTruthy();
		});
		expect(mockEditExpenseRequest).not.toHaveBeenCalled();
		expect(mockCloseWindow).not.toHaveBeenCalled();
	});
});
