-- DropIndex
DROP INDEX "Debtor_cedulaIdentidad_key";

-- AlterTable
ALTER TABLE "Debtor" ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "ruc" TEXT;
