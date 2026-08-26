// Companion to _alias-hooks.mjs — registers it via Node's module.register()
// API. Loaded with `node --import` (see the usage comment in verify-masiva.mjs).
import { register } from "node:module";

register("./_alias-hooks.mjs", import.meta.url);
