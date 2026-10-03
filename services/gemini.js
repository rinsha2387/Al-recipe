const OLLAMA_URL = 'http://localhost:11434/api/generate';

const MODEL = 'qwen2:0.5b';
const FALLBACK_MODEL = 'tinyllama';

function extractJson(raw) {
  const text = raw.replace(/```json?/gi, '').replace(/```/g, '').trim();
  const start = text.indexOf('[');
  if (start === -1) throw new Error('No JSON array found');
  let depth = 0, end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[' || text[i] === '{') depth++;
    else if (text[i] === ']' || text[i] === '}') depth--;
    if (depth === 0 && text[i] === ']') { end = i + 1; break; }
  }
  if (end === -1) throw new Error('Unclosed JSON array');
  return text.substring(start, end);
}

function fixRecipe(r) {
  const obj = {};
  obj.title = r.title || r.dish || r.dishname || r['Dish Name'] || r['Dish name'] || '';
  obj.dish = r.dish || r.title || '';
  obj.ingredients = [];
  const ing = r.ingredients || r.Ingredients || r.ingredient || r.Ingredient || [];
  if (Array.isArray(ing)) obj.ingredients = ing.map(i => typeof i === 'string' ? i : String(i));
  obj.steps = [];
  const st = r.steps || r.Steps || r.directions || r.Directions || r.instructions || r.Instructions || r.step || [];
  if (Array.isArray(st)) obj.steps = st.map(s => typeof s === 'string' ? s : Object.values(s).join('. '));
  else if (typeof st === 'object') obj.steps = Object.values(st);
  obj.meal = r.meal || r['Meal type'] || r.type || '';
  obj.day = r.day || r.Day || '';
  obj.meals = (r.meals || r.Meals || []).map(fixRecipe);
  return obj;
}

async function askOllama(prompt, model) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model || MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(90000)
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const json = extractJson(data.response);
  const parsed = JSON.parse(json);
  return Array.isArray(parsed) ? parsed.map(fixRecipe) : parsed;
}

async function askWithFallback(prompt) {
  try {
    return await askOllama(prompt, MODEL);
  } catch (e) {
    console.error(`${MODEL} failed: ${e.message}, trying ${FALLBACK_MODEL}`);
    return askOllama(prompt, FALLBACK_MODEL);
  }
}

exports.suggestRecipes = async (ingredients) => {
  const prompt = `Create 3 recipes using: ${ingredients.join(', ')}.
Return ONLY a JSON array. Each recipe has: title (string), ingredients (array of strings), steps (array of strings).
Example: [{"title":"Dish","ingredients":["a","b"],"steps":["Do 1","Do 2"]}]`;
  return askWithFallback(prompt);
};

exports.generateMealPlan = async (diet, days) => {
  const prompt = `Create a ${days}-day ${diet} meal plan.
Return ONLY a JSON array. Each item has: day (string), meals (array).
Each meal has: meal (Breakfast/Lunch/Dinner), dish (string), ingredients (array), steps (array).
Example: [{"day":"Monday","meals":[{"meal":"Breakfast","dish":"Oats","ingredients":["oats"],"steps":["Cook"]}]}]`;
  return askWithFallback(prompt);
};
