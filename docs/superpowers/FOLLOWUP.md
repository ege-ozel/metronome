# FOLLOWUP — session handoff

If you are a fresh session: read `CLAUDE.md` first, then this file, then act on "Next step"
immediately.

## Where things stand (2026-10-19)

`master` is pushed through `b4825eb` and live on Vercel; two later commits (`e1cee83` and this
note) are local only. Today's work:

- App renamed to **Chronobeat** everywhere visible (header, page title, PWA manifest
  `Chronobeat: Metronome` / `Chronobeat`, Windows productName, privacy policy). Built-in sound
  names such as "Metronome Click A" stay as they are.
- Light theme in amber: knob ring blends from orange at the rim to the page cream at the LCD
  (`renderBandedMetalTexture` with a smoothstep seam), amber dial nodes, accents and +/- buttons.
- Small icons (favicon, `pwa-*`, Tauri icons, legacy Android launcher) render the knob without
  the pin's cast shadow (`KnobDeps.noPinShadow`, `scripts/knob-art.html?noshadow`). The splash,
  boot loader, adaptive launcher, maskable/apple and Play icons keep the shadow (user's choice:
  "önemli değil"). Note: re-running `scripts/knob-art.cjs` rewrites every image (random grooves);
  revert the ones you did not mean to change.
- Signature button's POLY tag is translated (`viz.poly`, uppercased in CSS: POLY / POLİ).
  "Bar" stays "Bar" in Turkish and sound names stay English, on purpose.
- Windows installer rebuilt: `src-tauri/target/release/bundle/nsis/Chronobeat_0.1.0_x64-setup.exe`.
- Signed release bundle: `android/app-release-bundle.aab` (`com.egeozel.metronome`, versionCode
  1). It predates the shadowless legacy launcher icon; harmless (Android 5–7 only).

Play assets (all committed, in `docs/play-assets/`):
- Feature graphic: `feature-graphic-1024x500.png` and `-tr.png`, rendered from
  `scripts/feature-graphic.html` (`?lang=tr`); the render command is in that file's comment.
- Phone screenshots: `screenshots/en/` and `screenshots/tr/`, 7 each (circle, poly, light,
  line, timer, sounds, menu), 1080×2160 with the status and nav bars cropped (Play's 2:1 limit).
- `docs/play-listing.md` lists them; listing texts are there in English and Turkish.

Phone state: the release TWA (`com.egeozel.metronome`) is no longer installed; the user
reinstalled the Chrome web app (WebAPK `org.chromium.webapk.a6838f89fc4513e17_v2`). On MIUI,
`am start` from adb is blocked; launch with `adb shell monkey -p <package> -c
android.intent.category.LAUNCHER 1`. The Chrome flag "Enable command line on non-rooted
devices" is still on (shows a warning toast) — the user should set it back to Default.

## Next step

1. Play Console: create the app, paste the listing texts from `docs/play-listing.md` (check
   each feature line against the live app first), upload the feature graphics and screenshots
   per language, upload `android/app-release-bundle.aab`.
2. After the first upload, add the Play App Signing SHA-256 to
   `public/.well-known/assetlinks.json` (keep the upload-key one), push, verify.
3. Closed testing: 12 testers for 14 days before production access.
4. Cleanup: decide on the untracked `docs/play-assets/icon-candidates/`, `icon-candidates.zip`
   and `android/app-release.apks`; delete merged local branches `chore/package-id-egeozel` and
   `feat/brighter-dial`.

## Standing instructions

- Reply to the user in Turkish; code, commits and comments stay English.
- Never use git worktrees. No `Co-Authored-By` lines in commits.
- Run lint, tests and build before any push. Ask before push, merge, or remote changes.
- Never run `bubblewrap update`: it wipes the launcher icon, the debug buildType and the
  scripted splash.
- The keystore password never goes into the chat; the user signs the AAB
  (`C:\Program Files\Java\jdk-17.0.1\bin\jarsigner.exe`, keystore
  `C:\Users\4D\Keystores\metronome\release.keystore`, alias `metronome`).
- Test phone: Redmi Note 10 Pro (MIUI 14, Android 13), 1080×2400. `adb install` sometimes fails
  with `INSTALL_FAILED_USER_RESTRICTED`: enable "Install via USB" and tap the on-phone prompt.
  For long adb sessions use `adb shell svc power stayon usb` and restore
  `settings put global stay_on_while_plugged_in 0` afterwards.
- In Git Bash, prefix adb commands that take device paths with `MSYS_NO_PATHCONV=1`.
- Keep turns economical; no reflexive test/build runs for tiny changes.
