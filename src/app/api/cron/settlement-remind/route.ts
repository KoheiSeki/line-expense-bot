import { sendSettlementsRemind } from "@/features/settlements/service/settlements-remind.server.service";
import { apiHandler } from "@/lib/api/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * 精算リマインドメッセージを送信するAPI
 * @returns レスポンス
 */
export const GET = apiHandler(async (request: NextRequest) => {
	const authHeader = request.headers.get("Authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	await sendSettlementsRemind();

	return NextResponse.json(
		{
			message: "精算リマインドメッセージを送信しました",
		},
		{ status: 200 },
	);
});
