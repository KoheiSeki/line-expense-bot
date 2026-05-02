import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiff } from "@/shared/components/liff-provider";
import { useState, useTransition } from "react";
import { createExpenseRequest } from "../service/expense.client.service";
import { ApiError } from "@/lib/api/error";
import { Member } from "../types/expense.types";
import Image from "next/image";

type ExpenseFormProps = {
	groupId: string;
	members: Member[];
};
export const ExpenseForm = ({ groupId, members }: ExpenseFormProps) => {
	const { liff } = useLiff();
	const [isPending, startTransition] = useTransition();
	/** 支出タイトル */
	const [title, setTitle] = useState<string>("");
	/** 金額 */
	const [amount, setAmount] = useState<string>("");
	/** 支払日 */
	const [paidAt, setPaidAt] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	/** 支出参加者 */
	const [participantAmounts, setParticipantAmounts] = useState<
		Map<string, string>
	>(new Map());

	/** エラーメッセージ */
	const [error, setError] = useState<string | null>(null);

	/** 支出を登録する関数 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!liff) return;

		startTransition(async () => {
			setError(null);
			if (participantAmounts.size === 0) {
				setError("参加者を1人以上選択してください");
				return;
			}

			if (Number(amount) <= 0) {
				setError("金額は1円以上にしてください");
				return;
			}

			try {
				const profile = await liff.getProfile();

				await createExpenseRequest({
					groupId,
					payerUserId: profile.userId,
					title,
					amount,
					paidAt,
					expenseParticipants: Array.from(participantAmounts.entries()).map(
						([lineUserId, shareAmount]) => ({ lineUserId, shareAmount }),
					),
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

	/**
	 * 支出参加者を追加または削除する関数
	 * @param lineUserId ラインユーザーID
	 * @param shareAmount 負担金額
	 */
	const toggleMember = (lineUserId: string) => {
		setParticipantAmounts((prev) => {
			const next = new Map(prev);
			if (next.has(lineUserId)) {
				next.delete(lineUserId);
			} else {
				// チェック時は均等割りの金額をデフォルトセット
				const defaultShare = amount
					? (Number(amount) / (prev.size + 1)).toFixed(2)
					: "";
				next.set(lineUserId, defaultShare);
			}
			return next;
		});
	};

	/**
	 * 負担金額を更新する関数
	 * @param lineUserId ラインユーザーID
	 * @param value 負担金額
	 */
	const updateShareAmount = (lineUserId: string, value: string) => {
		setParticipantAmounts((prev) => new Map(prev).set(lineUserId, value));
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
			{error && <p className="text-red-500 text-sm">{error}</p>}
			<div>
				<Label htmlFor="title">タイトル</Label>
				<Input
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label htmlFor="amount">金額</Label>
				<Input
					id="amount"
					type="number"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label htmlFor="paidAt">支払い日</Label>
				<Input
					id="paidAt"
					type="date"
					value={paidAt}
					onChange={(e) => setPaidAt(e.target.value)}
					required
				/>
			</div>
			<div>
				<Label>参加者</Label>
				<div className="flex flex-col gap-2 mt-1">
					{members.map((member) => {
						const isSelected = participantAmounts.has(member.lineUserId);
						return (
							<div key={member.lineUserId}>
								<label className="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={isSelected}
										onChange={() => toggleMember(member.lineUserId)}
									/>
									<Image
										src={member.pictureUrl}
										alt={member.displayName}
										width={32}
										height={32}
										className="rounded-full"
									/>
									<span>{member.displayName}</span>
								</label>
								{/* チェック時のみ金額入力欄を表示 */}
								{isSelected && (
									<div className="ml-11 mt-1">
										<Input
											type="number"
											value={participantAmounts.get(member.lineUserId) ?? ""}
											onChange={(e) =>
												updateShareAmount(member.lineUserId, e.target.value)
											}
											placeholder="負担金額"
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
			<Button type="submit" disabled={isPending}>
				{isPending ? "登録中..." : "登録"}
			</Button>
		</form>
	);
};
