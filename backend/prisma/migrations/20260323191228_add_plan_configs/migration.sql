-- CreateTable
CREATE TABLE "plan_configs" (
    "id" TEXT NOT NULL,
    "key" "Plan" NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "maxMembers" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_configs_key_key" ON "plan_configs"("key");
