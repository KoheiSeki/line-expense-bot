import {
	date,
	decimal,
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
	primaryKey,
} from "drizzle-orm/pg-core";

/** 支出テーブル */
export const expenses = pgTable("expenses", {
	/** 支出ID */
	expenseId: serial("expense_id").primaryKey(),
	/** ライングループID */
	lineGroupId: varchar("line_group_id", { length: 50 }).notNull(),
	/** 支払い者ユーザーID */
	payerUserId: varchar("payer_user_id", { length: 50 }).notNull(),
	/** タイトル */
	title: varchar("title", { length: 255 }).notNull(),
	/** 金額 */
	amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
	/** 支払い日 */
	paidAt: date("paid_at").notNull(),
	/** 作成日時 */
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/** 支出参加者テーブル */
export const expenseParticipants = pgTable(
	"expense_participants",
	{
		/** 支出ID */
		expenseId: integer("expense_id")
			.references(() => expenses.expenseId)
			.notNull(),
		/** ラインユーザーID */
		lineUserId: varchar("line_user_id", { length: 50 }).notNull(),
		/** 負担金額 */
		shareAmount: decimal("share_amount", { precision: 10, scale: 2 }).notNull(),
		/** 作成日時 */
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.expenseId, table.lineUserId] })],
);

/** グループメンバーテーブル */
export const groupMembers = pgTable(
	"group_members",
	{
		/** ライングループID */
		lineGroupId: varchar("line_group_id", { length: 50 }).notNull(),
		/** ラインユーザーID */
		lineUserId: varchar("line_user_id", { length: 50 }).notNull(),
		/** 表示名 */
		displayName: varchar("display_name", { length: 100 }).notNull(),
		/** プロフィール画像URL */
		pictureUrl: varchar("picture_url", { length: 500 }).notNull(),
		/** 参加日時 */
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.lineGroupId, table.lineUserId] })],
);
