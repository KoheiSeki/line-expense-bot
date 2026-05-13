import { apiClient } from "@/lib/api/client";
import { DeleteExpenseReq } from "../types/delete-expense.types";
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

/**
 * 支出を削除する関数
 * @param data 支出削除パラメータ
 */
export const deleteExpenseRequest = (data: DeleteExpenseReq): Promise<void> => {
	return apiClient.delete("/expenses", { data });
};
