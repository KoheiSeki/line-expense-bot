import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createExpenseRequest,
	deleteExpenseRequest,
	editExpenseRequest,
} from "./expense.client.service";

const { mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
	mockPost: vi.fn().mockResolvedValue({ data: {} }),
	mockPut: vi.fn().mockResolvedValue({ data: {} }),
	mockDelete: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("@/lib/api/client", () => ({
	apiClient: {
		post: mockPost,
		put: mockPut,
		delete: mockDelete,
	},
}));

describe("expense.client.service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("editExpenseRequest", () => {
		it("PUT /expenses にボディを渡す", async () => {
			const body = {
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
			await editExpenseRequest(body);
			expect(mockPut).toHaveBeenCalledExactlyOnceWith("/expenses", body);
		});
	});

	describe("deleteExpenseRequest", () => {
		it("DELETE /expenses に data オプションでボディを渡す", async () => {
			const body = {
				expenseId: 1,
				lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
			};
			await deleteExpenseRequest(body);
			expect(mockDelete).toHaveBeenCalledExactlyOnceWith("/expenses", { data: body });
		});
	});

	describe("createExpenseRequest", () => {
		it("POST /expenses にボディを渡す", async () => {
			const body = {
				lineGroupId: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				payerUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
				title: "ランチ",
				amount: "1000",
				paidAt: "2026-01-15",
				expenseParticipants: [
					{ lineUserId: "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", shareAmount: "1000" },
				],
			};
			await createExpenseRequest(body);
			expect(mockPost).toHaveBeenCalledExactlyOnceWith("/expenses", body);
		});
	});
});
