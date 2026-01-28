const sharp = require('sharp');
const fs = require('fs');

const svgContent = fs.readFileSync('icon.svg', 'utf-8');

const sizes = [16, 32, 48, 64, 128, 256, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(`icon-${size}x${size}.png`);
    console.log(`Generated icon-${size}x${size}.png`);
  }
  
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile('icon.png');
  console.log('Generated icon.png');
  
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile('icon@2x.png');
  console.log('Generated icon@2x.png');
}

generateIcons().catch(console.error);