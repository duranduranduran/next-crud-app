-- CreateEnum
CREATE TYPE "TemplateChannel" AS ENUM ('SMS', 'EMAIL');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "channel" "TemplateChannel" NOT NULL,
    "label" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_channel_idx" ON "Template"("channel");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the five templates the SMS composer previously hardcoded in
-- lib/sms/templates.js — they were already Masiva-approved content
-- (that's the whole reason this migration exists: the composer had no
-- database-backed template system before this feature, only these five
-- fixed JS functions). Migrating them into rows means the send path can
-- switch entirely to Template lookups without losing already-approved
-- wording, and the admin can see/manage them alongside anything newly
-- registered from the Plantillas tab. {{shortName}} replaces what used to
-- be a direct client.shortName interpolation; behavior is unchanged.
--
-- Wording is copied byte-for-byte from the old hardcoded build() functions
-- — including "Recupera:" in mixed case, not "RECUPERA:" — deliberately.
-- This migration's job is to carry already-approved content into the DB
-- unchanged, not to reformat it; the new validator's RECUPERA-prefix check
-- is case-insensitive specifically so this exact casing still passes.
INSERT INTO "Template" ("id", "channel", "label", "body", "restricted", "active", "createdAt", "updatedAt") VALUES
    ('tmpl_sms_recordatorio_pago', 'SMS', 'Recordatorio de pago', 'Recupera: Hola {{name}}, tiene un saldo pendiente de ${{amount}} con {{shortName}} al {{date}}. Info: {{url}}', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tmpl_sms_segundo_aviso', 'SMS', 'Segundo aviso', 'Recupera: {{name}}, su pago de ${{amount}} a {{shortName}} sigue pendiente desde {{date}}. Regularice: {{url}}', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tmpl_sms_aviso_legal', 'SMS', 'Aviso legal (5 dias)', 'Recupera: {{name}}, si no regulariza ${{amount}} con {{shortName}} en 5 dias desde {{date}} se inicia proceso legal. {{url}}', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tmpl_sms_confirmacion_acuerdo', 'SMS', 'Confirmacion de acuerdo', 'Recupera: {{name}}, confirmamos su acuerdo de pago de ${{amount}} con {{shortName}} al {{date}}. Detalle: {{url}}', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('tmpl_sms_recordatorio_final', 'SMS', 'Recordatorio final', 'Recupera: {{name}}, ultimo recordatorio: ${{amount}} pendiente con {{shortName}} desde {{date}}. Contacto: {{url}}', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
