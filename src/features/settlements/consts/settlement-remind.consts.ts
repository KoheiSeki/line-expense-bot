/** CRON APIのパス */
export const SETTLEMENT_REMIND_CRON_PATH: string =
	"/api/cron/settlement-remind";

/** CRONのスケジュール(JST) */
export const SETTLEMENT_REMIND_CRON_SCHEDULE_UTC: string = "0 10 * * *";

/** 1回のCRON実行で処理するグループ数の最大値 */
export const MAX_LINE_GROUP_PER_REMIND_RUN: number = 50;

/** 1回の通知で送信するテキストの最大文字数 */
export const MAX_REMIND_TEXT_LENGTH: number = 3500;

/** 1回の通知で送信する精算情報の最大件数 */
export const MAX_REMIND_SETTLEMENT_LINES: number = 10;

/** 通知メッセージのヘッダー */
export const REMIND_MESSAGE_HEADER: string = "【自動通知】以下の精算が必要です";

/** 通知メッセージのフッター */
export const REMIND_MESSAGE_FOOTER: string =
	"精算が完了したら、「済」と入力してください";
