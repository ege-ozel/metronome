// Renders every knob image from the real app knob (src/ui/knob.ts), so the splash, the boot loader
// and the Android/Play icons always match the knob the app draws:
//   public/boot-knob.webp                    knob body + mint halo, no glyph (the loader spins it)
//   public/boot-glyph.svg                    the play glyph from public/icon.svg (stays upright)
//   android/app/src/main/res/drawable-*/splash.png, public/splash-icon-*.png
//                                            halo + knob + glyph, the Android/PWA launch splash
//   android/app/src/main/res/mipmap-*/ic_launcher.png, ic_foreground.png
//                                            launcher icon (legacy and adaptive foreground)
//   android/store_icon.png, docs/play-assets/play-store-icon-512.png
//                                            Play Store icon: the launcher knob on black
//   public/favicon.ico, pwa-*.png, src-tauri/icons/*
//                                            favicon, PWA and Windows icons: bare knob, no halo
//   public/maskable-icon-512x512.png, apple-touch-icon-180x180.png
//                                            opaque PWA icons: the launcher knob on black
// Every image uses the same 500-unit frame (knob outer radius 200), so the 216 dp splash and the
// 216 px loader line up exactly. Needs the dev server (npm run dev) and Chrome; run from the repo
// root after changing the knob:  node scripts/knob-art.cjs
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.KNOB_ART_URL || 'http://localhost:5173/scripts/knob-art.html';
const res = 'android/app/src/main/res/';

// The play glyph keeps coming from public/icon.svg, on the same 500-unit frame.
const icon = fs.readFileSync('public/icon.svg', 'utf8');
const glyphStart = icon.indexOf('<!-- Play glyph');
const glyphEnd = icon.lastIndexOf('</svg>');
if (glyphStart < 0 || glyphEnd < 0) throw new Error('public/icon.svg lost its play glyph marker');
const glyphSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 6 500 500">\n  <title>Play</title>\n  ${icon.slice(glyphStart, glyphEnd).trim()}\n</svg>\n`;

