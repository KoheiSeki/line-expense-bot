import { fetchSettlements } from "@/features/settlements/service/settlements.server.service";
import { DisplayCommandRes } from "@/features/settlements/types/settlements.types";
import { apiHandler } from "@/lib/api/api-handler";
import { ApiError } from "@/lib/api/error";
import { NextRequest, NextResponse } from "next/server";

/**
 * 精算結果を表示するAPI
 * @param req リクエスト
 * @returns レスポンス
 */
export const GET = apiHandler(
	async (req: NextRequest): Promise<NextResponse> => {
		const lineGroupId = req.nextUrl.searchParams.get("lineGroupId");
		if (!lineGroupId) throw new ApiError(400, "グループIDの取得に失敗しました");

		const results = await fetchSettlements(lineGroupId);

		const response: DisplayCommandRes = { results };

		return NextResponse.json(response, { status: 200 });
	},
);
