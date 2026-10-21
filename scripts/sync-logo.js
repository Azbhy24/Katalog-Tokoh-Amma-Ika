import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function processLogo() {
  const rootLogoPath = path.resolve('amma_ika_logo_transparan.png');
  const publicDir = path.resolve('public');
  const publicLogoPath = path.resolve(publicDir, 'amma_ika_logo_transparan.png');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Cek keberadaan logo di root atau public
  let sourceLogoPath = null;
  if (fs.existsSync(rootLogoPath)) {
    sourceLogoPath = rootLogoPath;
    // Salin ke public agar dapat diakses via URL /amma_ika_logo_transparan.png di Vite/Vercel
    fs.copyFileSync(rootLogoPath, publicLogoPath);
    console.log('✅ File amma_ika_logo_transparan.png disalin dari root ke public/');
  } else if (fs.existsSync(publicLogoPath)) {
    sourceLogoPath = publicLogoPath;
    console.log('✅ File amma_ika_logo_transparan.png ditemukan di public/');
  } else {
    console.warn('⚠️ File amma_ika_logo_transparan.png belum ditemukan di root repositori atau public/. Melewati pembuatan turunan ikon.');
    return;
  }

  try {
    const image = sharp(sourceLogoPath);
    const metadata = await image.metadata();
    console.log(`ℹ️ Dimensi logo asli: ${metadata.width}x${metadata.height} (${metadata.format})`);

    // 2. Buat turunan ikon PWA berukuran 192x192
    await sharp(sourceLogoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.resolve(publicDir, 'pwa-192x192.png'));
    console.log('✅ pwa-192x192.png berhasil dibuat dari logo asli.');

    // 3. Buat turunan ikon PWA berukuran 512x512
    await sharp(sourceLogoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.resolve(publicDir, 'pwa-512x512.png'));
    console.log('✅ pwa-512x512.png berhasil dibuat dari logo asli.');

    // 4. Buat turunan ikon Maskable 512x512 (Safe-zone padding 15% untuk launcher Android)
    // Logo asli diposisikan di tengah area aman 80% (sekitar 410x410) di atas kanvas 512x512
    const safeZoneSize = Math.round(512 * 0.78);
    const resizedForMaskable = await sharp(sourceLogoPath)
      .resize(safeZoneSize, safeZoneSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 255, g: 140, b: 0, alpha: 1 } // Latar belakang oranye brand Warung Amma Ika
      }
    })
      .composite([{ input: resizedForMaskable, gravity: 'center' }])
      .png()
      .toFile(path.resolve(publicDir, 'pwa-maskable-512x512.png'));
    console.log('✅ pwa-maskable-512x512.png berhasil dibuat dari logo asli.');

    // 5. Buat apple-touch-icon 180x180
    await sharp(sourceLogoPath)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 140, b: 0, alpha: 1 }
      })
      .png()
      .toFile(path.resolve(publicDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png berhasil dibuat dari logo asli.');

    // 6. Buat favicon.png 48x48
    await sharp(sourceLogoPath)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.resolve(publicDir, 'favicon.png'));
    console.log('✅ favicon.png berhasil dibuat dari logo asli.');

  } catch (err) {
    console.error('❌ Gagal memproses turunan logo:', err);
  }
}

processLogo();
