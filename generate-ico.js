const sharp = require('sharp');

async function generateIcoFile() {
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
      .toFile('KeepConnect.ico');
    
    console.log('Generated KeepConnect.ico (256x256)');
  } catch (error) {
    console.error('Error generating ico file:', error);
  }
}

generateIcoFile();