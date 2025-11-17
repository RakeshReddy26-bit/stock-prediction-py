import { CLOTHING_CATALOG } from '../data/clothingCatalog';

export function validateCatalogImages(): boolean {
  let isValid = true;
  CLOTHING_CATALOG.forEach(item => {
    if (!item.image) {
      console.error(`Item ${item.id} has no image`);
      isValid = false;
    } else if (!item.image.includes(item.id)) {
      console.error(`Item ${item.id} image does not match id: ${item.image}`);
      isValid = false;
    }
  });
  if (isValid) {
    console.log('All catalog images are valid and match the item id');
  }
  return isValid;
}
