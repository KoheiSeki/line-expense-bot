CREATE TABLE "group_members" (
	"line_group_id" varchar(50) NOT NULL,
	"line_user_id" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"picture_url" varchar(500) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_line_group_id_line_user_id_pk" PRIMARY KEY("line_group_id","line_user_id")
);
