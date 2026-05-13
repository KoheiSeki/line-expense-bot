"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/shared/components/form-error";
import { useLiff } from "@/shared/components/liff-provider";
import { formatDateJp } from "@/lib/utils/format-date";
import { ApiError } from "@/lib/api/error";
import type liff from "@line/liff";
import { useState, useTransition } from "react";
import type { EditExpense } from "../types/edit-expense.types";
import { deleteExpenseRequest } from "../service/expense.client.service";

type DeleteExpenseConfirmFormProps = {
	expense: EditExpense;
};

type DeleteExpenseConfirmFormInnerProps = DeleteExpenseConfirmFormProps & {
	liff: typeof liff;
};

/** LIFF 初期化待ち */
export const DeleteExpenseConfirmForm = ({
	expense,
}: DeleteExpenseConfirmFormProps) => {
	const { liff, isReady } = useLiff();

	if (!isReady || !liff) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-sm text-zinc-400">読み込み中...</p>
			</div>
		);
	}

	return <DeleteExpenseConfirmFormInner expense={expense} liff={liff} />;
};

const DeleteExpenseConfirmFormInner = ({
	expense,
	liff,
}: DeleteExpenseConfirmFormInnerProps) => {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const paidAtLabel = formatDateJp(new Date(expense.paidAt));
	const amountLabel = Number(expense.amount).toLocaleString("ja-JP");

	const handleCancel = () => {
		liff.closeWindow();
	};

	const handleConfirmDelete = () => {
		startTransition(async () => {
			setError(null);
			try {
				await deleteExpenseRequest({
					expenseId: expense.expenseId,
					lineGroupId: expense.lineGroupId,
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

	return (
		<div className="flex flex-col gap-6 p-6">
			<FormError error={error} />

			<p className="text-sm text-zinc-600 leading-relaxed">
				以下の支出を削除します。この操作は取り消せません。
			</p>

			<div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-zinc-100">
				<div className="px-4 py-3">
					<p className="text-xs font-medium text-zinc-400 mb-0.5">タイトル</p>
					<p className="text-base font-semibold text-zinc-900">{expense.title}</p>
				</div>
				<div className="px-4 py-3">
					<p className="text-xs font-medium text-zinc-400 mb-0.5">合計金額</p>
					<p className="text-base font-semibold text-zinc-900">¥{amountLabel}</p>
				</div>
				<div className="px-4 py-3">
					<p className="text-xs font-medium text-zinc-400 mb-0.5">支払い日</p>
					<p className="text-sm font-medium text-zinc-800">{paidAtLabel}</p>
				</div>
				<div className="px-4 py-3">
					<p className="text-xs font-medium text-zinc-400 mb-0.5">支払い者</p>
					<p className="text-sm font-medium text-zinc-800">{expense.payerDisplayName}</p>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<Button
					type="button"
					variant="destructive"
					size="lg"
					className="w-full h-11 rounded-xl"
					disabled={isPending}
					onClick={handleConfirmDelete}
				>
					{isPending ? "削除中..." : "削除する"}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="w-full h-11 rounded-xl"
					disabled={isPending}
					onClick={handleCancel}
				>
					キャンセル
				</Button>
			</div>
		</div>
	);
};
