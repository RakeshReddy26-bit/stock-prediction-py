const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clothingCatalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the old price fields with prices object
content = content.replace(/(\s+)washPrice:\s*([\d.]+),\s*dryCleanPrice:\s*([\d.]+),\s*ironPrice:\s*([\d.]+),\s*expressPrice:\s*([\d.]+),/g, '$1prices: { wash: $2, dryClean: $3, iron: $4, express: $5 },', 'g');

fs.writeFileSync(filePath, content);
console.log('Updated price fields to prices object');
