-- CreateTable
CREATE TABLE "upgrade_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "target_plan" "Plan" NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_method" TEXT NOT NULL,
    "transaction_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,

    CONSTRAINT "upgrade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL,
    "payment_phone" TEXT NOT NULL DEFAULT '+221 77 328 73 76',
    "payment_name" TEXT NOT NULL DEFAULT 'FactureApp',
    "support_email" TEXT NOT NULL DEFAULT 'contact@factureapp.sn',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "upgrade_requests" ADD CONSTRAINT "upgrade_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
