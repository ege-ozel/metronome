# FOLLOWUP — session handoff

If you are a fresh session: read `CLAUDE.md` first, then this file, then act on "Next step"
immediately.

## Where things stand (2026-10-19)

Both branches are merged into `master` and pushed (`cbc4dd3`); Vercel is live with them
(verified: `boot-knob.webp` serves, `assetlinks.json` names `com.egeozel.metronome`).

- Package id `com.egeozel.metronome` (Android, TWA manifest, assetlinks, Tauri). Debug build
  type: `.test` suffix, "Chronobeat Test".
- Knob (`src/ui/knob.ts`): brighter `vivid` body, polished chamfer, 120 fine teeth
  (`SHOW_TEETH`), 3D sail pin projected per frame with a height-scaled cast shadow.
- Knob art (`scripts/knob-art.cjs` + `scripts/knob-art.html`, `KnobDeps.bare`): renders the real
  knob in headless Chrome (needs `npm run dev`) into the launch splash (5 densities),
  `public/boot-knob.webp` (boot loader), `public/splash-icon-*`, launcher mipmaps, and the Play
  icon (`android/store_icon.png`, `docs/play-assets/play-store-icon-512.png`), and the web and
  Windows icons: favicon, `pwa-*` and `src-tauri/icons/*` use the bare knob with no halo (user's
  choice); maskable and apple-touch use the launcher art on black. Re-run it after any knob
  change. `pwa-assets.config.ts` and `@vite-pwa/assets-generator` were removed. `android-icons.cjs` and `boot-knob.cjs/.svg` were removed.
- Splash and boot loader measured on the phone from a screen recording: same size and centre.
  Remaining Chrome-side behaviour: a ~0.5 s blank between splash and loader while Chrome slides
  in, and the loader starts ~28 dp high for a moment while Chrome settles the viewport. Recheck
  on the Play build.
- Release AAB rebuilt (unsigned): `android/app/build/outputs/bundle/release/app-release.aab`,
  versionCode 1. The user signs it (see below).

Phone test setup still active (turn off when done): `/data/local/tmp/chrome-command-line`
(skips the asset-link check for the debug app) and Chrome flag "Enable command line on
non-rooted devices". Remove with `adb shell rm /data/local/tmp/chrome-command-line` and set the
flag back to Default.

## Next step

1. User signs the AAB in their own terminal (never ask for the password):
   `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore
   C:\Users\4D\Keystores\metronome\release.keystore
   android\app\build\outputs\bundle\release\app-release.aab metronome -signedjar
   android\app-release-bundle.aab`, then `jarsigner -verify -verbose -certs ...`.
2. Play work: feature graphic (1024×500) and at least 2 screenshots; verify the claims in
   `docs/play-listing.md`; Play Console setup; add the Play App Signing SHA-256 to
   `public/.well-known/assetlinks.json`; closed testing (12 testers / 14 days).
3. Cleanup: uninstall `com.psymore.metronome.test` from the phone; decide on the untracked
   `docs/play-assets/icon-candidates/` and `icon-candidates.zip`; local branches
   `chore/package-id-egeozel` and `feat/brighter-dial` are merged and can be deleted.

## Standing instructions

- Never use git worktrees. No `Co-Authored-By` lines in commits.
- Run lint, tests and build before any push. Ask before push, merge, or remote changes.
- Never run `bubblewrap update`: it wipes the launcher icon, the debug buildType and the
  scripted splash.
- The keystore password never goes into the chat; the user signs the AAB.
- Test phone: Redmi Note 10 Pro (MIUI 14, Android 13). `adb install` sometimes fails with
  `INSTALL_FAILED_USER_RESTRICTED`: enable "Install via USB" and tap the on-phone prompt quickly.
- In Git Bash, prefix adb commands that take device paths with `MSYS_NO_PATHCONV=1`.
- Keep turns economical; no reflexive test/build runs for tiny changes.
