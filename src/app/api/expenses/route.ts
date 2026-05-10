import { editExpense } from "@/features/expenses/service/edit-expense.server.service";
import { createExpense } from "@/features/expenses/service/expense.server.service";
import { EditExpenseReq } from "@/features/expenses/types/edit-expense.types";
import { CreateExpenseReq } from "@/features/expenses/types/expense.types";
import { apiHandler } from "@/lib/api/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * 支出を登録するAPI
 * @param req リクエスト
 * @returns レスポンス
 */
export const POST = apiHandler(
	async (req: NextRequest): Promise<NextResponse> => {
		const body: CreateExpenseReq = await req.json();

		await createExpense(body);

		return NextResponse.json(
			{ message: "支出を登録しました" },
			{ status: 200 },
		);
	},
);

/**
 * 支出を編集するAPI
 * @param req リクエスト
 * @returns レスポンス
 */
export const PUT = apiHandler(
	async (req: NextRequest): Promise<NextResponse> => {
		const body: EditExpenseReq = await req.json();

		await editExpense(body);

		return NextResponse.json(
			{ message: "支出を編集しました" },
			{ status: 200 },
		);
	},
);
