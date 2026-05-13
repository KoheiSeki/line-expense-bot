"use client";

import { useState } from "react";

type UseParticipantAmountsParams = {
	amount: string;
	/** 編集フォームなど、参加者の初期選択・負担額 */
	initialShares?: Map<string, string>;
};

type UseParticipantAmountsResult = {
	participantAmounts: Map<string, string>;
	toggleMember: (lineUserId: string) => void;
	updateShareAmount: (lineUserId: string, shareAmount: string) => void;
};

export const useParticipantAmounts = ({
	amount,
	initialShares,
}: UseParticipantAmountsParams): UseParticipantAmountsResult => {
	const [participantAmounts, setParticipantAmounts] = useState<
		Map<string, string>
	>(() => (initialShares ? new Map(initialShares) : new Map()));

	/** 参加者の選択状態をトグルする */
	const toggleMember = (lineUserId: string) => {
		setParticipantAmounts((prev) => {
			const next = new Map(prev);
			if (next.has(lineUserId)) {
				next.delete(lineUserId);
			} else {
				const normalizedAmount = amount.replace(/,/g, "");
				const defaultShare = normalizedAmount
					? (Number(normalizedAmount) / (prev.size + 1)).toFixed(0)
					: "";
				next.set(lineUserId, defaultShare);
			}
			return next;
		});
	};

	/** 特定参加者の負担金額を更新する */
	const updateShareAmount = (lineUserId: string, value: string) => {
		setParticipantAmounts((prev) => new Map(prev).set(lineUserId, value));
	};

	return { participantAmounts, toggleMember, updateShareAmount };
};