const haloSvg = (inner, outer) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 6 500 500"><defs><radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0.74" stop-color="#7fe0bb" stop-opacity="${inner}"/><stop offset="0.84" stop-color="#7fe0bb" stop-opacity="${outer}"/><stop offset="1" stop-color="#7fe0bb" stop-opacity="0"/></radialGradient></defs><circle cx="256" cy="256" r="250" fill="url(#glow)"/></svg>`;

function screenshotKnob(url = URL) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knob-art-'));
  const out = path.join(dir, 'knob.png');
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      '--window-size=500,500',
      '--default-background-color=00000000',
      '--virtual-time-budget=8000',
      `--user-data-dir=${path.join(dir, 'profile')}`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: 'ignore' },
  );
  if (!fs.existsSync(out)) throw new Error(`No screenshot from ${url}: is the dev server running?`);
  return fs.readFileSync(out);
}

async function main() {
  const knob = screenshotKnob(); // 1000 px (the knob caps its pixel ratio at 2), transparent around it
  // The small icons (favicon, PWA, Windows, legacy launcher) leave out the pin's cast shadow:
  // at those sizes it reads as a smudge next to the pin.
  const knobNoShadow = screenshotKnob(`${URL}?noshadow`);
  const size = (await sharp(knob).metadata()).width;
  const svgAt = (svg) =>
    sharp(Buffer.from(svg), { density: (72 * size) / 500 })
      .resize(size, size)
      .png()
      .toBuffer();
  const halo = await svgAt(haloSvg(0.4, 0.14));
  const glyph = await svgAt(glyphSvg);

  const body = await sharp(halo)
    .composite([{ input: knob }])
    .png()
    .toBuffer();
  const full = await sharp(body)
    .composite([{ input: glyph }])
    .png()
    .toBuffer();

  // The loader shows the knob at 216 CSS px: 648 px covers a 3x screen. WebP keeps it near
  // 125 KB (a PNG is close to 1 MB), which matters because the service worker precaches it.
  await sharp(body)
    .resize(648, 648)
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile('public/boot-knob.webp');
  fs.writeFileSync('public/boot-glyph.svg', glyphSvg);

  const splash = { mdpi: 216, hdpi: 324, xhdpi: 432, xxhdpi: 648, xxxhdpi: 864 };
  for (const [density, px] of Object.entries(splash)) {
    await sharp(full)
      .resize(px, px)
      .png({ compressionLevel: 9 })
      .toFile(`${res}drawable-${density}/splash.png`);
  }
  for (const px of [192, 512]) {
    await sharp(full)
      .resize(px, px)
      .png({ compressionLevel: 9 })
      .toFile(`public/splash-icon-${px}x${px}.png`);
  }

  // Launcher icon: a stronger halo so the knob still reads on dark home screens.
  const launcherHalo = await svgAt(haloSvg(0.7, 0.3));
  const launcher = await sharp(launcherHalo)
    .composite([{ input: knob }, { input: glyph }])
    .png()
    .toBuffer();
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const placed = async (input, canvas, scale, background) =>
    sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
      .composite([
        {
          input: await sharp(input)
            .resize(Math.round(canvas * scale))
            .png()
            .toBuffer(),
          gravity: 'center',
        },
      ])
      .png({ compressionLevel: 9 });

  // Legacy launcher icon (Android 5 to 7): the bare knob filling the icon (the 432-unit window
  // around it, as in public/icon.svg).
  const knobWithGlyph = await sharp(knobNoShadow)
    .composite([{ input: glyph }])
    .png()
    .toBuffer();
  const bare = await sharp(knobWithGlyph)
    .extract({
      left: Math.round((size * 34) / 500),
      top: Math.round((size * 34) / 500),
      width: Math.round((size * 432) / 500),
      height: Math.round((size * 432) / 500),
    })
    .png()
    .toBuffer();
  const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [density, px] of Object.entries(legacy)) {
    await sharp(bare)
      .resize(px, px)
      .png({ compressionLevel: 9 })
      .toFile(`${res}mipmap-${density}/ic_launcher.png`);
  }

  // Adaptive foreground (Android 8+). The halo frame at 0.69 of the 108dp layer keeps the knob
  // inside the 66dp safe zone; the background layer is @color/iconBackground (black).
  const adaptive = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
  for (const [density, layer] of Object.entries(adaptive)) {
    await (await placed(launcher, layer, 0.69, transparent)).toFile(
      `${res}mipmap-${density}/ic_foreground.png`,
    );
  }

  // Play Store icon: an opaque 512px square, the launcher knob on black; Play rounds the corners.
  const black = { r: 0, g: 0, b: 0, alpha: 1 };
  const play = await (await placed(launcher, 512, 0.86, black)).toBuffer();
  fs.writeFileSync('android/store_icon.png', play);
  fs.mkdirSync('docs/play-assets', { recursive: true });
  fs.writeFileSync('docs/play-assets/play-store-icon-512.png', play);

  // Favicon, plain PWA icons and the Windows app icon: the bare knob, no halo (at small sizes the
  // halo reads as a blurry shadow).
  // The service worker precaches public/: a palette PNG is about a quarter of the size and looks
  // the same at icon sizes.
  const webPng = { palette: true, quality: 95, effort: 10, compressionLevel: 9 };
  const square = (input, px) => sharp(input).resize(px, px).png({ compressionLevel: 9 });
  for (const px of [64, 192, 512]) {
    await sharp(bare).resize(px, px).png(webPng).toFile(`public/pwa-${px}x${px}.png`);
  }
  const icoSizes = [16, 32, 48];
  const icoPngs = await Promise.all(icoSizes.map((px) => square(bare, px).toBuffer()));
  fs.writeFileSync('public/favicon.ico', toIco(icoPngs, icoSizes));

  // Maskable (Android-installed PWA) and Apple touch icons must be opaque squares: the launcher
  // art on black, like the Android launcher. At 0.8 the halo stays inside the maskable safe circle.
  for (const [file, px, scale] of [
    ['maskable-icon-512x512', 512, 0.8],
    ['apple-touch-icon-180x180', 180, 0.86],
  ]) {
    const icon = await (await placed(launcher, px, scale, black)).toBuffer();
    await sharp(icon).png(webPng).toFile(`public/${file}.png`);
  }

  // Tauri (Windows) icons: `tauri icon` builds icon.ico and the PNG set from one large source.
  const tauriSource = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'knob-art-')), 'icon.png');
  await square(bare, 1024).toFile(tauriSource);
  execFileSync('npx', ['tauri', 'icon', `"${tauriSource}"`], { stdio: 'inherit', shell: true });

  console.log('boot loader, splash, launcher, Play, web and Windows icons written');
}

// A PNG-compressed .ico (supported by every current browser and Windows Vista+).
function toIco(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map((png, i) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(sizes[i] % 256, 0);
    entry.writeUInt8(sizes[i] % 256, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
