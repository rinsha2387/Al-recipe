const imageCache = new Map();

// Curated collections with multiple verified, unique high-resolution food photos per category
const CATEGORY_IMAGE_COLLECTIONS = {
  pasta: [
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1598866594230-a7c12756260f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80'
  ],
  pizza: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80'
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80'
  ],
  sandwich: [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1554433607-66b5efe9d304?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&w=800&q=80'
  ],
  egg: [
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582169296194-e4d644c48063?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
  ],
  chicken: [
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80'
  ],
  rice: [
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80'
  ],
  curry: [
    'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80'
  ],
  soup: [
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80'
  ],
  salad: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80'
  ],
  seafood: [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80'
  ],
  dessert: [
    'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
  ],
  pancake: [
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80'
  ],
  default: [
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
  ]
};

function detectCategory(title = '', ingredients = []) {
  const combined = (title + ' ' + (ingredients || []).join(' ')).toLowerCase();
  if (/pasta|spaghetti|noodle|macaroni|lasagna|penne|fettuccine|linguine/.test(combined)) return 'pasta';
  if (/pizza/.test(combined)) return 'pizza';
  if (/burger|hamburger|cheeseburger/.test(combined)) return 'burger';
  if (/sandwich|toast|wrap|panini|grilled cheese/.test(combined)) return 'sandwich';
  if (/egg|omelet|omelette|frittata|scramble|benedict/.test(combined)) return 'egg';
  if (/pancake|waffle|crepe|french toast/.test(combined)) return 'pancake';
  if (/chicken|turkey|poultry|wings|drumstick/.test(combined)) return 'chicken';
  if (/fish|salmon|tuna|seafood|shrimp|prawn|crab|lobster|cod|tilapia/.test(combined)) return 'seafood';
  if (/rice|risotto|pilaf|biryani|fried rice|paella/.test(combined)) return 'rice';
  if (/curry|masala|tikka|korma|dal|paneer/.test(combined)) return 'curry';
  if (/soup|stew|broth|chowder|ramen|chili/.test(combined)) return 'soup';
  if (/salad|slaw|greens|caesar/.test(combined)) return 'salad';
  if (/cake|dessert|cookie|brownie|pudding|pie|muffin|pastry|ice cream|chocolate/.test(combined)) return 'dessert';
  return 'default';
}

function getUniqueFallback(category, usedInBatch, index = 0) {
  const pool = CATEGORY_IMAGE_COLLECTIONS[category] || CATEGORY_IMAGE_COLLECTIONS.default;
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(index + i) % pool.length];
    if (!usedInBatch.has(candidate)) {
      usedInBatch.add(candidate);
      return candidate;
    }
  }

  // If all images in this specific category are used in this batch, borrow from default pool
  const defaultPool = CATEGORY_IMAGE_COLLECTIONS.default;
  for (const candidate of defaultPool) {
    if (!usedInBatch.has(candidate)) {
      usedInBatch.add(candidate);
      return candidate;
    }
  }

  const fallback = pool[index % pool.length];
  usedInBatch.add(fallback);
  return fallback;
}

async function fetchFromTheMealDb(query, usedInBatch) {
  try {
    const clean = query.trim();
    if (!clean) return null;

    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(1800)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.meals) && data.meals.length > 0) {
        // Pick the first meal photo not already used in this batch
        for (const m of data.meals) {
          if (m.strMealThumb && !usedInBatch.has(m.strMealThumb)) {
            usedInBatch.add(m.strMealThumb);
            return m.strMealThumb;
          }
        }
      }
    }
  } catch {}
  return null;
}

async function fetchFromWikipedia(query, usedInBatch) {
  try {
    const clean = query.replace(/[^\w\s]/g, ' ').trim();
    if (!clean) return null;
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(clean)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CookingAI/1.0 (https://github.com/cookingai)' },
      signal: AbortSignal.timeout(1800)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const p of Object.values(pages)) {
      const src = p.thumbnail?.source;
      const isBadGraphic = /logo|icon|flag|map|symbol|coat_of_arms|diagram|disambig|placeholder/i.test(src || '');
      if (src && !usedInBatch.has(src) && !isBadGraphic && !src.includes('.svg')) {
        usedInBatch.add(src);
        return src;
      }
    }
  } catch {}
  return null;
}

async function fetchFromPexels(query, usedInBatch) {
  if (!process.env.PEXELS_API_KEY) return null;
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' food')}&per_page=3`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      signal: AbortSignal.timeout(1800)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.photos)) {
        for (const photo of data.photos) {
          const src = photo.src?.large || photo.src?.medium;
          if (src && !usedInBatch.has(src)) {
            usedInBatch.add(src);
            return src;
          }
        }
      }
    }
  } catch {}
  return null;
}

async function fetchFromUnsplash(query, usedInBatch) {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' dish food')}&per_page=3&client_id=${process.env.UNSPLASH_ACCESS_KEY}`, {
      signal: AbortSignal.timeout(1800)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          const src = item.urls?.regular || item.urls?.small;
          if (src && !usedInBatch.has(src)) {
            usedInBatch.add(src);
            return src;
          }
        }
      }
    }
  } catch {}
  return null;
}

async function getRecipeImage(title, ingredients = [], usedInBatch = new Set(), index = 0) {
  const category = detectCategory(title, ingredients);

  let imageUrl = null;

  // 1. Try Pexels if key exists
  imageUrl = await fetchFromPexels(title, usedInBatch);

  // 2. Try Unsplash if key exists
  if (!imageUrl) {
    imageUrl = await fetchFromUnsplash(title, usedInBatch);
  }

  // 3. Try TheMealDB
  if (!imageUrl) {
    imageUrl = await fetchFromTheMealDb(title, usedInBatch);
  }

  // 4. Try Wikipedia PageImages
  if (!imageUrl) {
    imageUrl = await fetchFromWikipedia(title, usedInBatch);
  }

  // 5. Pick a guaranteed distinct curated photo from the category pool
  if (!imageUrl) {
    imageUrl = getUniqueFallback(category, usedInBatch, index);
  }

  return imageUrl;
}

async function attachRecipeImages(recipes) {
  if (!Array.isArray(recipes)) return recipes;
  const usedInBatch = new Set();

  return Promise.all(
    recipes.map(async (recipe, index) => {
      const title = recipe.title || recipe.dish || '';
      const img = await getRecipeImage(title, recipe.ingredients, usedInBatch, index);
      return {
        ...recipe,
        image: img,
        imageUrl: img
      };
    })
  );
}

module.exports = {
  getRecipeImage,
  attachRecipeImages,
  detectCategory,
  CATEGORY_IMAGE_COLLECTIONS
};
