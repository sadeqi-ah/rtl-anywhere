// Ambient declarations for the userscript-manager API.
// src/gm.ts is the only module allowed to touch the GM_* globals.

/** Value shapes we persist. Anything JSON-serialisable that a manager accepts. */
declare function GM_getValue<T>(key: string, defaultValue: T): T;
declare function GM_setValue(key: string, value: unknown): void;
declare function GM_registerMenuCommand(label: string, fn: () => void): void;
/** Some managers return nothing instead of the <style> element they injected. */
declare function GM_addStyle(css: string): HTMLStyleElement | undefined;
