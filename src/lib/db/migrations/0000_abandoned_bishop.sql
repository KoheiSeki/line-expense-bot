CREATE TABLE "expense_participants" (
	"expense_id" integer NOT NULL,
	"line_user_id" varchar(50) NOT NULL,
	"share_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_participants_expense_id_line_user_id_pk" PRIMARY KEY("expense_id","line_user_id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"expense_id" serial PRIMARY KEY NOT NULL,
	"line_group_id" varchar(50) NOT NULL,
	"payer_user_id" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paid_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expense_id_expenses_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("expense_id") ON DELETE no action ON UPDATE no action;