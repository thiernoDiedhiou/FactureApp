-- AlterTable
ALTER TABLE "plan_configs" ADD COLUMN     "max_clients" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "max_documents" INTEGER NOT NULL DEFAULT 10;
