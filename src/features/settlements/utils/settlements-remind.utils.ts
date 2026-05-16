import {
	MAX_REMIND_SETTLEMENT_LINES,
	MAX_REMIND_TEXT_LENGTH,
	REMIND_MESSAGE_FOOTER,
	REMIND_MESSAGE_HEADER,
} from "../consts/settlement-remind.consts";
import { SettlementResult } from "../types/settlements.types";

const OVERFLOW_SUFFIX = "他 {count} 件はトークで「表示」と送信してください";

/**
 * 精算リマインドメッセージを作成する関数
 * @param settlements 精算結果（`fetchSettlements` の戻り値想定）
 * @returns 送信するテキスト。送るべき未精算が無いときは `null`
 */
export const buildSettlementRemindMessage = (
	settlements: SettlementResult[],
): string | null => {
	if (settlements.length === 0) return null;

	const targetSettlements = settlements.filter(
		(settlement) => settlement.amount > 0,
	);
	if (targetSettlements.length === 0) return null;

	const overflowCount = Math.max(
		0,
		targetSettlements.length - MAX_REMIND_SETTLEMENT_LINES,
	);
	const visible = targetSettlements.slice(0, MAX_REMIND_SETTLEMENT_LINES);

	const bodyLines = visible.map(
		(settlement) =>
			`${settlement.fromUserName} → ${settlement.toUserName}: ¥${settlement.amount.toLocaleString("ja-JP")}`,
	);

	const lines: string[] = [
		REMIND_MESSAGE_HEADER,
		...bodyLines,
		...(overflowCount > 0
			? [OVERFLOW_SUFFIX.replace("{count}", String(overflowCount))]
			: []),
		REMIND_MESSAGE_FOOTER,
	];

	let text = lines.join("\n");
	if (text.length > MAX_REMIND_TEXT_LENGTH) {
		const tail = "\n(文字数の上限のため省略)";
		const max = MAX_REMIND_TEXT_LENGTH - tail.length;
		text = text.slice(0, Math.max(0, max)) + tail;
	}

	return text;
};
