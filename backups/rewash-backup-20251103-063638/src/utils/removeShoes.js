const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clothingCatalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove shoe items by filtering out objects with category 'shoes'
const lines = content.split('\n');
const filteredLines = [];
let inShoeItem = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes("category: 'shoes'")) {
    inShoeItem = true;
    // Find the start of the item
    let start = i;
    while (start > 0 && !lines[start].trim().startsWith('{')) {
      start--;
    }
    // Find the end
    let end = i;
    let depth = 0;
    while (end < lines.length) {
      if (lines[end].includes('{')) depth++;
      if (lines[end].includes('}')) depth--;
      if (depth === 0 && lines[end].includes('},')) break;
      end++;
    }
    // Skip this item
    i = end;
    continue;
  }
  filteredLines.push(lines[i]);
}

content = filteredLines.join('\n');
fs.writeFileSync(filePath, content);
console.log('Removed shoe items from catalog');
