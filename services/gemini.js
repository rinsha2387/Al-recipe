const OLLAMA_URL = 'http://localhost:11434/api/generate';

const MODEL = 'qwen2:0.5b';
const FALLBACK_MODEL = 'tinyllama';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function robustExtractJson(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const text = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();

  // 1. Direct parse attempt
  try {
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) return direct;
    if (typeof direct === 'object' && direct !== null) {
      if (Array.isArray(direct.recipes)) return direct.recipes;
      if (Array.isArray(direct.meals)) return direct.meals;
      return Object.values(direct);
    }
  } catch {}

  // 2. Extract array slice if present
  const start = text.indexOf('[');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '[') depth++;
      else if (text[i] === ']') {
        depth--;
        if (depth === 0) {
          try {
            const arr = JSON.parse(text.substring(start, i + 1));
            if (Array.isArray(arr) && arr.length > 0) return arr;
          } catch {}
          break;
        }
      }
    }
  }

  // 3. Scan and collect individual completed JSON objects
  const objects = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (char === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const candidate = text.substring(objStart, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && (parsed.title || parsed.dish || parsed.ingredients || parsed.day)) {
            objects.push(parsed);
          }
        } catch {}
        objStart = -1;
      }
    }
  }

  if (objects.length > 0) return objects;

  // 4. Auto-repair cut-off array string
  if (start !== -1) {
    let candidate = text.substring(start).replace(/,\s*$/, '');
    let quotes = (candidate.match(/"/g) || []).length;
    if (quotes % 2 !== 0) candidate += '"';
    let opens = (candidate.match(/\{/g) || []).length;
    let closes = (candidate.match(/\}/g) || []).length;
    while (closes < opens) { candidate += '}'; closes++; }
    let arrOpens = (candidate.match(/\[/g) || []).length;
    let arrCloses = (candidate.match(/\]/g) || []).length;
    while (arrCloses < arrOpens) { candidate += ']'; arrCloses++; }
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  return [];
}

function hasNonEnglish(str) {
  return /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(str || '');
}

function isGenericTitle(title) {
  if (!title || typeof title !== 'string') return true;
  const t = title.trim();
  if (t.length < 3) return true;
  if (/^(recipe \d|dish \d|recipe \d title|a fast breakfast|a hasty main|a hearty main|a creative comfort|unique appetizing|delicious dish)/i.test(t)) return true;
  return false;
}

function fixRecipe(r) {
  if (!r || typeof r !== 'object') return null;
  const rawTitle = r.title || r.dish || r.dishname || r['Dish Name'] || r['Dish name'] || '';
  if (!rawTitle || hasNonEnglish(rawTitle) || isGenericTitle(rawTitle)) return null;

  const obj = {};
  obj.title = rawTitle;
  obj.dish = r.dish || r.title || obj.title;
  obj.ingredients = [];
  const ing = r.ingredients || r.Ingredients || r.ingredient || r.Ingredient || [];
  if (Array.isArray(ing)) {
    obj.ingredients = ing
      .map(i => typeof i === 'string' ? i : String(i))
      .filter(i => !hasNonEnglish(i));
  } else if (typeof ing === 'string' && !hasNonEnglish(ing)) {
    obj.ingredients = [ing];
  }
  if (obj.ingredients.length === 0) return null;

  obj.steps = [];
  const st = r.steps || r.Steps || r.directions || r.Directions || r.instructions || r.Instructions || r.step || [];
  if (Array.isArray(st)) {
    obj.steps = st
      .map(s => typeof s === 'string' ? s : Object.values(s).join('. '))
      .filter(s => !hasNonEnglish(s));
  } else if (typeof st === 'object' && st !== null) {
    obj.steps = Object.values(st).filter(s => !hasNonEnglish(s));
  } else if (typeof st === 'string' && !hasNonEnglish(st)) {
    obj.steps = [st];
  }
  if (obj.steps.length === 0) return null;

  obj.meal = r.meal || r['Meal type'] || r.type || '';
  obj.day = r.day || r.Day || '';
  obj.meals = (r.meals || r.Meals || []).map(fixRecipe).filter(Boolean);
  return obj;
}

// Creative recipe generator matching user ingredients
function generateDynamicRecipes(ingredients) {
  const ingList = (ingredients || []).map(i => i.trim().toLowerCase()).filter(Boolean);
  const mainIng = capitalize(ingList[0] || 'Kitchen');
  const secIng = capitalize(ingList[1] || 'Garden Herb');
  const allFormatted = ingList.map(capitalize);

  const hasEggs = ingList.some(i => /egg/.test(i));
  const hasBread = ingList.some(i => /bread|toast|bun/.test(i));
  const hasCheese = ingList.some(i => /cheese|cheddar|mozzarella|parmesan/.test(i));
  const hasChicken = ingList.some(i => /chicken|poultry/.test(i));
  const hasPasta = ingList.some(i => /pasta|spaghetti|noodle|macaroni/.test(i));
  const hasRice = ingList.some(i => /rice/.test(i));
  const hasPotato = ingList.some(i => /potato/.test(i));

  // Specialized profile for Egg + Bread + Cheese combinations
  if (hasEggs && hasBread) {
    return [
      {
        title: hasCheese ? 'Golden Cheesy Egg Toast Melt' : 'Crispy Egg in a Hole Toast',
        ingredients: [
          ...allFormatted,
          '1 tbsp Butter or olive oil',
          'Pinch of black pepper and sea salt',
          'Optional pinch of red chili flakes'
        ],
        steps: [
          'Spread butter lightly over slices of bread and warm a skillet over medium heat.',
          'Toast the bread until golden on one side, then crack an egg on top (or whisk and pour over).',
          hasCheese ? 'Generously sprinkle cheese over the warm bread and cover with a lid for 2 minutes to melt.' : 'Cook until egg whites are set and yolk is done to your liking.',
          'Season with cracked black pepper and chili flakes, then slice diagonally and serve hot.'
        ]
      },
      {
        title: 'Savory Fluffy French Toast Scramble',
        ingredients: [
          ...allFormatted,
          '2 tbsp milk or water (optional)',
          '1 tbsp butter',
          'Fresh herbs or parsley'
        ],
        steps: [
          'In a shallow bowl, whisk together the eggs, a splash of milk, salt, and pepper.',
          'Cut bread into rustic bite-sized cubes and toss into the egg mixture until lightly absorbed.',
          'Melt butter in a non-stick pan over medium-low heat and pour in the mixture.',
          'Gently fold and scramble until eggs are soft, fluffy, and golden. Garnish with herbs and serve.'
        ]
      },
      {
        title: hasCheese ? 'Crispy Stuffed Cheese & Egg Pocket' : 'Rustic Breakfast Skillet Hash',
        ingredients: [
          ...allFormatted,
          'Olive oil or butter',
          'Paprika or garlic powder',
          'Fresh greens or chopped tomato (optional)'
        ],
        steps: [
          'Layer ingredients between bread slices or prepare your skillet over medium heat.',
          'Press lightly in a heated pan with butter until both sides turn extra crispy and deep golden.',
          'Allow the inside to get wonderfully tender, hot, and melt-in-your-mouth delicious.',
          'Remove from heat, let rest for 1 minute, slice in half, and enjoy.'
        ]
      }
    ];
  }

  // Specialized profile for Chicken
  if (hasChicken) {
    return [
      {
        title: `Pan-Seared Garlic Butter ${mainIng} Skillet`,
        ingredients: [
          ...allFormatted,
          '2 tbsp olive oil or butter',
          '2 cloves minced garlic',
          'Salt, black pepper, and dried oregano'
        ],
        steps: [
          `Cut ${mainIng} into even bite-sized strips and season well with salt, pepper, and herbs.`,
          'Heat olive oil in a skillet over medium-high heat until shimmering.',
          `Sear the ${mainIng} for 6-8 minutes until golden browned and fully cooked through.`,
          `Toss in ${allFormatted.filter(i => i !== mainIng).join(', ')} with garlic for the last 2 minutes and serve hot.`
        ]
      },
      {
        title: `Crispy Herb-Roasted ${mainIng} & Vegetables`,
        ingredients: [
          ...allFormatted,
          '2 tbsp olive oil',
          'Paprika, garlic powder, and rosemary',
          'Pinch of sea salt'
        ],
        steps: [
          'Preheat oven to 400°F (200°C) and line a baking sheet with foil or parchment paper.',
          `Arrange ${allFormatted.join(', ')} evenly across the baking tray.`,
          'Drizzle generously with olive oil and toss with seasonings to coat thoroughly.',
          'Roast for 20-25 minutes until caramelized and tender. Serve warm.'
        ]
      },
      {
        title: `Creamy Comfort ${mainIng} Pan Toss`,
        ingredients: [
          ...allFormatted,
          '1 tbsp butter or oil',
          'Splash of cream or broth',
          'Freshly cracked black pepper'
        ],
        steps: [
          `Sauté ${allFormatted.join(' and ')} in a warm pan until tender and aromatic.`,
          'Pour in a splash of cream or broth and let simmer gently for 3 minutes to create a rich glaze.',
          'Taste and adjust seasoning with salt and pepper.',
          'Serve immediately with your favorite side.'
        ]
      }
    ];
  }

  // Specialized profile for Pasta
  if (hasPasta) {
    return [
      {
        title: `Rustic Garlic & Herb ${mainIng} Toss`,
        ingredients: [
          ...allFormatted,
          '3 tbsp extra virgin olive oil',
          'Garlic and crushed red pepper',
          'Salt and reserved pasta water'
        ],
        steps: [
          'Boil pasta in a generous pot of salted water until al dente; reserve 1/4 cup cooking water.',
          `In a skillet, warm olive oil over medium-low heat and sauté ${allFormatted.filter(i => !/pasta/i.test(i)).join(' and ')}.`,
          'Add the cooked pasta and a splash of reserved water, tossing vigorously to emulsify.',
          'Season to taste and serve with a drizzle of olive oil.'
        ]
      },
      {
        title: `Creamy Baked ${mainIng} Gratin`,
        ingredients: [
          ...allFormatted,
          '1 tbsp butter and 1 tbsp flour',
          '1 cup milk or broth',
          'Black pepper and herbs'
        ],
        steps: [
          'Cook pasta al dente and preheat oven to 375°F (190°C).',
          `Combine ${allFormatted.join(', ')} with a quick warm sauce in a baking dish.`,
          'Bake for 15 minutes until bubbly and golden around the edges.',
          'Let stand 3 minutes before serving hot.'
        ]
      },
      {
        title: `Zesty Skillet ${mainIng} Medley`,
        ingredients: [
          ...allFormatted,
          '2 tbsp olive oil or butter',
          'Lemon zest or chopped herbs',
          'Black pepper'
        ],
        steps: [
          `Sauté ${allFormatted.filter(i => !/pasta/i.test(i)).join(', ')} in olive oil until vibrant and tender.`,
          'Add cooked pasta directly to the pan and toss over high heat for 1 minute.',
          'Garnish with lemon zest and fresh herbs, then serve.'
        ]
      }
    ];
  }

  // Default balanced diverse tri-dish generator
  return [
    {
      title: `${mainIng} & ${secIng} Skillet Sauté`,
      ingredients: [
        ...allFormatted,
        '2 tbsp olive oil or butter',
        'Salt and freshly ground pepper',
        'Pinch of garlic powder or fresh garlic'
      ],
      steps: [
        `Heat oil or butter in a wide pan over medium heat.`,
        `Chop ${allFormatted.join(' and ')} into bite-sized portions and add to the skillet.`,
        `Sauté for 6-8 minutes, stirring occasionally until beautifully caramelized and tender.`,
        `Season with salt, pepper, and garlic to taste, then plate and serve immediately.`
      ]
    },
    {
      title: `Golden Baked ${mainIng} Supreme`,
      ingredients: [
        ...allFormatted,
        '1 tbsp olive oil',
        'Dried oregano or Italian herbs',
        'Salt and black pepper'
      ],
      steps: [
        `Preheat oven to 380°F (190°C) and lightly grease a baking dish.`,
        `Toss ${allFormatted.join(', ')} with olive oil, salt, and herbs.`,
        `Spread evenly in the dish and bake for 18-20 minutes until golden and aromatic.`,
        `Garnish with fresh herbs and serve warm.`
      ]
    },
    {
      title: `Chef's Savory ${mainIng} Bowl`,
      ingredients: [
        ...allFormatted,
        '1 tbsp butter or sesame/olive oil',
        'Seasoning of choice',
        'Splash of lemon juice or soy sauce'
      ],
      steps: [
        `Prep all ingredients cleanly on your cutting board.`,
        `In a hot skillet, flash-cook ${allFormatted.join(' and ')} for 4-5 minutes to keep textures crisp and vibrant.`,
        `Splash with lemon juice or sauce of choice for a bright, mouthwatering finish.`,
        `Transfer to a serving bowl and enjoy hot.`
      ]
    }
  ];
}

async function askGeminiApi(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8
      }
    }),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? robustExtractJson(text) : null;
}

