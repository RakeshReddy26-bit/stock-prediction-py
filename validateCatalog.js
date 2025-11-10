const fs = require('fs');

const catalogPath = './src/data/clothingCatalog.ts';
const content = fs.readFileSync(catalogPath, 'utf8');

// Simple validation: check for serviceCategory and prices
const lines = content.split('\n');
let inCatalog = false;
let itemCount = 0;
let invalidCount = 0;
let invalidIds = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (line === 'export const CLOTHING_CATALOG: ClothingItem[] = [') {
    inCatalog = true;
    continue;
  }

  if (inCatalog && line === '];') {
    break;
  }

  if (inCatalog && line.startsWith('{')) {
    itemCount++;
    let hasServiceCategory = false;
    let hasPrices = false;
    let id = '';

    // Check next few lines for required fields
    for (let j = i; j < i + 20 && j < lines.length; j++) {
      const checkLine = lines[j].trim();
      if (checkLine.startsWith('id:')) {
        id = checkLine.split('\'')[1];
      }
      if (checkLine.includes('serviceCategory:')) {
        hasServiceCategory = true;
      }
      if (checkLine.includes('prices:')) {
        hasPrices = true;
      }
      if (checkLine === '},' || checkLine === '}') {
        break;
      }
    }

    if (!hasServiceCategory || !hasPrices) {
      invalidCount++;
      invalidIds.push(id);
    }
  }
}

console.log('Total items:', itemCount);
console.log('Invalid items:', invalidCount);
if (invalidIds.length > 0) {
  console.log('Invalid IDs:', invalidIds.join(', '));
}
