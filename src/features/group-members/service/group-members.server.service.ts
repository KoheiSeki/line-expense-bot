import { Member } from "@/features/expenses/types/expense.types";
import { db, DbTransaction } from "@/lib/db/client";
import { groupMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { RegisterGroupMemberReq } from "../types/group-members.types";
import { createGroupMembersSchema } from "../schemas/group-members.schema";
import { ApiError } from "@/lib/api/error";
import { lineClient } from "@/lib/line/client";

/**
 * グループメンバーを登録する関数
 * @param request グループメンバー登録リクエスト
 */
export const registerGroupMember = async (
	request: RegisterGroupMemberReq,
	tx?: DbTransaction,
): Promise<void> => {
	const result = createGroupMembersSchema.safeParse(request);
	if (!result.success) {
		throw new ApiError(400, result.error.issues[0].message);
	}

	await (tx ?? db)
		.insert(groupMembers)
		.values({
			lineGroupId: request.lineGroupId,
			lineUserId: request.lineUserId,
			displayName: request.displayName,
			pictureUrl: request.pictureUrl,
		})
		.onConflictDoUpdate({
			target: [groupMembers.lineGroupId, groupMembers.lineUserId],
			set: {
				displayName: request.displayName,
				pictureUrl: request.pictureUrl,
			},
		});

	await lineClient.pushMessage({
		to: request.lineGroupId,
		messages: [
			{
				type: "text",
				text: `👋 ${request.displayName} が参加しました`,
			},
		],
	});
};

/**
 * グループメンバーを取得する関数
 * @param groupId グループID
 * @param tx トランザクション
 * @returns グループメンバー
 */
export const fetchGroupMembers = async (
	groupId: string,
	tx?: DbTransaction,
): Promise<Member[]> => {
	const members: Member[] = await (tx ?? db)
		.select()
		.from(groupMembers)
		.where(eq(groupMembers.lineGroupId, groupId))
		.then((rows) =>
			rows.map((row) => ({
				lineUserId: row.lineUserId,
				displayName: row.displayName,
				pictureUrl: row.pictureUrl ?? undefined,
			})),
		);

	return members;
};

/**
 * グループメンバーをマップに変換する関数
 * @param groupMembers グループメンバー
 * @returns グループメンバーをマップに変換したオブジェクト
 */
export const buildGroupMemberMap = (
	groupMembers: Member[],
): Record<string, string> => {
	const groupMemberMap: Record<string, string> = Object.fromEntries(
		groupMembers.map((member) => [member.lineUserId, member.displayName]),
	);

	return groupMemberMap;
};
