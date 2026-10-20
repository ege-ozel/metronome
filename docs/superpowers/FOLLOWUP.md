# FOLLOWUP — session handoff

If you are a fresh session: read `CLAUDE.md` first, then this file, then act on "Next step"
immediately.

## Where things stand (2026-10-20)

`master` is pushed through `0185361` and live on Vercel. The app is set up in Play Console, and
build 1 is live on the internal testing track.

Play Console (developer account under **egeozeldev@gmail.com**, which is Chrome's Google user
index `u/2`; account ID 8773423919003016698, app ID 4975519516990501530):
- App "Chronobeat: Metronome", package `com.egeozel.metronome`, free, category Music & Audio.
  Contact egeozeldev@gmail.com; website is the Vercel URL.
- App content declarations are all done:
  - privacy policy URL
  - no sign-in needed
  - no ads, no advertising ID
  - content rating via IARC: Everyone / PEGI 3 / all ages
  - target audience 13–15, 16–17 and 18+ (no under-13s, to stay out of the Families policy)
  - data safety: nothing collected or shared
  - not a government app, no financial or health features (the user filled in health)
- Store listing (draft, saved):
  - en-US default: texts, icon, feature graphic, 7 screenshots.
  - tr-TR: Turkish texts, Turkish feature graphic, 7 Turkish screenshots.
  - Screenshot order is circle, poly, light, line, timer, sounds, menu.
- **Automatic protection (installer check) is turned off.** It needs minSdk 24 and our AAB is
  minSdk 21; the user chose to switch the protection off rather than drop Android 5–6.
- Play App Signing is on. The app signing key SHA-256 (`66:13:55:84…`) is now in
  `public/.well-known/assetlinks.json` next to the upload key (`6F:13:77:4F…`), and is live on
  Vercel (verified with curl).
- Internal testing: release `1 (1)` (`android/app-release-bundle.aab`) is published. The testers
  list "Internal testers" holds egeozeldev@gmail.com only. The opt-in link is
  https://play.google.com/apps/internaltest/4701171416306128446. Until review, testers see the
  temporary name "com.egeozel.metronome (unreviewed)".
- `docs/play-listing.md` gained a polyrhythm bullet (EN and TR); the Play listing has it too.

## Next step

1. Phone check: done (2026-10-20). Installed from Play via the opt-in link; the app opens full
   screen with no URL bar, so assetlinks verification passes. One cosmetic issue: the system
   navigation bar at the bottom is white with dark buttons, though `twa-manifest.json` and
   `build.gradle` ask for `#000000`. Diagnosed as Chrome-side: the installed APK carries
   `navigationColor #ff000000` and the NAVIGATION_BAR_COLOR meta-data correctly, but Chrome
   155.0.8059.39 leaves its custom-tab window `navigationBarColor=0` (it is edge-to-edge) and
   paints a light chin. A bare custom tab launched over adb with a red
   `extra.NAVIGATION_BAR_COLOR` also got a white bar, while its toolbar colour was applied.
   Nothing to fix in our code for now; recheck after Chrome updates.
2. Closed testing: the user collects at least 12 testers' Gmail addresses. Create a closed
   testing release (promote build 1) and add the testers. The 14-day clock runs from when at
   least 12 testers have opted in, and the user decides when to start it. That release goes to
   Google review, so ask before sending it.
3. After 14 days: apply for production access in Play Console.
4. Cleanup:
   - Decide on the untracked `docs/play-assets/icon-candidates/`, `icon-candidates.zip` and
     `android/app-release.apks`.
   - Delete the merged local branches `chore/package-id-egeozel` and `feat/brighter-dial`.
   - The user should set the phone's Chrome flag "Enable command line on non-rooted devices"
     back to Default.

## Browser automation notes (Claude in Chrome on Play Console)

- `ctrl+a` in an empty Play Console field types a literal "a"; check field values with
  `javascript_tool` after typing.
- The page can scroll between a click and a typed string. Click the field right before typing,
  then verify.
- Asset uploads go through the asset-library side panel. Use `file_upload` on its hidden file
  input, then press "Add". Screenshots land in an odd order; fix the order by dragging the
  thumbnails.

## Standing instructions

- Reply to the user in Turkish; code, commits and comments stay English.
- Never use git worktrees. No `Co-Authored-By` lines in commits.
- Run lint, tests and build before any push. Ask before push, merge, or remote changes.
- Ask before any Play Console step that sends something to review, publishes, or accepts terms.
- Never run `bubblewrap update`: it wipes the launcher icon, the debug buildType and the
  scripted splash.
- The keystore password never goes into the chat. The user signs the AAB:
  - jarsigner: `C:\Program Files\Java\jdk-17.0.1\bin\jarsigner.exe`
  - keystore: `C:\Users\4D\Keystores\metronome\release.keystore`, alias `metronome`
  - A new build needs a higher `versionCode` in `android/app/build.gradle`.
- Test phone:
  - Redmi Note 10 Pro (MIUI 14, Android 13), 1080×2400.
  - On MIUI, `am start` from adb is blocked. Launch with
    `adb shell monkey -p <package> -c android.intent.category.LAUNCHER 1`.
  - For long adb sessions, run `adb shell svc power stayon usb` and afterwards restore
    `settings put global stay_on_while_plugged_in 0`.
- In Git Bash, prefix adb commands that take device paths with `MSYS_NO_PATHCONV=1`.
- Keep turns economical; no reflexive test/build runs for tiny changes.