async function askOllama(prompt, model = MODEL, timeoutMs = 15000) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        num_predict: 480
      }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const parsed = robustExtractJson(data.response);
  if (!parsed || parsed.length === 0) throw new Error('Could not parse JSON from Ollama output');
  return parsed.map(fixRecipe).filter(Boolean);
}

exports.suggestRecipes = async (ingredients) => {
  if (!ingredients || !ingredients.length) {
    throw new Error('Please provide at least one ingredient');
  }

  const prompt = `You are a creative chef. Suggest 3 completely different recipes strictly in English using these ingredients: ${ingredients.join(', ')}.
All recipe titles, ingredients, and steps MUST be written in English only.
Recipe 1: A fast breakfast or pan-toasted dish
Recipe 2: A hearty main course or skillet meal
Recipe 3: A creative comfort food or baked dish
Every recipe must have a unique, appetizing English title, clear ingredients, and simple steps.

Return ONLY a JSON array in this exact format:
[
  {"title": "Recipe 1 Title", "ingredients": ["ing 1", "ing 2"], "steps": ["Step 1", "Step 2"]},
  {"title": "Recipe 2 Title", "ingredients": ["ing 1", "ing 2"], "steps": ["Step 1", "Step 2"]},
  {"title": "Recipe 3 Title", "ingredients": ["ing 1", "ing 2"], "steps": ["Step 1", "Step 2"]}
]`;

  let recipes = [];

  // 1. Try Gemini API if key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const gRes = await askGeminiApi(prompt);
      if (Array.isArray(gRes) && gRes.length > 0) {
        recipes = gRes.map(fixRecipe).filter(Boolean);
      }
    } catch (e) {
      console.warn('Gemini API attempt failed:', e.message);
    }
  }

  // 2. Try Local Ollama with fast timeout (15s max)
  if (!recipes || recipes.length < 3) {
    try {
      recipes = await askOllama(prompt, MODEL, 15000);
    } catch (e) {
      console.warn(`Ollama (${MODEL}) attempt: ${e.message}`);
      // Quick fallback attempt with tinyllama (8s max)
      try {
        recipes = await askOllama(prompt, FALLBACK_MODEL, 8000);
      } catch (e2) {
        console.warn(`Ollama fallback (${FALLBACK_MODEL}) attempt: ${e2.message}`);
      }
    }
  }

  // 3. Ensure we have exactly 3 distinct, non-duplicate recipes
  const fallbacks = generateDynamicRecipes(ingredients);
  const seenTitles = new Set();
  const uniqueRecipes = [];

  for (const r of (recipes || [])) {
    if (r && r.title && !seenTitles.has(r.title.toLowerCase().trim())) {
      seenTitles.add(r.title.toLowerCase().trim());
      uniqueRecipes.push(r);
    }
  }

  // Fill in any missing recipe slots from dynamic culinary generator
  for (const fb of fallbacks) {
    if (uniqueRecipes.length >= 3) break;
    if (!seenTitles.has(fb.title.toLowerCase().trim())) {
      seenTitles.add(fb.title.toLowerCase().trim());
      uniqueRecipes.push(fb);
    }
  }

  return uniqueRecipes.slice(0, 3);
};

