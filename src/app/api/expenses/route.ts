import { createExpense } from "@/features/expenses/service/expense.server.service";
import { CreateExpenseRequest } from "@/features/expenses/types/expense.types";
import { apiHandler } from "@/lib/api/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * 支出を登録するAPI
 */
export const POST = apiHandler(
	async (req: NextRequest): Promise<NextResponse> => {
		const body: CreateExpenseRequest = await req.json();

		await createExpense(body);

		return NextResponse.json(
			{ message: "支出を登録しました" },
			{ status: 200 },
		);
	},
);
