import { registerGroupMember } from "@/features/group-members/service/group-members.server.service";
import { RegisterGroupMemberReq } from "@/features/group-members/types/group-members.types";
import { apiHandler } from "@/lib/api/api-handler";
import { NextRequest, NextResponse } from "next/server";

/**
 * グループに参加するAPI
 */
export const POST = apiHandler(
	async (req: NextRequest): Promise<NextResponse> => {
		const body: RegisterGroupMemberReq = await req.json();

		await registerGroupMember(body);

		return NextResponse.json(
			{ message: "グループに参加しました" },
			{ status: 200 },
		);
	},
);
