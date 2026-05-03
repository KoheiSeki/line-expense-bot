import { apiClient } from "@/lib/api/client";
import { RegisterGroupMemberReq } from "../types/group-members.types";

/**
 * グループに参加する関数
 * @param data グループメンバー登録データ
 */
export const joinGroup = async (data: RegisterGroupMemberReq): Promise<void> => {
	await apiClient.post("/join", data);
};
