// scripts/generate-thumbs.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC_DIR = path.join(__dirname, "..", "img", "car");
const SIZES = [
  { w: 800, dir: "800w" },
  { w: 1280, dir: "1280w" },
  { w: 1600, dir: "1600w" },
];

(async () => {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.toLowerCase().endsWith(".webp"));

  for (const { w, dir } of SIZES) {
    const outDir = path.join(SRC_DIR, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const file of files) {
      const inPath = path.join(SRC_DIR, file);
      const outPath = path.join(outDir, file);
      if (fs.existsSync(outPath)) continue; // skip si déjà généré

      await sharp(inPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);

      console.log(`✅ ${dir}/${file}`);
    }
  }

  console.log("✨ Miniatures générées avec succès !");
})();
