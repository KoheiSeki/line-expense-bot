"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/error";
import { useLiff } from "@/shared/components/liff-provider";
import type { Profile } from "@liff/get-profile";
import type liff from "@line/liff";
import Image from "next/image";
import { useState, useTransition } from "react";
import { createExpenseRequest } from "../service/expense.client.service";
import { ExpenseParticipant, Member } from "../types/expense.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateExpenseForm } from "../utils/expense-form.validation";
import { CARD_INPUT_CLASS } from "@/shared/styles/card-input";
import { FormError } from "@/shared/components/form-error";

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
	const [isPending, startTransition] = useTransition();
	/** 支払い者 */
	const [payerUserId, setPayerUserId] = useState<string>(profile.userId);
	/** 支出タイトル */
	const [title, setTitle] = useState<string>("");
	/** 金額 */
	const [amount, setAmount] = useState<string>("");
	/** 支払日 */
	const [paidAt, setPaidAt] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	/** 支出参加者（userId → 負担金額） */
	const [participantAmounts, setParticipantAmounts] = useState<
		Map<string, string>
	>(new Map());
	/** エラーメッセージ */
	const [error, setError] = useState<string | null>(null);

	/** 支出を登録する関数 */
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		startTransition(async () => {
			setError(null);

			const expenseParticipants: ExpenseParticipant[] = Array.from(
				participantAmounts.entries(),
			).map(([lineUserId, shareAmount]) => ({ lineUserId, shareAmount }));

			const validationError = validateExpenseForm({
				payerUserId,
				title,
				amount: amount.replace(/,/g, ""),
				paidAt,
				expenseParticipants,
			});

			if (validationError) {
				setError(validationError);
				return;
			}

			try {
				await createExpenseRequest({
					lineGroupId: groupId,
					payerUserId,
					title,
					amount,
					paidAt,
					expenseParticipants,
				});

				liff.closeWindow();
			} catch (error) {
				if (error instanceof ApiError) {
					setError(error.message);
				} else {
					setError("予期しないエラーが発生しました");
				}
			}
		});
	};

	/** 参加者をトグルする関数 */
	const toggleMember = (lineUserId: string) => {
		setParticipantAmounts((prev) => {
			const next = new Map(prev);
			if (next.has(lineUserId)) {
				next.delete(lineUserId);
			} else {
				const defaultShare = amount
					? (Number(amount.replace(/,/g, "")) / (prev.size + 1)).toFixed(0)
					: "";
				next.set(lineUserId, defaultShare);
			}
			return next;
		});
	};

	/** 負担金額を更新する関数 */
	const updateShareAmount = (lineUserId: string, value: string) => {
		setParticipantAmounts((prev) => new Map(prev).set(lineUserId, value));
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
			{/* エラー */}
			<FormError error={error} />

			{/* 基本情報カード */}
			<div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-zinc-100">
				{/* タイトル */}
				<div className="px-4 pt-3 pb-2">
					<Label
						htmlFor="title"
						className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1"
					>
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

				{/* 合計金額 */}
				<div className="px-4 pt-3 pb-2">
					<Label
						htmlFor="amount"
						className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1"
					>
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

				{/* 支払い日 */}
				<div className="px-4 pt-3 pb-2">
					<Label
						htmlFor="paidAt"
						className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1"
					>
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
				<Label
					htmlFor="payerUserId"
					className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3"
				>
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
									{member.pictureUrl ? (
										<Image
											src={member.pictureUrl}
											alt={member.displayName}
											width={24}
											height={24}
											className="rounded-full"
										/>
									) : (
										<div className="w-6 h-6 rounded-full bg-zinc-200" />
									)}
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
					<Label
						htmlFor="participantAmounts"
						className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
					>
						参加者と負担金額
					</Label>
				</div>
				{members.map((member, i) => {
					const isSelected = participantAmounts.has(member.lineUserId);
					return (
						<label
							htmlFor={`participant-${member.lineUserId}`}
							key={member.lineUserId}
							className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
								i < members.length - 1 ? "border-b border-zinc-100" : ""
							} ${isSelected ? "bg-indigo-50" : "hover:bg-zinc-50"}`}
						>
							<Input
								id={`participant-${member.lineUserId}`}
								type="checkbox"
								checked={isSelected}
								onChange={() => toggleMember(member.lineUserId)}
								className="w-[18px] h-[18px] accent-indigo-600 shrink-0"
							/>
							{member.pictureUrl ? (
								<Image
									src={member.pictureUrl}
									alt={member.displayName}
									width={36}
									height={36}
									className="rounded-full shrink-0"
								/>
							) : (
								<div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
							)}
							<span className="flex-1 text-sm font-medium">
								{member.displayName}
							</span>

							<div className="flex items-center gap-0.5 shrink-0">
								<span className="text-zinc-400 text-sm">¥</span>
								<Input
									id={`participant-amount-${member.lineUserId}`}
									type="text"
									value={participantAmounts.get(member.lineUserId) ?? ""}
									onChange={(e) =>
										updateShareAmount(member.lineUserId, e.target.value)
									}
									onClick={(e) => e.stopPropagation()}
									placeholder="0"
									className={CARD_INPUT_CLASS}
								/>
							</div>
						</label>
					);
				})}
			</div>

			{/* 送信ボタン */}
			<Button type="submit" disabled={isPending}>
				{isPending ? "登録中..." : "登録する"}
			</Button>
		</form>
	);
};
