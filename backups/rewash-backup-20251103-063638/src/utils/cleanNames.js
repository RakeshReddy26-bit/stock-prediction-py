const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clothingCatalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Clean names by removing prefixes
content = content.replace(/name:\s*'((?:Men's|Women's|Kids'|Unisex)\s+)([^']+)'/g, "name: '$2'");

fs.writeFileSync(filePath, content);
console.log('Cleaned clothing names');
