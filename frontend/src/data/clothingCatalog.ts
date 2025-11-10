export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  serviceCategory: 'washing' | 'iron' | 'leather' | 'alterations';
  image: string;
  prices: { wash?: number; dryClean?: number; iron?: number; express?: number; };
  description: string;
}

export const CLOTHING_CATALOG: ClothingItem[] = [
  // MEN'S CLOTHING (20 items)
  {
    id: 'mens-dress-shirt',
    name: 'Dress Shirt',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-dress-shirt.jpg',
    prices: {
      wash: 3.50,
      dryClean: 5.00,
      iron: 2.50,
      express: 8.00,
    },
    description: 'Professional dress shirt',
  },
  {
    id: 'mens-suit-jacket',
    name: 'Suit Jacket',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-suit-jacket.jpg',
    prices: {
      dryClean: 12.00,
      express: 20.00,
    },
    description: 'Business suit jacket',
  },
  {
    id: 'mens-trousers',
    name: 'Dress Pants/Trousers',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-trousers.jpg',
    prices: {
      wash: 4.00,
      dryClean: 7.00,
      iron: 3.00,
      express: 10.00,
    },
    description: 'Formal dress pants',
  },
  {
    id: 'mens-jeans',
    name: 'Jeans',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-jeans.jpg',
    prices: {
      wash: 4.00,
      dryClean: 6.00,
      iron: 2.00,
      express: 8.00,
    },
    description: 'Denim jeans',
  },
  {
    id: 'mens-polo',
    name: 'Polo Shirt',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-polo.jpg',
    prices: {
      wash: 3.00,
      dryClean: 4.50,
      iron: 2.00,
      express: 6.00,
    },
    description: 'Casual polo shirt',
  },
  {
    id: 'mens-tshirt',
    name: 'T-Shirt',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-tshirt.jpg',
    prices: {
      wash: 2.00,
      dryClean: 3.50,
      iron: 1.50,
      express: 4.50,
    },
    description: 'Basic t-shirt',
  },
  {
    id: 'mens-sweater',
    name: 'Sweater/Pullover',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-sweater.jpg',
    prices: {
      wash: 5.00,
      dryClean: 8.00,
      iron: 3.50,
      express: 12.00,
    },
    description: 'Wool or cotton sweater',
  },
  {
    id: 'mens-cardigan',
    name: 'Cardigan',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-cardigan.jpg',
    prices: {
      wash: 5.00,
      dryClean: 8.00,
      iron: 3.00,
      express: 11.00,
    },
    description: 'Button-up cardigan',
  },
  {
    id: 'mens-blazer',
    name: 'Blazer',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-blazer.jpg',
    prices: {
      dryClean: 10.00,
      express: 18.00,
    },
    description: 'Sport coat or blazer',
  },
  {
    id: 'mens-overcoat',
    name: 'Overcoat/Topcoat',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-overcoat.jpg',
    prices: {
      dryClean: 15.00,
      express: 25.00,
    },
    description: 'Long formal coat',
  },
  {
    id: 'mens-leather-jacket',
    name: 'Leather Jacket',
    category: 'mens',
    serviceCategory: 'leather',
    image: 'https://images.example.com/mens-leather-jacket.jpg',
    prices: {
      dryClean: 18.00,
      express: 30.00,
    },
    description: 'Genuine leather jacket',
  },
  {
    id: 'mens-tie',
    name: 'Necktie',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-tie.jpg',
    prices: {
      dryClean: 3.00,
      express: 5.00,
    },
    description: 'Silk or polyester necktie',
  },
  {
    id: 'mens-underwear',
    name: 'Underwear/Boxers',
    category: 'mens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/mens-underwear.jpg',
    prices: {
      wash: 1.50,
      express: 3.00,
    },
    description: 'Cotton underwear',
  },  {
    id: 'mens-socks',
    name: 'Socks',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-socks.jpg',

    prices: { wash: 1.00, dryClean: 0, iron: 0, express: 2.00 },

    description: 'Cotton socks',
  },
  {
    id: 'mens-shorts',
    name: 'Shorts',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-shorts.jpg',

    prices: { wash: 3.00, dryClean: 4.00, iron: 1.50, express: 6.00 },

    description: 'Casual shorts',
  },
  {
    id: 'mens-hoodie',
    name: 'Hoodie',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-hoodie.jpg',

    prices: { wash: 4.00, dryClean: 6.00, iron: 2.00, express: 8.00 },

    description: 'Cotton hoodie',
  },
  {
    id: 'mens-coat',
    name: 'Winter Coat',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-coat.jpg',

    prices: { wash: 0, dryClean: 20.00, iron: 8.00, express: 35.00 },

    description: 'Heavy winter coat',
  },
  {
    id: 'mens-hat',
    name: 'Hat/Cap',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-hat.jpg',

    prices: { wash: 2.00, dryClean: 3.00, iron: 0, express: 4.00 },

    description: 'Baseball cap or fedora',
  },
  {
    id: 'mens-gloves',
    name: 'Gloves',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-gloves.jpg',

    prices: { wash: 3.00, dryClean: 5.00, iron: 0, express: 6.00 },

    description: 'Leather or fabric gloves',
  },
  {
    id: 'mens-scarf',
    name: 'Scarf',
    category: 'mens',
    serviceCategory: 'washing',

    image: 'https://images.example.com/mens-scarf.jpg',

    prices: { wash: 4.00, dryClean: 6.00, iron: 2.00, express: 8.00 },

    description: 'Wool or cotton scarf',
  },

  // WOMEN'S CLOTHING (18 items)
  {
    id: 'womens-blouse',
    name: 'Blouse',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-blouse.jpg',
    prices: {
      wash: 3.50,
      dryClean: 5.00,
      iron: 2.50,
      express: 8.00,
    },
    description: 'Dressy womens blouse',
  },
  {
    id: 'womens-skirt',
    name: 'Skirt',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-skirt.jpg',
    prices: {
      wash: 3.00,
      dryClean: 5.00,
      iron: 2.50,
      express: 7.00,
    },
    description: 'Womens skirt',
  },
  {
    id: 'womens-evening-gown',
    name: 'Evening Gown',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-evening-gown.jpg',
    prices: {
      wash: 0,
      dryClean: 20.00,
      iron: 8.00,
      express: 35.00,
    },
    description: 'Formal evening gown',
  },
  {
    id: 'womens-jeans',
    name: 'Jeans',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-jeans.jpg',
    prices: {
      wash: 4.00,
      dryClean: 6.00,
      iron: 2.00,
      express: 8.00,
    },
    description: 'Women\'s denim jeans',
  },
  {
    id: 'womens-tshirt',
    name: 'T-Shirt',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-tshirt.jpg',
    prices: {
      wash: 2.00,
      dryClean: 3.50,
      iron: 1.50,
      express: 4.50,
    },
    description: 'Women\'s t-shirt',
  },
  {
    id: 'womens-sweater',
    name: 'Sweater',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-sweater.jpg',
    prices: {
      wash: 5.00,
      dryClean: 8.00,
      iron: 3.50,
      express: 12.00,
    },
    description: 'Women\'s sweater',
  },
  {
    id: 'womens-cardigan',
    name: 'Cardigan',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-cardigan.jpg',
    prices: {
      wash: 5.00,
      dryClean: 8.00,
      iron: 3.00,
      express: 11.00,
    },
    description: 'Women\'s cardigan',
  },
  {
    id: 'womens-blazer',
    name: 'Blazer',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-blazer.jpg',
    prices: {
      wash: 0,
      dryClean: 10.00,
      iron: 4.50,
      express: 18.00,
    },
    description: 'Women\'s blazer',
  },
  {
    id: 'womens-coat',
    name: 'Winter Coat',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-coat.jpg',
    prices: {
      wash: 0,
      dryClean: 20.00,
      iron: 8.00,
      express: 35.00,
    },
    description: 'Women\'s winter coat',
  },
  {
    id: 'womens-leather-jacket',
    name: 'Leather Jacket',
    category: 'womens',
    serviceCategory: 'leather',
    image: 'https://images.example.com/womens-leather-jacket.jpg',
    prices: {
      wash: 0,
      dryClean: 18.00,
      iron: 0,
      express: 30.00,
    },
    description: 'Women\'s leather jacket',
  },
  {
    id: 'womens-scarf',
    name: 'Scarf',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-scarf.jpg',
    prices: {
      wash: 4.00,
      dryClean: 6.00,
      iron: 2.00,
      express: 8.00,
    },
    description: 'Women\'s scarf',
  },
  {
    id: 'womens-hat',
    name: 'Hat',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-hat.jpg',
    prices: {
      wash: 2.00,
      dryClean: 3.00,
      iron: 0,
      express: 4.00,
    },
    description: 'Women\'s hat',
  },
  {
    id: 'womens-gloves',
    name: 'Gloves',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-gloves.jpg',
    prices: {
      wash: 3.00,
      dryClean: 5.00,
      iron: 0,
      express: 6.00,
    },
    description: 'Women\'s gloves',
  },
  {
    id: 'womens-underwear',
    name: 'Underwear',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-underwear.jpg',
    prices: {
      wash: 1.50,
      dryClean: 0,
      iron: 0,
      express: 3.00,
    },
    description: 'Women\'s underwear',
  },
  {
    id: 'womens-bra',
    name: 'Bra',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-bra.jpg',
    prices: {
      wash: 2.00,
      dryClean: 0,
      iron: 0,
      express: 4.00,
    },
    description: 'Women\'s bra',
  },
  {
    id: 'womens-socks',
    name: 'Socks',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-socks.jpg',
    prices: {
      wash: 1.00,
      dryClean: 0,
      iron: 0,
      express: 2.00,
    },
    description: 'Women\'s socks',
  },
  {
    id: 'womens-shorts',
    name: 'Shorts',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-shorts.jpg',
    prices: {
      wash: 3.00,
      dryClean: 4.00,
      iron: 1.50,
      express: 6.00,
    },
    description: 'Women\'s shorts',
  },
  {
    id: 'womens-hoodie',
    name: 'Hoodie',
    category: 'womens',
    serviceCategory: 'washing',
    image: 'https://images.example.com/womens-hoodie.jpg',
    prices: {
      wash: 4.00,
      dryClean: 6.00,
      iron: 2.00,
      express: 8.00,
    },
    description: 'Women\'s hoodie',
  },

  // KIDS CLOTHING (15 items)
  {
    id: 'kids-tshirt',
    name: 'Kids T-Shirt',
    category: 'kids',
    serviceCategory: 'washing',
    image: 'https://images.example.com/kids-tshirt.jpg',
    prices: { wash: 1.50, dryClean: 2.50, iron: 1.00, express: 3.00 },
    description: 'Children\'s t-shirt',
  },
  {
    id: 'kids-pants',
    name: 'Kids Pants',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-pants.jpg',
    prices: { wash: 2.50, dryClean: 4.00, iron: 1.50, express: 5.00 },
    description: 'Children\'s pants',
  },
  {
    id: 'kids-jeans',
    name: 'Kids Jeans',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-jeans.jpg',
    prices: { wash: 3.00, dryClean: 4.50, iron: 1.50, express: 6.00 },
    description: 'Children\'s jeans',
  },
  {
    id: 'kids-dress',
    name: 'Kids Dress',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-dress.jpg',
    prices: { wash: 4.00, dryClean: 6.00, iron: 2.50, express: 8.00 },
    description: 'Children\'s dress',
  },
  {
    id: 'kids-shirt',
    name: 'Kids Shirt',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-shirt.jpg',
    prices: { wash: 2.00, dryClean: 3.00, iron: 1.50, express: 4.00 },
    description: 'Children\'s shirt',
  },
  {
    id: 'kids-jacket',
    name: 'Kids Jacket',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-jacket.jpg',
    prices: { wash: 3.50, dryClean: 5.50, iron: 2.00, express: 7.00 },
    description: 'Children\'s jacket',
  },
  {
    id: 'kids-sweater',
    name: 'Kids Sweater',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-sweater.jpg',
    prices: { wash: 3.50, dryClean: 5.50, iron: 2.00, express: 7.00 },
    description: 'Children\'s sweater',
  },
  {
    id: 'kids-shorts',
    name: 'Kids Shorts',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-shorts.jpg',
    prices: { wash: 2.00, dryClean: 3.00, iron: 1.00, express: 4.00 },
    description: 'Children\'s shorts',
  },
  {
    id: 'kids-socks',
    name: 'Kids Socks',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-socks.jpg',
    prices: { wash: 0.75, dryClean: 0, iron: 0, express: 1.50 },
    description: 'Children\'s socks',
  },
  {
    id: 'kids-underwear',
    name: 'Kids Underwear',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-underwear.jpg',
    prices: { wash: 1.00, dryClean: 0, iron: 0, express: 2.00 },
    description: 'Children\'s underwear',
  },
  {
    id: 'kids-hat',
    name: 'Kids Hat',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-hat.jpg',
    prices: { wash: 1.50, dryClean: 2.00, iron: 0, express: 3.00 },
    description: 'Children\'s hat',
  },
  {
    id: 'kids-gloves',
    name: 'Kids Gloves',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-gloves.jpg',
    prices: { wash: 2.00, dryClean: 3.00, iron: 0, express: 4.00 },
    description: 'Children\'s gloves',
  },
  {
    id: 'kids-scarf',
    name: 'Kids Scarf',
    category: 'kids',
    serviceCategory: 'washing',    image: 'https://images.example.com/kids-scarf.jpg',
    prices: { wash: 2.50, dryClean: 4.00, iron: 1.50, express: 5.00 },
    description: 'Children\'s scarf',
  },
  {
    id: 'kids-uniform-shirt',
    name: 'School Uniform Shirt',
    category: 'kids',
    serviceCategory: 'washing',

    image: 'https://images.example.com/kids-uniform-shirt.jpg',

    prices: { wash: 2.50, dryClean: 4.00, iron: 2.00, express: 5.00 },

    description: 'School uniform shirt',
  },
  {
    id: 'kids-uniform-pants',
    name: 'School Uniform Pants',
    category: 'kids',
    serviceCategory: 'washing',

    image: 'https://images.example.com/kids-uniform-pants.jpg',

    prices: { wash: 3.00, dryClean: 4.50, iron: 2.00, express: 6.00 },

    description: 'School uniform pants',
  },

  // SPECIALTY ITEMS (15 items)
  {
    id: 'specialty-wedding-dress',
    name: 'Wedding Dress',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-wedding-dress.jpg',

    prices: { wash: 0, dryClean: 50.00, iron: 20.00, express: 100.00 },

    description: 'Bridal wedding gown',
  },
  {
    id: 'specialty-tuxedo',
    name: 'Tuxedo',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-tuxedo.jpg',

    prices: { wash: 0, dryClean: 25.00, iron: 10.00, express: 45.00 },

    description: 'Formal tuxedo suit',
  },
  {
    id: 'specialty-leather-pants',
    name: 'Leather Pants',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-leather-pants.jpg',

    prices: { wash: 0, dryClean: 15.00, iron: 0, express: 25.00 },

    description: 'Leather pants',
  },
  {
    id: 'specialty-suede-jacket',
    name: 'Suede Jacket',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-suede-jacket.jpg',

    prices: { wash: 0, dryClean: 20.00, iron: 0, express: 35.00 },

    description: 'Suede jacket',
  },
  {
    id: 'specialty-silk-blouse',
    name: 'Silk Blouse',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-silk-blouse.jpg',

    prices: { wash: 0, dryClean: 12.00, iron: 5.00, express: 20.00 },

    description: 'Silk blouse',
  },
  {
    id: 'specialty-cashmere-sweater',
    name: 'Cashmere Sweater',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-cashmere-sweater.jpg',

    prices: { wash: 0, dryClean: 18.00, iron: 8.00, express: 30.00 },

    description: 'Cashmere sweater',
  },
  {
    id: 'specialty-wool-coat',
    name: 'Wool Coat',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-wool-coat.jpg',

    prices: { wash: 0, dryClean: 22.00, iron: 9.00, express: 40.00 },

    description: 'Wool overcoat',
  },
  {
    id: 'specialty-fur-coat',
    name: 'Fur Coat',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-fur-coat.jpg',

    prices: { wash: 0, dryClean: 75.00, iron: 0, express: 150.00 },

    description: 'Fur coat',
  },
  {
    id: 'specialty-evening-gown',
    name: 'Designer Evening Gown',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-evening-gown.jpg',

    prices: { wash: 0, dryClean: 35.00, iron: 15.00, express: 65.00 },

    description: 'Designer evening gown',
  },
  {
    id: 'specialty-prom-dress',
    name: 'Prom Dress',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-prom-dress.jpg',

    prices: { wash: 0, dryClean: 25.00, iron: 10.00, express: 45.00 },

    description: 'Prom or formal dress',
  },
  {
    id: 'specialty-graduation-gown',
    name: 'Graduation Gown',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-graduation-gown.jpg',

    prices: { wash: 0, dryClean: 15.00, iron: 6.00, express: 25.00 },

    description: 'Academic graduation gown',
  },
  {
    id: 'specialty-military-uniform',
    name: 'Military Uniform',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-military-uniform.jpg',

    prices: { wash: 0, dryClean: 20.00, iron: 8.00, express: 35.00 },

    description: 'Military uniform',
  },
  {
    id: 'specialty-chef-coat',
    name: 'Chef Coat',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-chef-coat.jpg',

    prices: { wash: 5.00, dryClean: 8.00, iron: 3.00, express: 12.00 },

    description: 'Professional chef coat',
  },
  {
    id: 'specialty-lab-coat',
    name: 'Lab Coat',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-lab-coat.jpg',

    prices: { wash: 4.00, dryClean: 6.00, iron: 2.50, express: 9.00 },

    description: 'Medical lab coat',
  },
  {
    id: 'specialty-sports-jersey',
    name: 'Sports Jersey',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/specialty-sports-jersey.jpg',

    prices: { wash: 3.00, dryClean: 5.00, iron: 2.00, express: 7.00 },

    description: 'Sports team jersey',
  },

  // ACCESSORIES (10 items)
  {
    id: 'accessories-tie',
    name: 'Necktie',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-tie.jpg',

    prices: { wash: 0, dryClean: 3.00, iron: 1.50, express: 5.00 },

    description: 'Silk necktie',
  },
  {
    id: 'accessories-bowtie',
    name: 'Bow Tie',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-bowtie.jpg',

    prices: { wash: 0, dryClean: 3.50, iron: 1.50, express: 6.00 },

    description: 'Formal bow tie',
  },
  {
    id: 'accessories-cufflinks',
    name: 'Cufflinks',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-cufflinks.jpg',

    prices: { wash: 0, dryClean: 0, iron: 0, express: 0 },

    description: 'Dress shirt cufflinks',
  },
  {
    id: 'accessories-pocket-square',
    name: 'Pocket Square',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-pocket-square.jpg',

    prices: { wash: 2.00, dryClean: 3.00, iron: 1.00, express: 4.00 },

    description: 'Dress pocket square',
  },
  {
    id: 'accessories-handkerchief',
    name: 'Handkerchief',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-handkerchief.jpg',

    prices: { wash: 1.50, dryClean: 2.50, iron: 1.00, express: 3.50 },

    description: 'Cotton handkerchief',
  },
  {
    id: 'accessories-belt',
    name: 'Leather Belt',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-belt.jpg',

    prices: { wash: 0, dryClean: 5.00, iron: 0, express: 8.00 },

    description: 'Leather dress belt',
  },
  {
    id: 'accessories-suspenders',
    name: 'Suspenders',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-suspenders.jpg',

    prices: { wash: 0, dryClean: 4.00, iron: 2.00, express: 7.00 },

    description: 'Cloth suspenders',
  },
  {
    id: 'accessories-hat',
    name: 'Fedora Hat',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-hat.jpg',

    prices: { wash: 3.00, dryClean: 5.00, iron: 0, express: 7.00 },

    description: 'Felt fedora hat',
  },
  {
    id: 'accessories-scarf',
    name: 'Silk Scarf',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-scarf.jpg',

    prices: { wash: 0, dryClean: 8.00, iron: 3.00, express: 12.00 },

    description: 'Silk fashion scarf',
  },
  {
    id: 'accessories-gloves',
    name: 'Dress Gloves',
    category: 'accessories',
    serviceCategory: 'washing',

    image: 'https://images.example.com/accessories-gloves.jpg',

    prices: { wash: 0, dryClean: 6.00, iron: 0, express: 10.00 },

    description: 'Leather dress gloves',
  },

  // HOME TEXTILES (10 items)
  {
    id: 'home-sheets',
    name: 'Bed Sheets',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-sheets.jpg',

    prices: { wash: 8.00, dryClean: 0, iron: 4.00, express: 15.00 },

    description: 'Cotton bed sheets set',
  },
  {
    id: 'home-pillowcases',
    name: 'Pillowcases',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-pillowcases.jpg',

    prices: { wash: 3.00, dryClean: 0, iron: 1.50, express: 6.00 },

    description: 'Cotton pillowcases',
  },
  {
    id: 'home-comforter',
    name: 'Comforter',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-comforter.jpg',

    prices: { wash: 15.00, dryClean: 25.00, iron: 0, express: 35.00 },

    description: 'Down or synthetic comforter',
  },
  {
    id: 'home-blanket',
    name: 'Blanket',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-blanket.jpg',

    prices: { wash: 10.00, dryClean: 15.00, iron: 0, express: 20.00 },

    description: 'Wool or fleece blanket',
  },
  {
    id: 'home-towels',
    name: 'Bath Towels',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-towels.jpg',

    prices: { wash: 4.00, dryClean: 0, iron: 0, express: 8.00 },

    description: 'Cotton bath towels',
  },
  {
    id: 'home-washcloths',
    name: 'Washcloths',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-washcloths.jpg',

    prices: { wash: 1.50, dryClean: 0, iron: 0, express: 3.00 },

    description: 'Cotton washcloths',
  },
  {
    id: 'home-curtains',
    name: 'Curtains',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-curtains.jpg',

    prices: { wash: 8.00, dryClean: 12.00, iron: 4.00, express: 20.00 },

    description: 'Window curtains',
  },
  {
    id: 'home-tablecloth',
    name: 'Tablecloth',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-tablecloth.jpg',

    prices: { wash: 6.00, dryClean: 10.00, iron: 3.00, express: 15.00 },

    description: 'Cotton tablecloth',
  },
  {
    id: 'home-place-mats',
    name: 'Place Mats',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-place-mats.jpg',

    prices: { wash: 2.00, dryClean: 4.00, iron: 1.00, express: 5.00 },

    description: 'Table place mats',
  },
  {
    id: 'home-coasters',
    name: 'Coasters',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-coasters.jpg',

    prices: { wash: 1.00, dryClean: 2.00, iron: 0.50, express: 3.00 },

    description: 'Decorative coasters',
  },
  {
    id: 'home-cushion-covers',
    name: 'Cushion Covers',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-cushion-covers.jpg',

    prices: { wash: 4.00, dryClean: 8.00, iron: 2.00, express: 10.00 },

    description: 'Throw pillow covers',
  },
  {
    id: 'home-throw-blanket',
    name: 'Throw Blanket',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-throw-blanket.jpg',

    prices: { wash: 5.00, dryClean: 10.00, iron: 0, express: 12.00 },

    description: 'Decorative throw blanket',
  },
  {
    id: 'home-shower-curtain',
    name: 'Shower Curtain',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-shower-curtain.jpg',

    prices: { wash: 4.00, dryClean: 0, iron: 0, express: 8.00 },

    description: 'Plastic or fabric shower curtain',
  },
  {
    id: 'home-bath-mat',
    name: 'Bath Mat',
    category: 'specialty',
    serviceCategory: 'washing',

    image: 'https://images.example.com/home-bath-mat.jpg',

    prices: { wash: 4.00, dryClean: 0, iron: 0, express: 8.00 },

    description: 'Cotton bath mat',
  },

];

export function validateCatalogImages(): boolean {
  const errors: string[] = [];
  CLOTHING_CATALOG.forEach(item => {
    const expectedUrl = `https://images.example.com/${item.id}.jpg`;
    if (item.image !== expectedUrl) {
      errors.push(`${item.id}: expected ${expectedUrl}, got ${item.image}`);
    }
  });
  if (errors.length > 0) {
    console.error('Image URL mismatches:', errors);
    return false;
  }
  return true;
}
