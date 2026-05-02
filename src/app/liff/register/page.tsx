import { Member } from "@/features/expenses/types/expense.types";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { fetchGroupMembers } from "@/features/group-members/service/group-members.server.service";

type RegisterPageProps = {
	searchParams: Promise<{ groupId?: string }>;
};

export default async function RegisterPage({
	searchParams,
}: RegisterPageProps) {
	const { groupId } = await searchParams;
	if (!groupId) return <p>グループIDが取得できません</p>;

	/** グループメンバーを取得 */
	const members: Member[] = await fetchGroupMembers(groupId);

	return (
		<main className="max-w-md mx-auto">
			<h1 className="text-xl font-bold p-6 pb-0">支出を登録</h1>
			<ExpenseForm groupId={groupId} members={members} />
		</main>
	);
}
