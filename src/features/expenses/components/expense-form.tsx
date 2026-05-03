"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useLiff } from "@/shared/components/liff-provider";
import type { Profile } from "@liff/get-profile";
import type liff from "@line/liff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CARD_INPUT_CLASS } from "@/shared/styles/card-input";
import { FormError } from "@/shared/components/form-error";
import { useExpenseForm } from "../hooks/use-expense-form";
import type { Member } from "../types/expense.types";
import { MemberAvatar } from "../../../shared/components/member-avatar";
import { ParticipantRow } from "./participant-row";
import { LABEL_CLASS } from "@/shared/styles/label";

type ExpenseFormProps = {
	groupId: string;
	members: Member[];
};

type ExpenseFormInnerProps = ExpenseFormProps & {
	profile: Profile;
	liff: typeof liff;
};

/** ローディング・LIFF 初期化待ちを担当するラッパー */
export const ExpenseForm = ({ groupId, members }: ExpenseFormProps) => {
	const { liff, isReady, profile } = useLiff();

	if (!isReady || !profile || !liff) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-sm text-zinc-400">読み込み中...</p>
			</div>
		);
	}

	return (
		<ExpenseFormInner
			groupId={groupId}
			members={members}
			profile={profile}
			liff={liff}
		/>
	);
};

/** フォーム本体（profile・liff が確定した状態でマウント） */
const ExpenseFormInner = ({
	groupId,
	members,
	profile,
	liff,
}: ExpenseFormInnerProps) => {
	const {
		isPending,
		payerUserId,
		setPayerUserId,
		title,
		setTitle,
		amount,
		setAmount,
		paidAt,
		setPaidAt,
		error,
		participantAmounts,
		toggleMember,
		updateShareAmount,
		handleSubmit,
	} = useExpenseForm({ groupId, profile, liff });

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
			<FormError error={error} />

			{/* 基本情報カード */}
			<div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-zinc-100">
				<div className="px-4 pt-3 pb-2">
					<Label htmlFor="title" className={`${LABEL_CLASS} mb-1`}>
						タイトル
					</Label>
					<Input
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="例: 夕食代"
						className={CARD_INPUT_CLASS}
						required
					/>
				</div>

				<div className="px-4 pt-3 pb-2">
					<Label htmlFor="amount" className={`${LABEL_CLASS} mb-1`}>
						合計金額
					</Label>
					<div className="flex items-center gap-1.5">
						<span className="text-zinc-400 font-medium shrink-0">¥</span>
						<Input
							id="amount"
							type="text"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="0"
							className={CARD_INPUT_CLASS}
							required
						/>
					</div>
				</div>

				<div className="px-4 pt-3 pb-2">
					<Label htmlFor="paidAt" className={`${LABEL_CLASS} mb-1`}>
						支払い日
					</Label>
					<Input
						id="paidAt"
						type="date"
						value={paidAt}
						onChange={(e) => setPaidAt(e.target.value)}
						className={CARD_INPUT_CLASS}
						required
					/>
				</div>
			</div>

			{/* 支払い者カード */}
			<div className="bg-white rounded-2xl shadow-sm px-4 py-4">
				<Label htmlFor="payerUserId" className={`${LABEL_CLASS} mb-3`}>
					支払い者
				</Label>
				<Select value={payerUserId} onValueChange={setPayerUserId}>
					<SelectTrigger className="w-full h-11 rounded-xl border-zinc-200 text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{members.map((member) => (
							<SelectItem key={member.lineUserId} value={member.lineUserId}>
								<div className="flex items-center gap-2 py-0.5">
									<MemberAvatar
										pictureUrl={member.pictureUrl}
										displayName={member.displayName}
										size={24}
									/>
									<span>{member.displayName}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* 参加者カード */}
			<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
				<div className="px-4 pt-4 pb-2">
					<Label htmlFor="participantAmounts" className={LABEL_CLASS}>
						参加者と負担金額
					</Label>
				</div>
				{members.map((member, i) => (
					<ParticipantRow
						key={member.lineUserId}
						member={member}
						isSelected={participantAmounts.has(member.lineUserId)}
						shareAmount={participantAmounts.get(member.lineUserId) ?? ""}
						isLast={i === members.length - 1}
						onToggle={() => toggleMember(member.lineUserId)}
						onAmountChange={(value) =>
							updateShareAmount(member.lineUserId, value)
						}
					/>
				))}
			</div>

			<Button type="submit" disabled={isPending}>
				{isPending ? "登録中..." : "登録する"}
			</Button>
		</form>
	);
};
