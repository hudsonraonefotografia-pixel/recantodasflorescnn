import { Jimp } from "jimp";
import path from "path";
import fs from "fs";

async function resizeIcon(srcPath, destPath, size) {
  try {
    const image = await Jimp.read(srcPath);
    image.resize({ w: size, h: size });
    await image.write(destPath);
    console.log(`Resized ${destPath} to ${size}x${size}`);
  } catch (err) {
    console.error(`Error resizing ${destPath}:`, err);
  }
}

async function main() {
  // src is the processed transparent logo
  const src = "src/assets/logo-recantodasflores.png";
  
  await resizeIcon(src, "public/icon-192x192.png", 192);
  await resizeIcon(src, "public/icon-512x512.png", 512);
  
  // Create a 64x64 favicon
  await resizeIcon(src, "public/favicon.ico", 64);
  
  console.log("All resized!");
}

main();
