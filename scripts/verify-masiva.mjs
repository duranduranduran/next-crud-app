// Manual, human-run verification for the Masiva SMS integration.
//
// NOT run in CI. NOT imported by any app code — this is a standalone
// diagnostic, run by hand only, and Step 3 sends a real SMS if you pass
// --confirm.
//
// Usage:
//   node --import ./scripts/_register-alias.mjs scripts/verify-masiva.mjs <phone>            (dry run — steps 1, 2 only)
//   node --import ./scripts/_register-alias.mjs scripts/verify-masiva.mjs <phone> --confirm   (also sends one real SMS in step 3)
//
// Masiva is outbound-only on our account — no inbound poll step here.
//
// <phone> is any format toE164Ec() accepts (e.g. 0991234567, +593991234567).
// Reads MASIVA_CLIENT_ID / MASIVA_CLIENT_SECRET / DATABASE_URL from .env in
// the project root. Never prints MASIVA_CLIENT_SECRET or a token value.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(envPath) {
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}

loadEnvFile(path.join(projectRoot, ".env"));

const phoneArg = process.argv[2];
const confirmFlag = process.argv.includes("--confirm");

if (!phoneArg || phoneArg.startsWith("--")) {
    console.error("Usage: node --import ./scripts/_register-alias.mjs scripts/verify-masiva.mjs <phone> [--confirm]");
    process.exit(1);
}

const { getToken, sendSms, sanitizeSmsContent, prepareSmsContent } = await import("../src/lib/sms/masiva.js");

const prisma = new PrismaClient();

function checkSanitizer() {
    console.log("=== Sanitizer checks ===");

    const nameSample = "José Muñoz Andrés";
    const nameOutput = sanitizeSmsContent(nameSample);
    console.log(`input:  ${JSON.stringify(nameSample)}`);
    console.log(`output: ${JSON.stringify(nameOutput)}`);
    if (/[^\x00-\x7F]/.test(nameOutput)) {
        console.error("FAIL — output still contains non-ASCII characters.");
    } else {
        console.log("PASS — output is pure ASCII.");
    }

    const longSample =
        "RECUPERA: Estimado Jose Munoz Andres, tiene un saldo pendiente de $1234.56 con Empresa Ejemplo S.A. " +
        "Regularice su situacion cuanto antes visitando el siguiente enlace para mas detalles: https://recupera.com.ec/p/abcd1234";
    const longOutput = prepareSmsContent(longSample, "+593999999999");
    console.log(`\ninput  (${longSample.length} chars): ${JSON.stringify(longSample)}`);
    console.log(`output (${longOutput.length} chars): ${JSON.stringify(longOutput)}`);
    if (longOutput.length > 160) {
        console.error(`FAIL — output exceeds 160 chars (${longOutput.length}).`);
    } else {
        console.log("PASS — output is within the 160-char cap.");
    }
}

async function main() {
    checkSanitizer();

    // --- Step 1: request a token ---
    console.log("=== Step 1: request token ===");
    await getToken();
    const row1 = await prisma.providerToken.findUnique({ where: { provider: "masiva" } });
    if (!row1) {
        console.error("FAIL — no ProviderToken row found after getToken(). Caching did not happen.");
        process.exit(1);
    }
    const expiresInSeconds = Math.round((row1.expiresAt.getTime() - Date.now()) / 1000);
    console.log(`Token acquired. expires_in ≈ ${expiresInSeconds}s (derived from ProviderToken.expiresAt; token value not printed)`);

    // --- Step 2: confirm caching + reuse on a second call ---
    console.log("\n=== Step 2: confirm cache reuse ===");
    const updatedAt1 = row1.updatedAt.getTime();
    await getToken();
    const row2 = await prisma.providerToken.findUnique({ where: { provider: "masiva" } });
    const updatedAt2 = row2.updatedAt.getTime();
    if (updatedAt1 === updatedAt2) {
        console.log("PASS — second getToken() call reused the cached token (ProviderToken.updatedAt unchanged).");
    } else {
        console.warn("WARNING — ProviderToken.updatedAt changed on the second call; a token was re-requested instead of reused.");
    }

    // --- Step 3: send ONE SMS, gated behind --confirm ---
    console.log("\n=== Step 3: send one SMS ===");
    if (!confirmFlag) {
        console.log(`DRY RUN — would send one SMS to ${phoneArg}. Re-run with --confirm to actually send it.`);
    } else {
        const result = await sendSms(phoneArg, "Recupera: mensaje de prueba de verificacion Masiva.");
        console.log("Sent. Result:", JSON.stringify({ ok: result.ok, campaignId: result.campaignId, messageIds: result.messageIds }));
    }
}

main()
    .catch((err) => {
        console.error("Verification script failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
