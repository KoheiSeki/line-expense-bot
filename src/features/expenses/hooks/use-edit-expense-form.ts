"use client";

import { ApiError } from "@/lib/api/error";
import type liff from "@line/liff";
import { useMemo, useState, useTransition } from "react";
import { editExpenseRequest } from "../service/expense.client.service";
import type { EditExpense } from "../types/edit-expense.types";
import type { ExpenseParticipant } from "../types/expense.types";
import { validateExpenseForm } from "../utils/expenses.validation";
import { useParticipantAmounts } from "./use-participant-amounts";

type UseEditExpenseFormParams = {
	expense: EditExpense;
	liff: typeof liff;
};

type UseEditExpenseFormResult = {
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

function formatPaidAtForInput(paidAt: string): string {
	if (/^\d{4}-\d{2}-\d{2}/.test(paidAt)) {
		return paidAt.slice(0, 10);
	}
	return paidAt;
}

/**
 * 支出編集フォームの状態と操作をまとめたフック
 */
export const useEditExpenseForm = ({
	expense,
	liff,
}: UseEditExpenseFormParams): UseEditExpenseFormResult => {
	const initialShares = useMemo(
		() =>
			new Map(
				expense.expenseParticipants.map((p) => [p.lineUserId, p.shareAmount]),
			),
		[expense],
	);

	const [isPending, startTransition] = useTransition();
	const [payerUserId, setPayerUserId] = useState(expense.payerUserId);
	const [title, setTitle] = useState(expense.title);
	const [amount, setAmount] = useState(expense.amount);
	const [paidAt, setPaidAt] = useState(() =>
		formatPaidAtForInput(expense.paidAt),
	);
	const [error, setError] = useState<string | null>(null);

	const { participantAmounts, toggleMember, updateShareAmount } =
		useParticipantAmounts({
			amount,
			initialShares,
		});

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
				await editExpenseRequest({
					expenseId: expense.expenseId,
					lineGroupId: expense.lineGroupId,
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
