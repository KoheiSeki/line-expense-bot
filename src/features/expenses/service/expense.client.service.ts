import { apiClient } from "@/lib/api/client";
import { EditExpenseReq } from "../types/edit-expense.types";
import { CreateExpenseReq } from "../types/expense.types";

/**
 * 支出を登録する関数
 * @param data 支出登録データ
 */
export const createExpenseRequest = (data: CreateExpenseReq): Promise<void> => {
	return apiClient.post("/expenses", data);
};

/**
 * 支出を編集する関数
 * @param data 支出編集データ
 */
export const editExpenseRequest = (data: EditExpenseReq): Promise<void> => {
	return apiClient.put("/expenses", data);
};
