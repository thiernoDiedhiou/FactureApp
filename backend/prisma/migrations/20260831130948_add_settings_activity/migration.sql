-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "plan_expires_at" TIMESTAMP(3),
ADD COLUMN     "plan_started_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "activity" TEXT,
ADD COLUMN     "bank_account" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "rccm" TEXT;

-- AlterTable
ALTER TABLE "upgrade_requests" ADD COLUMN     "duration_months" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "upgrade_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_upgrade_request_id_key" ON "subscriptions"("upgrade_request_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_upgrade_request_id_fkey" FOREIGN KEY ("upgrade_request_id") REFERENCES "upgrade_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
