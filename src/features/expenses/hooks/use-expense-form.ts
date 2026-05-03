"use client";

import { ApiError } from "@/lib/api/error";
import type { Profile } from "@liff/get-profile";
import type liff from "@line/liff";
import { useState, useTransition } from "react";
import { createExpenseRequest } from "../service/expense.client.service";
import type { ExpenseParticipant } from "../types/expense.types";
import { validateExpenseForm } from "../utils/expense-form.validation";
import { useParticipantAmounts } from "./use-participant-amounts";

type UseExpenseFormParams = {
	groupId: string;
	profile: Profile;
	liff: typeof liff;
};

type UseExpenseFormResult = {
	isPending: boolean;
	payerUserId: string;
	setPayerUserId: (payerUserId: string) => void;
	title: string;
	setTitle: (title: string) => void;
	amount: string;
	setAmount: (amount: string) => void;
	paidAt: string;
	setPaidAt: (paidAt: string) => void;
	error: string | null;
	participantAmounts: Map<string, string>;
	toggleMember: (lineUserId: string) => void;
	updateShareAmount: (lineUserId: string, shareAmount: string) => void;
	handleSubmit: (e: React.FormEvent) => void;
};

/**
 * 支出登録フォームの状態と操作をまとめたフック
 */
export const useExpenseForm = ({
	groupId,
	profile,
	liff,
}: UseExpenseFormParams): UseExpenseFormResult => {
	const [isPending, startTransition] = useTransition();
	const [payerUserId, setPayerUserId] = useState<string>(profile.userId);
	const [title, setTitle] = useState<string>("");
	const [amount, setAmount] = useState<string>("");
	const [paidAt, setPaidAt] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [error, setError] = useState<string | null>(null);

	const { participantAmounts, toggleMember, updateShareAmount } =
		useParticipantAmounts({ amount });

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
					amount: amount.replace(/,/g, ""),
					paidAt,
					expenseParticipants,
				});
				liff.closeWindow();
			} catch (err) {
				if (err instanceof ApiError) {
					setError(err.message);
				} else {
					setError("予期しないエラーが発生しました");
				}
			}
		});
	};

	return {
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
	};
};
