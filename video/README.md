# Argora — demo video (Remotion)

A competition-grade promo/demo built with [Remotion](https://remotion.dev):
your **real screen recordings** composited with **animated IBM-Carbon
subtitles**, IBM Plex type, synthetic intro/outro motion graphics, a progress
bar, and an optional **ElevenLabs AI voiceover**.

It renders end-to-end *right now* with styled placeholders — record the clips
and add a voice key whenever you're ready; nothing blocks.

```
video/
├── src/
│   ├── data/script.mjs        ← single source of truth: captions, narration, timing
│   ├── data/clips-present.mjs ← list step ids whose recording you've added
│   ├── data/audio-present.mjs ← auto-managed by the voiceover script
│   ├── theme/ibm.ts           ← IBM Carbon palette + Plex fonts + accents
│   ├── components/            ← caption, chip, clip stage, intro/outro, …
│   ├── Demo.tsx / Root.tsx    ← the composition
│   └── timeline.ts            ← per-scene + total duration
├── scripts/generate-voiceover.mjs
└── public/{clips,audio}/      ← your recordings + generated voiceover
```

## 1. Install & preview

```bash
cd video
npm install
npm run studio        # opens Remotion Studio — scrub the whole film live
```

At this point every step shows a styled **placeholder** telling you which file
to drop in. That's expected.

## 2. Record the 10 clips

Record the app at **1920×1080** (or 16:9), one short clip per step, and save as
`public/clips/step-01.mp4 … step-10.mp4`. Then list the ones you've done in
`src/data/clips-present.mjs`:

```js
export const present = new Set(["step-01", "step-02", "step-03"]);
```

Only listed steps use footage; the rest stay on placeholders. Clips can be
`.mp4`/`.mov`/`.webm`. They're shown inside a browser-window frame with a subtle
push-in, so raw captures look intentional.

### Shot list

The captions/voiceover are already written to match these shots. Follow the same
10 steps you planned — open the **AGI** debate first, then:

| # | Record this | Notes |
|---|-------------|-------|
| 01 | The discussions list | Slow hover over a few debate cards |
| 02 | Open AGI debate, zoom to the root thesis | Let the tree settle; this scene is the longest |
| 03 | Add an argument to the **root thesis** | Text below · side **For / "Za"** |
| 04 | The new argument appearing, then a **thumbs-down** on it | Linger on the new node, click 👎, show the weight badge tick up (For + Against = weight; down-votes raise it too) |
| 05 | AI-generate a **For** child of that argument | Pick a model, hit generate |
| 06 | Pan along one branch of the root | Smooth horizontal pan |
| 07 | Lasso a subtree → AI synthesis | Draw the lasso, show the summary panel |
| 08 | Trigger the **duplicate** guard | Text below · side **For / "Za"** |
| 09 | Trigger the **side-mismatch** flag, then click **"Switch to Against"** | Text below · side **For / "Za"** · linger 2–3s on the red node landing. Retakes: the accepted argument persists — delete it (trash icon) or reword before the next take, or the duplicate dialog fires instead |
| 10 | Toggle **dark mode** | End on the dark theme |

### Exact text to type (so detection actually fires)

**Step 03 — add to the root thesis, side For / "Za":**
> A superintelligence could flood our information channels with tailored
> persuasion, dissolving the shared reality we would need to even recognise a
> threat and coordinate a response.

*(novel → no duplicate, clearly pro-thesis → no side warning.)*

**Step 08 — add to the root thesis, side For / "Za" (duplicate demo):**
> Military rivalry between great powers will force the hasty rollout of
> weaponised AGI that slips beyond human control.

Duplicates the existing node *"Geopolitical and military competition will drive
rapid deployment of weaponized AGI, escaping human control."* Attach at the
**root** (the guard skips the direct parent and compares within the same side,
threshold 0.75 cosine).

**Step 09 — add to the root thesis, side For / "Za" (deliberately wrong):**
> Fears of an AGI apocalypse are science fiction — today's systems are narrow
> statistical tools with no goals, no agency, and no path to seizing control of
> anything.

Content refutes the thesis while you tagged it "For" → the AI side-check pops
the mismatch dialog suggesting **Against / "Przeciw."** Keep it on the **root**:
the check is thesis-relative, so root is where it reads cleanly.

## 3. AI voiceover (optional)

```bash
cp .env.example .env      # add ELEVENLABS_API_KEY (+ optional voice/model)
npm run voiceover         # writes public/audio/*.mp3 and updates audio-present.mjs
```

Timing is driven by the hand-tuned `seconds` per scene, not the audio length —
so if a line feels rushed or long, nudge that scene's `seconds` in
`src/data/script.mjs`. Re-run `npm run voiceover` after editing any narration.

## 4. Render

```bash
npm run render            # → out/brainstorm-demo.mp4  (1080p, H.264)
```

First render downloads a headless Chromium (one-time). For 4K, add
`--scale=2`. For a quick single-frame sanity check: `npm run still`.

## Customisation

- **Colors** — `src/theme/ibm.ts`. All chrome uses IBM Carbon blue/cyan/purple/
  teal/magenta. Green & red are intentionally *not* used in the chrome, so they
  stay meaningful (pro/against) inside your footage.
- **Captions & narration** — `src/data/script.mjs`. Captions are short and
  title-style; narration is a fuller spoken line. Edit freely.
- **Pacing** — `seconds` per scene in `script.mjs` (or `timeline.ts` for the
  formula).

## Notes / caveats

- **Language.** Captions + narration are English. The app's own AI *generate*
  and *synthesis* features output **Polish** (hard-coded in the API prompts), so
  the on-screen text inside steps 05 and 07 will be Polish. That's the real
  product behaviour — fine for a demo, just don't be surprised. Ask if you want
  those two prompts switched to follow the UI language.
- **Side-check is thesis-relative** while the graph is parent-relative; they
  coincide at the root, which is why steps 03/08/09 all attach there.
