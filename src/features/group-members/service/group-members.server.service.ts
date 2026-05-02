import { Member } from "@/features/expenses/types/expense.types";
import { db } from "@/lib/db/client";
import { groupMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * グループメンバーを取得する関数
 * @param groupId グループID
 * @returns グループメンバー
 */
export const fetchGroupMembers = async (groupId: string): Promise<Member[]> => {
	const members: Member[] = await db
		.select()
		.from(groupMembers)
		.where(eq(groupMembers.lineGroupId, groupId))
		.then((rows) =>
			rows.map((row) => ({
				lineUserId: row.lineUserId,
				displayName: row.displayName,
				pictureUrl: row.pictureUrl,
			})),
		);

	return members;
};
