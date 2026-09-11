// Shared UI styles (settings panel + onboarding card). Injected into each shadow root,
// so nothing here can leak into the host page and the host page can't restyle it.
import { Z, UI_FONT, MONO } from "./constants.ts";

export const UI_CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .panel { position: fixed; top: 24px; right: 24px; width: 380px; max-height: 76vh; display: flex; flex-direction: column;
             background: #fff; color: #111827; font: 13px/1.45 ${UI_FONT}; direction: ltr; border-radius: 16px; overflow: hidden;
             box-shadow: 0 10px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06); z-index: ${Z}; }
    .hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 14px; }
    .hdr .t { font-weight: 600; }
    .hdr .t small { display: block; font-weight: 400; color: #9ca3af; font-size: 11px; margin-top: 1px; }
    .x { border: 0; background: transparent; color: #9ca3af; font-size: 14px; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
    .x svg { fill: currentColor; }
    .x:hover { background: #f3f4f6; color: #111827; }
    .tabs { display: flex; margin: 0 16px 12px; padding: 3.5px; background: #f3f4f6; border-radius: 9999px; gap: 4px; }
    .tab { flex: 1; border: 0; background: transparent; font: inherit; font-size: 13px; font-weight: 500; color: #6b7280; padding: 6px 2px; border-radius: 9999px; cursor: pointer; transition: color 0.15s; }
    .tab.on { background: #fff; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04); }
    .sec { display: none; flex-direction: column; min-height: 0; }
    .sec.on { display: flex; }
    .q-wrap { position: relative; display: flex; flex-direction: column; margin: 0 16px 12px; }
    .q { position: relative; margin: 0; padding: 10px 16px 10px 38px; border: 1px solid #e5e7eb; border-radius: 9999px; font: inherit; outline: none; background: transparent; color: inherit; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; font-size: 13px; }
    .q-wrap svg { position: absolute; left: 16px; top: 12px; fill: #9ca3af; pointer-events: none; z-index: 1; }
    .q:focus { border-color: #d1d5db; background: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
    .list { overflow-y: auto; padding: 0 4px; flex: 1; min-height: 110px; border-bottom: 1px solid transparent; margin: 0; }
    .item { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 16px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin: 0; }
    .item:hover { background: #f3f4f6; }
    .item.on { background: #f3f4f6; } .item.on .sample { color: #111827; }
    .item.on .name::before { content: ""; position: absolute; left: 14px; top: 12px; width: 4px; height: 9px; border: solid #111827; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
    .name { padding-left: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #111827; }
    .sample { font-size: 14px; color: #9ca3af; white-space: nowrap; direction: rtl; }
    .empty { padding: 32px 16px; text-align: center; color: #9ca3af; font-size: 13px; line-height: 1.5; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; }
    .row + .row, .ftr, .q-wrap + .row { border-top: 1px solid #f3f4f6; }
    .row b { display: block; font-weight: 500; }
    .row small, .muted { color: #9ca3af; font-size: 11px; line-height: 1.4; }
    .ftr { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; font-size: 11px; color: #9ca3af; }
    .msg { flex: 1; line-height: 1.4; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid transparent; background: #f3f4f6; color: #111827; font: inherit; font-size: 13px; font-weight: 500; padding: 7px 12px; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s, color 0.15s; }
    .btn svg { fill: currentColor; opacity: 0.6; }
    .btn:hover { background: #e5e7eb; color: #111827; } .btn:disabled { opacity: .5; cursor: default; }
    .btn.set { background: #fff; border: 1px solid #d1d5db; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-radius: 6px; } .btn.set:hover { background: #f9fafb; border-color: #d1d5db; }
    .btn.pri { background: #111827; border-color: #111827; color: #fff; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,.08); border-radius: 6px; } .btn.pri:hover { background: #374151; border-color: #374151; }
    .kbd { min-width: 64px; text-align: center; border: 1px solid #e5e7eb; background: transparent; color: #111827; font: 500 12px ${UI_FONT}; letter-spacing: .04em;
           padding: 4px 6px; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
    .kbd:hover { border-color: #d1d5db; background: #f9fafb; }
    .kbd.rec { border-color: #111827; background: #111827; color: #fff; box-shadow: none; font-weight: 500; font-size: 11px; padding: 4px 8px; border-radius: 6px; }
    .kbd.fixed { cursor: default; color: #9ca3af; }
    .hint { min-height: 16px; padding: 4px 14px 0; font-size: 11px; color: #111827; }

    .sw { position: relative; width: 34px; height: 20px; flex: none; border-radius: 10px; overflow: hidden; }
    .sw input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
    .sw i { position: absolute; inset: 0; background: rgba(0,0,0,0.04); border: 1px solid rgba(17,24,39,0.15); border-radius: 10px; transition: background .15s, border-color .15s; pointer-events: none; }
    .sw i::after { content: ""; position: absolute; top: 1px; left: 1.5px; width: 15px; height: 15px; background: #fff; border-radius: 50%; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
    .sw input:checked + i { background: #111827; border-color: #111827; } .sw input:checked + i::after { transform: translateX(14px); background: #ffffff; box-shadow: none; }
    .rule { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; margin: 0; }
    .rule:hover { background: #f3f4f6; }
    .rule code { flex: 1; font: 11px ${MONO}; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; direction: ltr; text-align: left; background: transparent; }
    .card { position: fixed; right: 24px; bottom: 24px; width: 360px; background: #fff; color: #111827; font: 13px/1.45 ${UI_FONT}; direction: ltr;
            border-radius: 16px; padding: 20px 20px 18px; box-shadow: 0 10px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06); z-index: ${Z}; }
    .card .t { display: flex; align-items: center; gap: 10px; font-weight: 600; margin-bottom: 12px; font-size: 14px; } .card .t small { display: block; font-weight: 400; color: #9ca3af; font-size: 11px; margin-top: 4px; }
    .card .r { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 13px; }
    .card .r.end { border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 14px; }
    .card .r .kbd { min-width: 58px; padding: 4px 6px; font-size: 11px; cursor: default; }
    .card label { display: flex; align-items: center; gap: 10px; margin: 12px 0 0; padding: 6px 0; font-size: 13px; cursor: pointer; }
    .card .b { display: flex; justify-content: flex-end; gap: 8px; margin: 16px 0 0; }
    .card .b.row { display: flex; align-items: center; justify-content: space-between; }
    .card .row { border-top: 1px solid #f3f4f6; margin: 0 -16px; padding: 12px 16px 0; display: flex; align-items: center; justify-content: space-between; }
    @media (prefers-color-scheme: dark) {
      .panel, .card { background: rgba(22, 22, 22, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,0.1); }
      .sample, .ftr, .x, .row small, .muted, .tab, .hdr .t small, .card .t small { color: #888888; }
      .x { color: #888888; } .x:hover { background: rgba(255,255,255,0.06); color: #ffffff; }
      .tabs { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 3.5px; box-shadow: inset 0 1px 2px rgba(0,0,0,.2); }
      .tab:hover:not(.on) { color: #cccccc; }
      .tab.on { background: rgba(255,255,255,0.08); color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,.2), 0 0 0 1px rgba(255,255,255,0.04); }
      .q { background: rgba(0,0,0,0.2); border-color: rgba(255,255,255,0.1); } .q:focus { background: transparent; border-color: rgba(255,255,255,0.3); box-shadow: 0 0 0 3px rgba(255,255,255,0.05); }
      .q-wrap svg { fill: #6b7280; }
      .item:hover, .rule:hover { background: rgba(255,255,255,0.06); } .item.on { background: rgba(255,255,255,0.1); } .item.on .sample { color: #ffffff; }
      .item.on .name::before { border-color: #ffffff; left: 14px; }
      .name { color: #ffffff; }
      .sample { color: #888888; }
      .ftr, .row + .row, .q-wrap + .row { border-top: 1px solid rgba(255,255,255,0.06); }
      .card .row { border-color: rgba(255,255,255,0.06); }
      .card .r.end { border-color: rgba(255,255,255,0.06); }
      .btn { background: rgba(255,255,255,0.06); border: 1px solid transparent; color: #e5e7eb; box-shadow: none; font-weight: 500; border-radius: 6px; } .btn:hover { background: rgba(255,255,255,0.1); border-color: transparent; color: #ffffff; }
      .btn.set { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #fff; box-shadow: none; border-radius: 6px; } .btn.set:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.25); }
      .kbd { background: rgba(255,255,255,0.06); border-color: transparent; color: #a0a0a0; box-shadow: none; border-radius: 6px; } .kbd:hover { background: rgba(255,255,255,0.1); border-color: transparent; color: #ffffff; }
      .btn.pri { background: #ffffff; border-color: #ffffff; color: #111827; font-weight: 500; box-shadow: 0 1px 2px rgba(0,0,0,.15); border-radius: 6px; } .btn.pri:hover { background: #f3f4f6; border-color: #f3f4f6; }
      .btn svg { fill: currentColor; opacity: 1; }
      .kbd.rec { background: #e5e5e5; color: #111; border-color: #e5e5e5; box-shadow: none; font-weight: 500; font-size: 11px; padding: 4px 8px; border-radius: 6px; } .kbd.fixed { color: #888; background: transparent; border-color: #2a2a2a; box-shadow: none; }
      .hint { color: #ffffff; } .sw i { background: rgba(0,0,0,0.2); border: 1px solid #444; } .sw i::after { background: #888888; box-shadow: none; top: 1px; left: 1.5px; width: 15px; height: 15px; } .sw input:checked + i { background: #ededed; border-color: #ededed; } .sw input:checked + i::after { background: #111; transform: translateX(14px); }
      .rule code { color: #888888; background: transparent; }
    }`;
