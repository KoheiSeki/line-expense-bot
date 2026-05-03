import { apiClient } from "@/lib/api/client";
import { CreateExpenseReq } from "../types/expense.types";

/**
 * 支出を登録する関数
 * @param data 支出登録データ
 */
export const createExpenseRequest = (data: CreateExpenseReq): Promise<void> => {
	return apiClient.post("/expenses", data);
};
