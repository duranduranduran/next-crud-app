// Node module-customization hook used only by scripts/verify-masiva.mjs so it
// can import app code that uses the "@/" -> "src/" alias (defined in
// jsconfig.json for Next.js's bundler, which plain `node` doesn't understand
// on its own). Not used by the Next.js app itself.
import path from "node:path";
import { pathToFileURL } from "node:url";

const srcRoot = pathToFileURL(path.resolve(process.cwd(), "src") + "/").href;

const KNOWN_EXTENSIONS = [".js", ".jsx", ".mjs", ".json"];

export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
        let rewritten = srcRoot + specifier.slice(2);
        // Node's ESM resolver, unlike webpack, requires an explicit extension.
        if (!KNOWN_EXTENSIONS.some((ext) => rewritten.endsWith(ext))) {
            rewritten += ".js";
        }
        return nextResolve(rewritten, context);
    }
    return nextResolve(specifier, context);
}
