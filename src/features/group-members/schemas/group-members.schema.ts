import { z } from "zod";

/** グループメンバースキーマ定義 */
export const createGroupMembersSchema = z.object({
	lineGroupId: z.string().min(1).max(50),
	lineUserId: z.string().min(1).max(50),
	displayName: z.string().min(1).max(100),
	pictureUrl: z.string().min(1).max(500),
	joinedAt: z.iso.date().optional(),
});
