const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clothingCatalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let currentId = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const idMatch = line.match(/id:\s*'([^']+)'/);
  if (idMatch) {
    currentId = idMatch[1];
  } else if (line.startsWith('image:') && line.includes('unsplash.com')) {
    lines[i] = `    image: 'https://ai-generated-images.rewash.com/${currentId}.jpg',`;
  }
}

content = lines.join('\n');
fs.writeFileSync(filePath, content);
console.log('Replaced Unsplash images with AI-generated URLs');
