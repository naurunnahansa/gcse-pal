ALTER TABLE "tenants" ADD COLUMN "workos_organization_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "domain" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "workos_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "workos_profile_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
CREATE INDEX "tenants_workos_org_idx" ON "tenants" USING btree ("workos_organization_id");--> statement-breakpoint
CREATE INDEX "users_tenant_email_idx" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "users_workos_user_idx" ON "users" USING btree ("workos_user_id");--> statement-breakpoint
CREATE INDEX "users_workos_profile_idx" ON "users" USING btree ("workos_profile_id");--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_workos_organization_id_unique" UNIQUE("workos_organization_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workos_user_id_unique" UNIQUE("workos_user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workos_profile_id_unique" UNIQUE("workos_profile_id");