exports.generateMealPlan = async (diet, days) => {
  const prompt = `Create a ${days}-day ${diet} meal plan.
Return ONLY a JSON array. Each item has: day (string), meals (array).
Each meal has: meal (Breakfast/Lunch/Dinner), dish (string), ingredients (array), steps (array).
Example: [{"day":"Day 1","meals":[{"meal":"Breakfast","dish":"Oats","ingredients":["oats"],"steps":["Cook"]}]}]`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const gRes = await askGeminiApi(prompt);
      if (Array.isArray(gRes) && gRes.length > 0) return gRes.map(fixRecipe);
    }
  } catch {}

  try {
    return await askOllama(prompt, MODEL, 20000);
  } catch (e) {
    console.warn('Meal plan Ollama failed, using structured fallback:', e.message);
    // Provide structured dynamic meal plan so user never gets "failed to fetch"
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = [];
    const numDays = Math.min(Number(days) || 7, 7);
    for (let i = 0; i < numDays; i++) {
      plan.push({
        day: weekDays[i],
        meals: [
          {
            meal: 'Breakfast',
            dish: `${diet === 'vegan' ? 'Fresh Berry Oatmeal' : 'Fluffy Garden Omelette'}`,
            ingredients: ['Oats / Eggs', 'Fresh berries or spinach', 'Olive oil or butter', 'Pinch of salt'],
            steps: ['Warm your skillet or pot over medium heat.', 'Combine ingredients and cook gently for 5-7 minutes.', 'Serve warm with fresh fruit or toast.']
          },
          {
            meal: 'Lunch',
            dish: `${diet === 'keto' ? 'Avocado & Herb Salad Bowl' : 'Mediterranean Vegetable Wrap'}`,
            ingredients: ['Mixed greens', 'Avocado or hummus', 'Cucumbers & tomatoes', 'Olive oil dressing'],
            steps: ['Chop vegetables into crisp, bite-sized portions.', 'Toss lightly in dressing or wrap inside flatbread.', 'Serve fresh and chilled.']
          },
          {
            meal: 'Dinner',
            dish: `${diet === 'vegetarian' ? 'Creamy Garlic Mushroom Risotto' : 'Herb-Roasted Protein & Vegetable Medley'}`,
            ingredients: ['Rice or choice protein', 'Mushrooms and garlic', 'Olive oil or butter', 'Herbs and pepper'],
            steps: ['Sauté garlic and aromatics in olive oil until fragrant.', 'Add main ingredients and simmer gently until tender and savory.', 'Garnish with freshly cracked pepper and enjoy.']
          }
        ]
      });
    }
    return plan;
  }
};
