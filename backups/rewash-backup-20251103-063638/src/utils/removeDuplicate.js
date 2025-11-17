const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clothingCatalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove duplicate serviceCategory
content = content.replace(/serviceCategory: 'washing',\n    serviceCategory: 'washing',/g, "serviceCategory: 'washing',");

fs.writeFileSync(filePath, content);
console.log('Removed duplicate serviceCategory');
