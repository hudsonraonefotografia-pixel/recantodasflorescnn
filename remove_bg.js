import { Jimp } from "jimp";
import path from "path";
import fs from "fs";

async function processImage(imagePath) {
  try {
    console.log("Reading " + imagePath);
    const image = await Jimp.read(imagePath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // We can just use raw data to make it faster and safer against API changes
        const idx = (width * y + x) << 2; // 4 bytes per pixel
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        
        if (r < 20 && g < 20 && b < 20) {
          image.bitmap.data[idx + 3] = 0; // Set alpha to 0
        }
      }
    }
    
    const outPath = imagePath + ".tmp.png";
    await image.write(outPath);
    console.log("Processed " + imagePath);
    
    fs.renameSync(outPath, imagePath);
    
  } catch (err) {
    console.error("Error processing " + imagePath, err);
  }
}

async function main() {
  await processImage("src/assets/logo-recantodasflores.png");
  await processImage("public/icon-192x192.png");
  await processImage("public/icon-512x512.png");
  
  fs.copyFileSync("public/icon-192x192.png", "public/favicon.ico");
  console.log("All done.");
}

main();
