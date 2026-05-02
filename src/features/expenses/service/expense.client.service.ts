import { apiClient } from "@/lib/api/client";
import { CreateExpenseRequest } from "../types/expense.types";

/**
 * 支出を登録する関数
 * @param data 支出登録データ
 */
export const createExpenseRequest = (
	data: CreateExpenseRequest,
): Promise<void> => {
	return apiClient.post("/expenses", data);
};
