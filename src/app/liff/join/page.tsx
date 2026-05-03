import { JoinForm } from "@/features/group-members/components/join-form";

type JoinPageProps = {
	searchParams: Promise<{ groupId?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
	const { groupId } = await searchParams;
	if (!groupId) return <p>グループIDが取得できません</p>;

	return (
		<main className="max-w-md mx-auto">
			<h1 className="text-xl font-bold p-6 pb-0">グループ参加</h1>
			<JoinForm groupId={groupId} />
		</main>
	);
}
