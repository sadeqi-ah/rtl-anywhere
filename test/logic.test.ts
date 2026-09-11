// Pure-logic tests for the parts that decide *whether* to flip an element.
// No DOM needed — the modules under test are deliberately free of it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rtlRatio, isMostlyRTL } from "../src/text.ts";
import {
  formatCombo,
  matches,
  sameCombo,
  keyName,
  isModifierCode,
} from "../src/keys.ts";
import type { Combo } from "../src/keys.ts";
import { stableClass, stableId } from "../src/selector.ts";
import { AUTO_RATIO } from "../src/constants.ts";

/** Combos carry every modifier, so tests spell out only the ones that matter. */
const combo = (o: Partial<Combo>): Combo => ({
  code: "KeyR",
  alt: false,
  shift: false,
  ctrl: false,
  meta: false,
  ...o,
});

test("rtlRatio counts letters only", () => {
  assert.deepEqual(rtlRatio("سلام"), { rtl: 4, total: 4 });
  assert.deepEqual(rtlRatio("۱۲۳ !؟ "), { rtl: 0, total: 0 }); // digits and marks aren't letters
  assert.deepEqual(rtlRatio("abc"), { rtl: 0, total: 3 });
});

test("isMostlyRTL flips Persian, Arabic and Hebrew but not English", () => {
  assert.ok(isMostlyRTL("این یک پاراگراف فارسی است"));
  assert.ok(isMostlyRTL("مرحبا بالعالم"));
  assert.ok(isMostlyRTL("שלום עולם"));
  assert.ok(!isMostlyRTL("Hello world"));
});

test("isMostlyRTL ignores text too short to judge", () => {
  assert.ok(!isMostlyRTL("سل")); // 2 letters
  assert.ok(!isMostlyRTL("۱۲۳"), "digits alone must not count");
  assert.ok(!isMostlyRTL(""));
});

test("isMostlyRTL respects the ratio threshold in both directions", () => {
  // 6 RTL of 10 letters = exactly AUTO_RATIO
  assert.equal(AUTO_RATIO, 0.6);
  assert.ok(isMostlyRTL("سلامدنیا" + "abcd".slice(0, 2)));
  // Mostly Latin with a couple of Persian words stays LTR
  assert.ok(!isMostlyRTL("The library سلام is great and well documented"));
});

test("formatCombo renders mac and non-mac shortcuts", () => {
  const undo = combo({ code: "KeyZ", alt: true, shift: true });
  assert.equal(formatCombo(undo, true), "⌥⇧Z");
  assert.equal(formatCombo(undo, false), "Alt+Shift+Z");
  assert.equal(keyName("Digit4"), "4");
  assert.equal(keyName("ArrowUp"), "↑");
});

test("keyName renders common non-letter shortcut codes", () => {
  assert.equal(keyName("Space"), "Space");
  assert.equal(keyName("Enter"), "↵");
  assert.equal(keyName("Backspace"), "⌫");
  assert.equal(keyName("NumpadAdd"), "Num Add");
  assert.equal(keyName("F8"), "F8");
});

test("isModifierCode recognizes modifier-only recorder events", () => {
  assert.ok(isModifierCode("ShiftLeft"));
  assert.ok(isModifierCode("ControlRight"));
  assert.ok(isModifierCode("AltLeft"));
  assert.ok(isModifierCode("MetaRight"));
  assert.ok(isModifierCode("OSLeft"));
  assert.ok(!isModifierCode("KeyR"));
  assert.ok(!isModifierCode("F8"));
});

test("matches requires every modifier to agree", () => {
  const toggle = combo({ alt: true });
  const ev = (o: Record<string, boolean>) => ({
    code: "KeyR",
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...o,
  });
  assert.ok(matches(ev({ altKey: true }), toggle));
  assert.ok(!matches(ev({ altKey: true, shiftKey: true }), toggle)); // that's pick mode
  assert.ok(!matches(ev({}), toggle)); // bare R must not fire while typing
});

test("sameCombo compares the whole combo, not just the key", () => {
  assert.ok(sameCombo(combo({ alt: true }), combo({ alt: true })));
  assert.ok(
    !sameCombo(combo({ alt: true }), combo({ alt: true, shift: true })),
  );
  assert.ok(
    !sameCombo(combo({ alt: true }), combo({ code: "KeyZ", alt: true })),
  );
});

test("selector guards reject generated names", () => {
  assert.ok(stableClass("article-body"));
  assert.ok(!stableClass("css-1x2y3z")); // hashed
  assert.ok(!stableClass("is-active")); // stateful
  assert.ok(!stableClass("tm-rtl")); // our own
  assert.ok(!stableClass("a".repeat(40))); // atomic-CSS soup
  assert.ok(stableId("main-content"));
  assert.ok(!stableId("ember12345"));
  assert.ok(!stableId("a1b2c3d4e5")); // hex hash
  assert.ok(!stableId(":r0:")); // React useId
  assert.ok(!stableId(""));
});

test("selector guards accept semantic names and reject volatile variants", () => {
  assert.ok(stableClass("comment-body"));
  assert.ok(stableClass("prose"));
  assert.ok(!stableClass("has-focus"));
  assert.ok(!stableClass("selected"));
  assert.ok(!stableClass("open-menu"));
  assert.ok(stableId("article-main"));
  assert.ok(!stableId("post-1234"));
});
