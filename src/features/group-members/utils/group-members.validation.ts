import { joinFormSchema } from "../schemas/group-members.schema";
import { JoinForm } from "../types/group-members.types";

export const validateJoinForm = (joinForm: JoinForm): string | null => {
	return joinFormSchema.safeParse(joinForm).error?.issues[0].message ?? null;
};
