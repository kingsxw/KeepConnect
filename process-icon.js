const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  try {
    const inputImage = 'KeepConnect.png';
    
    const sizes = [16, 32, 48, 64, 128, 256, 512];
    
    for (const size of sizes) {
      await sharp(inputImage)
        .resize(size, size, {
          kernel: sharp.kernel.nearest
        })
        .modulate({
          brightness: 1.1,
          saturation: 1.2
        })
        .png()
        .toFile(`icon-${size}x${size}.png`);
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    console.log('All PNG icons generated successfully');
  } catch (error) {
    console.error('Error processing icon:', error);
  }
}

async function generateMacIcon() {
  try {
    const inputImage = 'KeepConnect.png';
    
    await sharp(inputImage)
      .resize(1024, 1024, {
        kernel: sharp.kernel.nearest
      })
      .modulate({
        brightness: 1.1,
        saturation: 1.2
      })
      .png()
      .toFile('icon-1024x1024.png');
    
    console.log('Generated icon-1024x1024.png for macOS');
  } catch (error) {
    console.error('Error generating macOS icon:', error);
  }
}

async function generateWindowsIcon() {
  try {
    const inputImage = 'KeepConnect.png';
    
    await sharp(inputImage)
      .resize(256, 256, {
        kernel: sharp.kernel.nearest
      })
      .modulate({
        brightness: 1.1,
        saturation: 1.2
      })
      .png()
      .toFile('icon-256x256.png');
    
    console.log('Generated icon-256x256.png for Windows');
  } catch (error) {
    console.error('Error generating Windows icon:', error);
  }
}

async function generateLinuxIcon() {
  try {
    const inputImage = 'KeepConnect.png';
    
    await sharp(inputImage)
      .resize(256, 256, {
        kernel: sharp.kernel.nearest
      })
      .modulate({
        brightness: 1.1,
        saturation: 1.2
      })
      .png()
      .toFile('icon-256x256.png');
    
    console.log('Generated icon-256x256.png for Linux');
  } catch (error) {
    console.error('Error generating Linux icon:', error);
  }
}

const command = process.argv[2];

switch (command) {
  case 'png':
    generateIcons();
    break;
  case 'mac':
    generateMacIcon();
    break;
  case 'win':
    generateWindowsIcon();
    break;
  case 'linux':
    generateLinuxIcon();
    break;
  default:
    console.log('Usage: node process-icon.js [png|mac|win|linux]');
    console.log('Running all...');
    generateIcons();
    generateMacIcon();
    generateWindowsIcon();
    generateLinuxIcon();
}