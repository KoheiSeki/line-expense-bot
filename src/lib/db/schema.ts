import {
	date,
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
	amount: integer("amount").notNull(),
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
		shareAmount: integer("share_amount").notNull(),
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
		pictureUrl: varchar("picture_url", { length: 500 }),
		/** 参加日時 */
		joinedAt: timestamp("joined_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.lineGroupId, table.lineUserId] })],
);

/** グループ管理テーブル */
export const groupExpenseManagement = pgTable("group_expense_management", {
	/** ライングループID */
	lineGroupId: varchar("line_group_id", { length: 50 }).notNull().primaryKey(),
	/** 精算完了日時 */
	completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow(),
	/** 更新日時 */
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/** グループ精算管理テーブル */
export const groupSettlementProgress = pgTable(
	"group_settlement_progress",
	{
		/** ライングループID */
		lineGroupId: varchar("line_group_id", { length: 50 }).notNull(),
		/** 送金者ユーザーID */
		fromUserId: varchar("from_user_id", { length: 50 }).notNull(),
		/** 受取者ユーザーID */
		toUserId: varchar("to_user_id", { length: 50 }).notNull(),
		/** 精算済み金額 */
		settledAmount: integer("settled_amount").notNull(),
		/** 更新日時 */
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.lineGroupId, table.fromUserId, table.toUserId],
		}),
	],
);
