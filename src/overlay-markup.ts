import { Z, UI_FONT, BEAM_SECS } from "./constants.ts";

export function overlayMarkup(): string {
  return `
      <style>
        :host { all: initial; }
        .box, .ring, .label, .tag, .hud, .aura { position: fixed; pointer-events: none; z-index: ${Z}; box-sizing: border-box; }
        .box { display: none; border: 1.5px solid rgba(37,99,235,.9); background: rgba(37,99,235,.06); border-radius: 3px; }
        .ring { border-radius: 3px; animation: ring .5s ease-out 1 forwards; }
        .ring.ltr { animation-name: ring-gray; }
        @keyframes ring      { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,.45); }  100% { box-shadow: 0 0 0 8px rgba(37,99,235,0); } }
        @keyframes ring-gray { 0% { box-shadow: 0 0 0 0 rgba(107,114,128,.5); } 100% { box-shadow: 0 0 0 8px rgba(107,114,128,0); } }
        .tag { transform: translateX(-100%); background: #2563eb; color: #fff; font: 600 10px/1 ${UI_FONT}; letter-spacing: .05em;
               padding: 3px 6px; border-radius: 4px; animation: tag .9s ease-out 1 forwards; }
        .tag.ltr { background: #6b7280; }
        @keyframes tag { 0% { opacity: 0; margin-top: 4px; } 15% { opacity: 1; margin-top: 0; } 70% { opacity: 1; } 100% { opacity: 0; } }
        .label { display: none; direction: ltr; background: #111827; color: #f9fafb; font: 11px/1 ${UI_FONT}; padding: 5px 8px;
                 border-radius: 4px; white-space: nowrap; max-width: 60vw; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
        .label b { color: #93c5fd; font-weight: 600; }
        .hud { visibility: hidden; opacity: 0; left: 50%; bottom: 18px; transform: translate(-50%, calc(100% + 28px)); direction: ltr; background: #fff; color: #111827;
               font: 12px/1 ${UI_FONT}; padding: 9px 13px; border-radius: 9px; white-space: nowrap; max-width: 94vw; overflow: hidden;
               text-overflow: ellipsis; box-shadow: 0 10px 40px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06);
               transition: transform .38s cubic-bezier(.22,1,.36,1), opacity .2s ease, visibility 0s linear .38s; }
        .hud.on { visibility: visible; opacity: 1; transform: translate(-50%, 0); transition-delay: 0s; }
        .hud b { color: #111827; font-weight: 600; }
        .hud kbd { font: 500 12px ${UI_FONT}; letter-spacing: .04em; background: #f3f4f6; color: #374151; padding: 2px 5px; border-radius: 6px; margin: 0 1px; }
        .hud .sep { color: #d1d5db; margin: 0 8px; }
        @media (prefers-color-scheme: dark) {
          .hud { background: rgba(22, 22, 22, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.1); }
          .hud b { color: #fff; }
          .hud kbd { background: rgba(255,255,255,.06); color: #e5e7eb; }
          .hud .sep { color: rgba(255,255,255,.2); }
        }
        .beam { visibility: hidden; opacity: 0; inset: 0; position: fixed; pointer-events: none; z-index: ${Z}; box-sizing: border-box; isolation: isolate;
                transition: opacity .32s ease, visibility 0s linear .32s; }
        .beam.on { visibility: visible; opacity: 1; transition-delay: 0s; }
        .beam::after {
          content: ""; position: absolute; inset: 0; box-sizing: border-box; padding: 1.5px;
          background: conic-gradient(from var(--beam-angle), transparent 0%, transparent 54%, rgba(255,255,255,.1) 57%, rgba(255,255,255,.3) 60%, rgba(255,255,255,.6) 63%, rgba(255,255,255,.75) 66%, rgba(255,255,255,.6) 69%, rgba(255,255,255,.3) 72%, rgba(255,255,255,.1) 75%, transparent 78%, transparent 100%), radial-gradient(ellipse 20vmax 12vmax at 33% -7%, rgb(255, 50, 100), transparent), radial-gradient(ellipse 18vmax 10vmax at 12% -5%, rgb(40, 140, 255), transparent), radial-gradient(ellipse 12vmax 20vmax at 2% 68%, rgb(50, 200, 80), transparent), radial-gradient(ellipse 6vmax 10vmax at 2% 68%, rgb(30, 185, 170), transparent), radial-gradient(ellipse 50vmax 10vmax at 74% 100%, rgb(100, 70, 255), transparent), radial-gradient(ellipse 25vmax 8vmax at 55% 100%, rgb(40, 140, 255), transparent), radial-gradient(ellipse 22vmax 10vmax at 94% 0%, rgb(255, 120, 40), transparent), radial-gradient(ellipse 8vmax 12vmax at 100% 27%, rgb(240, 50, 180), transparent), radial-gradient(ellipse 15vmax 14vmax at 100% 27%, rgb(180, 40, 240), transparent), radial-gradient(ellipse 18vmax 12vmax at 14% 100%, rgb(255, 200, 50), transparent), radial-gradient(ellipse 15vmax 20vmax at 100% 75%, rgb(30, 200, 150), transparent), radial-gradient(ellipse 12vmax 20vmax at 0% 25%, rgb(250, 80, 50), transparent), radial-gradient(ellipse 25vmax 12vmax at 50% -5%, rgb(180, 40, 240), transparent);
          -webkit-mask: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: source-in, xor;
          mask: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: intersect, exclude; pointer-events: none; z-index: 2; opacity: .8; animation: none;
        }
        .beam.on::after { animation: beam-spin ${BEAM_SECS}s linear infinite, beam-reveal .55s cubic-bezier(.22,1,.36,1) both; }
        .beam::before {
          content: ""; position: absolute; inset: 0; box-sizing: border-box;
          background: radial-gradient(ellipse 18vmax 10vmax at 33% -7%, rgba(255,50,100,.45), transparent), radial-gradient(ellipse 16vmax 9vmax at 12% -5%, rgba(40,140,255,.45), transparent), radial-gradient(ellipse 10vmax 18vmax at 2% 68%, rgba(50,200,80,.45), transparent), radial-gradient(ellipse 5vmax 9vmax at 2% 68%, rgba(30,185,170,.45), transparent), radial-gradient(ellipse 46vmax 8vmax at 74% 100%, rgba(100,70,255,.45), transparent), radial-gradient(ellipse 22vmax 7vmax at 55% 100%, rgba(40,140,255,.45), transparent), radial-gradient(ellipse 19vmax 8vmax at 94% 0%, rgba(255,120,40,.45), transparent), radial-gradient(ellipse 6vmax 11vmax at 100% 27%, rgba(240,50,180,.45), transparent), radial-gradient(ellipse 13vmax 12vmax at 100% 27%, rgba(180,40,240,.45), transparent), radial-gradient(ellipse 16vmax 10vmax at 14% 100%, rgba(255,200,50,.45), transparent), radial-gradient(ellipse 13vmax 18vmax at 100% 75%, rgba(30,200,150,.45), transparent), radial-gradient(ellipse 10vmax 18vmax at 0% 25%, rgba(250,80,50,.45), transparent), radial-gradient(ellipse 22vmax 10vmax at 50% -5%, rgba(180,40,240,.45), transparent);
          box-shadow: inset 0 0 9px 1px rgba(255,255,255,.27);
          -webkit-mask-image: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
          -webkit-mask-composite: source-in, source-over;
          mask-image: conic-gradient(from var(--beam-angle), transparent 0%, transparent 30%, rgba(255,255,255,.1) 36%, rgba(255,255,255,.35) 44%, white 52%, white 80%, rgba(255,255,255,.35) 86%, rgba(255,255,255,.1) 92%, transparent 95%, transparent 100%), linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white), linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
          mask-composite: intersect, add; pointer-events: none; z-index: 1; opacity: .6; animation: none;
        }
        .beam.on::before { animation: beam-spin ${BEAM_SECS}s linear infinite, glow-reveal .65s ease-out both; }
        @keyframes beam-spin { 100% { --beam-angle: 360deg; } }
        @keyframes beam-reveal { from { opacity: 0; filter: blur(6px) brightness(1.8); } to { opacity: .8; filter: blur(0) brightness(1); } }
        @keyframes glow-reveal { from { opacity: 0; filter: blur(14px); } to { opacity: .6; filter: blur(0); } }
        @media (prefers-reduced-motion: reduce) { .beam::after, .beam::before { animation: none !important; } .beam, .hud { transition: none !important; } }
      </style>
      <div class="box"></div><div class="label"></div><div class="hud"></div>
      <div class="beam"></div>`;
}
