# FOLLOWUP — session handoff

If you are a fresh session: read `CLAUDE.md` first, then this file, then act on "Next step"
immediately.

## Where things stand (2026-10-15)

Two local branches off `master`, **neither pushed nor merged**:

### Branch 1: `chore/package-id-egeozel` (commit `af3a1bc`)

- Package id is now `com.egeozel.metronome`: Android, twa-manifest,
  `public/.well-known/assetlinks.json`, Tauri identifier, related docs.
- `android/app/build.gradle` debug buildType: `.test` suffix, "Chronobeat Test" label.
- Launcher icon: original repo icon (glowing green dial on black). Play icon
  `docs/play-assets/play-store-icon-512.png`, same style, user-approved.
- Play listing draft: `docs/play-listing.md`.

### Branch 2: `feat/brighter-dial` (checked out, **uncommitted**, under phone review)

- `src/ui/metalTexture.ts`: `MetalFinish` (`'dark' | 'vivid' | 'light'`) + `SHADING` table. `vivid`
  = dark-theme dial body: less edge darkening, more sheen, dark lines between the white brush
  lines. LCD and dialHub still use `dark`. User likes the brighter body.
- `src/ui/knob.ts`:
  - Body uses `vivid` (light theme `light`). **Line ~268 has a `// TEMP A/B` `?eski` URL toggle:
    remove it before committing** (keep `theme.light ? 'light' : 'vivid'`).
  - The old thin bezel stroke is replaced by a **polished chamfer**: a conic-gradient band
    (~3.5% of radius) on the face edge, lit from a fixed top-left light (hotspots top-left and
    bottom-right), with thin dark seams on both edges. User: "süper oldu".
  - **Teeth**: `SHOW_TEETH` flag (currently `true`), `TOOTH_COUNT` 120, depth `0.025` of the outer
    radius (old: 72 teeth, `0.054`); tooth width now derives from depth. With `SHOW_TEETH = false`
    the face fills the whole disc. User was unsure about teeth; tiny ones are the current trial.
  - **3D pin** replaces the flat near-black tick: a sail-like tapered fin, wide end toward the BPM
    readout (0.68 of face radius), rounded narrow tip toward the rim (0.92), half-width
    `0.04 * outerRadius`. Two faces split by a ridge, shaded per frame against the fixed top-left
    light; offset-fill cast shadow (no shadowBlur); faint ridge highlight. The last change
    (flip + enlarge) has **not been seen by the user yet**.
- `src/styles.css`: the knob glow (`.knob-wrap::before`) was tried and **removed** at the user's
  request; the file now matches `master`.
- Performance: not measured. User feels no stutter when turning. If needed, measure with
  `chrome://inspect` remote Performance trace, or cache chamfer/pin as sprites.
- Not run since these edits: typecheck, lint, tests (275 passed before the chamfer/pin work).

Dev-server testing: a Vite server (`npx vite --host`) was already running on port 5173.
Phone over USB: `adb reverse tcp:5173 tcp:5173`, then
`adb shell am start -a android.intent.action.VIEW -d http://localhost:5173`. Over Wi-Fi:
http://192.168.1.200:5173.

## Next step

1. Get the user's phone verdict on the flipped/enlarged pin and the tiny teeth (adjust size,
   shape, or drop teeth via `SHOW_TEETH`). Offer the 2.5D side-wall knurl idea if teeth go.
2. Once approved: remove the `TEMP A/B` code, run `npx biome check .`, `npx vitest run`,
   `npm run build`, then commit on `feat/brighter-dial`.
3. Ask for approval to push both branches and merge into `master`.
4. Package id changed, so rebuild the release AAB: in `android/`, PowerShell
   `.\gradlew.bat bundleRelease`. The user signs it with jarsigner in their own terminal
   (keystore `C:\Users\4D\Keystores\metronome\release.keystore`; never ask for the password).
5. Open Play work: feature graphic (1024×500) and at least 2 screenshots; verify the claims in
   `docs/play-listing.md`; Play Console setup; add the Play App Signing SHA-256 to
   `assetlinks.json`; closed testing (12 testers / 14 days).
6. Cleanup: the old `com.psymore.metronome.test` app on the phone can be uninstalled;
   `docs/play-assets/icon-candidates/` and `icon-candidates.zip` are untracked, decide whether to
   delete them.

## Standing instructions

- Never use git worktrees. No `Co-Authored-By` lines in commits.
- Run lint, tests and build before any push. Ask before push, merge, or remote changes.
- Never run `bubblewrap update`: it wipes the launcher icon and the debug buildType.
- The keystore password never goes into the chat; the user signs the AAB.
- Test phone: Redmi Note 10 Pro (MIUI 14, Android 13). `adb install` sometimes fails with
  `INSTALL_FAILED_USER_RESTRICTED`: enable "Install via USB" and tap the on-phone prompt quickly.
- Keep turns economical; no reflexive test/build runs for tiny changes.
