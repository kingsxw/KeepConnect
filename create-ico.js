const sharp = require('sharp');
const fs = require('fs');

async function createIco() {
  try {
    const icon = sharp('icon.png');
    const sizes = [16, 32, 48, 64, 128, 256];
    const buffers = [];
    
    for (const size of sizes) {
      const buffer = await icon.clone().resize(size, size, { kernel: sharp.kernel.nearest }).png().toBuffer();
      buffers.push({ size, buffer });
    }
    
    const iconData = Buffer.concat(buffers.map(b => b.buffer));
    fs.writeFileSync('KeepConnect.ico', iconData);
    console.log('ICO 文件创建成功');
  } catch (error) {
    console.error('创建 ICO 文件失败:', error);
  }
}

createIco();