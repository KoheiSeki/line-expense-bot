import { Settlement, UserBalance } from "../types/expense.types";

/**
 * 精算を計算する関数
 * @param balances ユーザー毎の残高
 * @returns 精算結果
 */
export const calculateSettlements = (balances: UserBalance[]): Settlement[] => {
	// 債権者を残高の大きい順に並び替えて取得
	const creditors = balances
		.filter((balance) => balance.netBalance > 0)
		.map((balance) => ({ ...balance }))
		.sort((a, b) => b.netBalance - a.netBalance);

	// 債務者を残高の小さい順に並び替えて取得
	const debtors = balances
		.filter((balance) => balance.netBalance < 0)
		.map((balance) => ({ ...balance }))
		.sort((a, b) => a.netBalance - b.netBalance);

	const settlements: Settlement[] = [];

	let ci = 0;
	let di = 0;

	while (ci < creditors.length && di < debtors.length) {
		const amount = Math.min(
			creditors[ci].netBalance,
			Math.abs(debtors[di].netBalance),
		);

		settlements.push({
			fromUserId: debtors[di].lineUserId,
			toUserId: creditors[ci].lineUserId,
			amount,
		});

		creditors[ci].netBalance -= amount;
		debtors[di].netBalance += amount;

		if (creditors[ci].netBalance === 0) ci++;
		if (debtors[di].netBalance === 0) di++;
	}

	return settlements;
};
