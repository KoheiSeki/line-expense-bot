CREATE TABLE "group_expense_management" (
	"line_group_id" varchar(50) PRIMARY KEY NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_settlement_progress" (
	"line_group_id" varchar(50) NOT NULL,
	"from_user_id" varchar(50) NOT NULL,
	"to_user_id" varchar(50) NOT NULL,
	"settled_amount" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_settlement_progress_line_group_id_from_user_id_to_user_id_pk" PRIMARY KEY("line_group_id","from_user_id","to_user_id")
);
--> statement-breakpoint
ALTER TABLE "expense_participants" ALTER COLUMN "share_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "group_members" ALTER COLUMN "picture_url" DROP NOT NULL;