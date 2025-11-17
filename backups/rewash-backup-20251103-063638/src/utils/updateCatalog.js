const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clothingCatalog.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Function to assign serviceCategory
function getServiceCategory(item) {
  const name = item.name.toLowerCase();
  const category = item.category.toLowerCase();
  if (name.includes('leather') || name.includes('suede') || category.includes('leather')) {
    return 'leather';
  }
  if (name.includes('alteration') || name.includes('repair') || name.includes('tailor')) {
    return 'alterations';
  }
  if (name.includes('shirt') || name.includes('blouse') || name.includes('trouser') || name.includes('pants') || name.includes('suit') || name.includes('blazer') || name.includes('jacket') || name.includes('coat')) {
    return 'iron';
  }
  return 'washing';
}

// Replace the old structure with new
content = content.replace(/(\s+)category:\s*'([^']+)',\s*subcategory:\s*'([^']+)',\s*image:\s*'([^']+)',\s*washPrice:\s*([\d.]+),\s*dryCleanPrice:\s*([\d.]+),\s*ironPrice:\s*([\d.]+),\s*expressPrice:\s*([\d.]+),\s*description:\s*'([^']+)',\s*careInstructions:\s*\[([^\]]+)\]/g, (match, indent, category, subcategory, image, wash, dry, iron, express, desc, care) => {
  const serviceCat = getServiceCategory({ name: '', category });
  return `${indent}category: '${category}',\n${indent}serviceCategory: '${serviceCat}',\n${indent}image: '${image}',\n${indent}prices: { wash: ${wash}, dryClean: ${dry}, iron: ${iron}, express: ${express} },\n${indent}description: '${desc}'`;
});

fs.writeFileSync(filePath, content);
console.log('Updated catalog items to new structure');
