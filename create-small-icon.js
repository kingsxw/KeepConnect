const sharp = require('sharp');

async function createSmallIcon() {
  try {
    await sharp('icon.png')
      .resize(16, 16, {
        kernel: sharp.kernel.nearest
      })
      .png()
      .toFile('icon-16x16.png');
    console.log('16x16 图标创建成功');
  } catch (error) {
    console.error('创建 16x16 图标失败:', error);
  }
}

createSmallIcon();