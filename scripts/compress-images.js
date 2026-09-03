/* eslint-disable */
const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '../public/sound-img/img');

async function convertAll() {
  const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.png') && !f.startsWith('.'));

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const inputPath = path.join(IMG_DIR, file);
    const outputName = file.replace('.png', '.webp');
    const outputPath = path.join(IMG_DIR, outputName);

    const statBefore = fs.statSync(inputPath);
    totalBefore += statBefore.size;

    await sharp(inputPath)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const statAfter = fs.statSync(outputPath);
    totalAfter += statAfter.size;

    const reduction = (((statBefore.size - statAfter.size) / statBefore.size) * 100).toFixed(1);
    console.log(`Done: ${file} -> ${outputName}  (${(statBefore.size/1024).toFixed(0)}KB -> ${(statAfter.size/1024).toFixed(0)}KB, -${reduction}%)`);
  }

  console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(1)}MB -> ${(totalAfter/1024/1024).toFixed(1)}MB (-${(((totalBefore-totalAfter)/totalBefore)*100).toFixed(1)}%)`);
}

convertAll().catch(console.error);
