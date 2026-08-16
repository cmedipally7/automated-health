export type Goal = "lose" | "gain" | "maintain";
export type Sex = "female" | "male";
export type Activity = "sedentary" | "3x" | "5x";
export type Diet = "Balanced" | "Pescatarian" | "Vegetarian" | "Vegan";

export type Profile = {
  name: string;
  goal: Goal;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  paceKg: number;
  activity: Activity;
  allergies: string[];
  customAllergy: string;
  noAllergies: boolean;
  diet: Diet;
  standards: string[];
  budget: "$15–20" | "$20–30" | "$30+" | "custom";
  customBudget: number;
};

export type Targets = {
  calories: number;
  maintenance: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  dailyAdjustment: number;
  projectedKg: number;
};

export type Ingredient = {
  name: string;
  quantity: number;
  unit: string;
  category: "Produce" | "Protein & dairy" | "Grains" | "Pantry";
};

export type Meal = {
  id: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  time: string;
  name: string;
  calories: number;
  protein: number;
  prep: string;
  icon: string;
  tone: string;
  description: string;
  ingredients: Ingredient[];
};

export type PlanDay = { day: string; date: number; meals: Meal[] };
export type GroceryItem = {
  id: string;
  name: string;
  category: Ingredient["category"];
  minimumQuantity: number;
  unit: string;
  displayQuantity: string;
};

export type GroceryGroup = { group: Ingredient["category"]; items: GroceryItem[] };

export type GroceryHandoff = {
  schemaVersion: "1.0";
  intent: "build_grocery_cart";
  destination: "instacart_mcp";
  constraints: {
    diet: Diet;
    allergies: string[];
    standards: string[];
    weeklyBudget: {
      currency: "USD";
      minimum?: number;
      maximum?: number;
      target?: number;
    };
  };
  quantityPolicy: {
    quantitiesAre: "minimum_required_for_approved_meal_plan";
    coverageRule: string;
    packageOverageAllowed: true;
  };
  optimization: {
    goal: "best_value_with_complete_coverage";
    priorities: string[];
  };
  inventoryReview: {
    excludedAsAlreadyOnHand: Array<Pick<GroceryItem, "id" | "name" | "minimumQuantity" | "unit">>;
  };
  items: Array<Pick<GroceryItem, "id" | "name" | "category" | "minimumQuantity" | "unit">>;
};

export const defaultProfile: Profile = {
  name: "",
  goal: "lose",
  age: 35,
  sex: "male",
  heightCm: 175,
  weightKg: 82,
  paceKg: 0.5,
  activity: "3x",
  allergies: [],
  customAllergy: "",
  noAllergies: true,
  diet: "Balanced",
  standards: [],
  budget: "$20–30",
  customBudget: 50,
};

const activityMultipliers: Record<Activity, number> = {
  sedentary: 1.2,
  "3x": 1.45,
  "5x": 1.65,
};

export function calculateTargets(profile: Profile): Targets {
  const sexAdjustment = profile.sex === "female" ? -161 : 5;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexAdjustment;
  const maintenance = Math.round(bmr * activityMultipliers[profile.activity]);
  const requestedDeficit = (profile.paceKg * 7700) / 7;
  const safeDeficit = Math.min(requestedDeficit, maintenance * 0.2, 750);
  const floor = profile.sex === "female" ? 1200 : 1500;
  const dailyAdjustment = profile.goal === "lose" ? -safeDeficit : profile.goal === "gain" ? 300 : 0;
  const calories = Math.max(floor, Math.round((maintenance + dailyAdjustment) / 25) * 25);
  const proteinPerKg = profile.goal === "maintain" ? 1.4 : 1.7;
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.28) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return {
    calories,
    maintenance,
    protein,
    carbs,
    fat,
    fiber: Math.max(25, Math.round((calories / 1000) * 14)),
    dailyAdjustment: Math.round(dailyAdjustment),
    projectedKg: profile.goal === "lose" ? Number(((safeDeficit * 7) / 7700).toFixed(2)) : 0,
  };
}

type MealSeed = Omit<Meal, "id" | "calories" | "protein" | "ingredients"> & {
  calories: number;
  protein: number;
  ingredients: Ingredient[];
};

const i = (
  name: string,
  quantity: number,
  unit: string,
  category: Ingredient["category"],
): Ingredient => ({ name, quantity, unit, category });

const pools: Record<Diet, MealSeed[]> = {
  Balanced: [
    { type: "Breakfast", time: "8:00 AM", name: "Berry protein oats", calories: 410, protein: 32, prep: "8 min", icon: "🥣", tone: "berry", description: "Creamy oats with Greek yogurt, berries, chia, and cinnamon.", ingredients: [i("Rolled oats", .5, "cup", "Grains"), i("Greek yogurt", .75, "cup", "Protein & dairy"), i("Blueberries", .75, "cup", "Produce"), i("Chia seeds", 1, "tbsp", "Pantry")] },
    { type: "Breakfast", time: "8:00 AM", name: "Spinach feta egg wrap", calories: 390, protein: 31, prep: "12 min", icon: "🌯", tone: "grain", description: "Soft eggs, spinach, and feta in a warm whole-grain wrap.", ingredients: [i("Eggs", 2, "each", "Protein & dairy"), i("Baby spinach", 1, "cup", "Produce"), i("Feta", 1, "oz", "Protein & dairy"), i("Whole-grain wraps", 1, "each", "Grains")] },
    { type: "Lunch", time: "12:30 PM", name: "Herby chicken grain bowl", calories: 560, protein: 48, prep: "20 min", icon: "🥗", tone: "grain", description: "Lemon-herb chicken, quinoa, crisp vegetables, and yogurt tahini.", ingredients: [i("Chicken breast", 6, "oz", "Protein & dairy"), i("Quinoa", .65, "cup", "Grains"), i("Cucumber", .5, "each", "Produce"), i("Greek yogurt", .25, "cup", "Protein & dairy")] },
    { type: "Lunch", time: "12:30 PM", name: "Lemony tuna bean salad", calories: 510, protein: 44, prep: "10 min", icon: "🥬", tone: "salmon", description: "A bright salad with tuna, white beans, herbs, and lemon.", ingredients: [i("Canned tuna", 5, "oz", "Protein & dairy"), i("White beans", .65, "cup", "Pantry"), i("Mixed greens", 2, "cup", "Produce"), i("Lemons", .5, "each", "Produce")] },
    { type: "Dinner", time: "6:30 PM", name: "Miso salmon & greens", calories: 610, protein: 46, prep: "25 min", icon: "🍲", tone: "salmon", description: "Miso-glazed salmon with sesame broccoli and brown rice.", ingredients: [i("Salmon fillets", 6, "oz", "Protein & dairy"), i("Broccoli", 1.5, "cup", "Produce"), i("Brown rice", .75, "cup", "Grains"), i("White miso", 1, "tbsp", "Pantry")] },
    { type: "Dinner", time: "6:30 PM", name: "Turkey meatballs & orzo", calories: 650, protein: 49, prep: "30 min", icon: "🍝", tone: "berry", description: "Lean turkey meatballs, tomato sauce, orzo, and spinach.", ingredients: [i("Lean ground turkey", 6, "oz", "Protein & dairy"), i("Orzo", .75, "cup", "Grains"), i("Crushed tomatoes", .75, "cup", "Pantry"), i("Baby spinach", 1, "cup", "Produce")] },
    { type: "Snack", time: "3:30 PM", name: "Apple yogurt crunch", calories: 220, protein: 18, prep: "3 min", icon: "🍎", tone: "berry", description: "Greek yogurt, crisp apple, cinnamon, and pumpkin seeds.", ingredients: [i("Greek yogurt", .6, "cup", "Protein & dairy"), i("Apples", 1, "each", "Produce"), i("Pumpkin seeds", 1, "tbsp", "Pantry")] },
    { type: "Snack", time: "3:30 PM", name: "Cottage cheese & cucumber", calories: 190, protein: 22, prep: "4 min", icon: "🥒", tone: "grain", description: "Cottage cheese with cucumber, pepper, and fresh herbs.", ingredients: [i("Cottage cheese", .75, "cup", "Protein & dairy"), i("Cucumber", .5, "each", "Produce")] },
  ],
  Pescatarian: [
    { type: "Breakfast", time: "8:00 AM", name: "Berry protein oats", calories: 410, protein: 32, prep: "8 min", icon: "🥣", tone: "berry", description: "Creamy oats with Greek yogurt, berries, chia, and cinnamon.", ingredients: [i("Rolled oats", .5, "cup", "Grains"), i("Greek yogurt", .75, "cup", "Protein & dairy"), i("Blueberries", .75, "cup", "Produce"), i("Chia seeds", 1, "tbsp", "Pantry")] },
    { type: "Breakfast", time: "8:00 AM", name: "Avocado egg toast", calories: 430, protein: 27, prep: "10 min", icon: "🥑", tone: "grain", description: "Jammy eggs and avocado on seeded whole-grain toast.", ingredients: [i("Eggs", 2, "each", "Protein & dairy"), i("Avocados", .5, "each", "Produce"), i("Whole-grain bread", 2, "slice", "Grains")] },
    { type: "Lunch", time: "12:30 PM", name: "Lemony tuna bean salad", calories: 510, protein: 44, prep: "10 min", icon: "🥬", tone: "salmon", description: "A bright salad with tuna, white beans, herbs, and lemon.", ingredients: [i("Canned tuna", 5, "oz", "Protein & dairy"), i("White beans", .65, "cup", "Pantry"), i("Mixed greens", 2, "cup", "Produce"), i("Lemons", .5, "each", "Produce")] },
    { type: "Lunch", time: "12:30 PM", name: "Mediterranean chickpea bowl", calories: 540, protein: 31, prep: "15 min", icon: "🥙", tone: "grain", description: "Chickpeas, quinoa, crunchy vegetables, feta, and lemon.", ingredients: [i("Chickpeas", .9, "cup", "Pantry"), i("Quinoa", .65, "cup", "Grains"), i("Cucumber", .5, "each", "Produce"), i("Feta", 1, "oz", "Protein & dairy")] },
    { type: "Dinner", time: "6:30 PM", name: "Miso salmon & greens", calories: 610, protein: 46, prep: "25 min", icon: "🍲", tone: "salmon", description: "Miso-glazed salmon with sesame broccoli and brown rice.", ingredients: [i("Salmon fillets", 6, "oz", "Protein & dairy"), i("Broccoli", 1.5, "cup", "Produce"), i("Brown rice", .75, "cup", "Grains"), i("White miso", 1, "tbsp", "Pantry")] },
    { type: "Dinner", time: "6:30 PM", name: "Lemon cod & roast vegetables", calories: 590, protein: 45, prep: "28 min", icon: "🐟", tone: "berry", description: "Flaky lemon cod with sweet potato, peppers, and herbed yogurt.", ingredients: [i("Cod fillets", 6, "oz", "Protein & dairy"), i("Sweet potatoes", 8, "oz", "Produce"), i("Bell peppers", 1, "each", "Produce"), i("Greek yogurt", .25, "cup", "Protein & dairy")] },
    { type: "Snack", time: "3:30 PM", name: "Apple yogurt crunch", calories: 220, protein: 18, prep: "3 min", icon: "🍎", tone: "berry", description: "Greek yogurt, crisp apple, cinnamon, and pumpkin seeds.", ingredients: [i("Greek yogurt", .6, "cup", "Protein & dairy"), i("Apples", 1, "each", "Produce"), i("Pumpkin seeds", 1, "tbsp", "Pantry")] },
    { type: "Snack", time: "3:30 PM", name: "Hummus vegetable cup", calories: 210, protein: 10, prep: "5 min", icon: "🥕", tone: "grain", description: "Hummus with crunchy cucumber, carrots, and peppers.", ingredients: [i("Hummus", .4, "cup", "Pantry"), i("Cucumber", .5, "each", "Produce"), i("Carrots", 2, "each", "Produce")] },
  ],
  Vegetarian: [
    { type: "Breakfast", time: "8:00 AM", name: "Berry protein oats", calories: 410, protein: 32, prep: "8 min", icon: "🥣", tone: "berry", description: "Creamy oats with Greek yogurt, berries, chia, and cinnamon.", ingredients: [i("Rolled oats", .5, "cup", "Grains"), i("Greek yogurt", .75, "cup", "Protein & dairy"), i("Blueberries", .75, "cup", "Produce"), i("Chia seeds", 1, "tbsp", "Pantry")] },
    { type: "Breakfast", time: "8:00 AM", name: "Spinach feta egg wrap", calories: 390, protein: 31, prep: "12 min", icon: "🌯", tone: "grain", description: "Soft eggs, spinach, and feta in a warm whole-grain wrap.", ingredients: [i("Eggs", 2, "each", "Protein & dairy"), i("Baby spinach", 1, "cup", "Produce"), i("Feta", 1, "oz", "Protein & dairy"), i("Whole-grain wraps", 1, "each", "Grains")] },
    { type: "Lunch", time: "12:30 PM", name: "Mediterranean chickpea bowl", calories: 540, protein: 31, prep: "15 min", icon: "🥙", tone: "grain", description: "Chickpeas, quinoa, crunchy vegetables, feta, and lemon.", ingredients: [i("Chickpeas", .9, "cup", "Pantry"), i("Quinoa", .65, "cup", "Grains"), i("Cucumber", .5, "each", "Produce"), i("Feta", 1, "oz", "Protein & dairy")] },
    { type: "Lunch", time: "12:30 PM", name: "Smoky lentil power bowl", calories: 555, protein: 34, prep: "18 min", icon: "🥗", tone: "salmon", description: "Smoky lentils, roasted vegetables, brown rice, and yogurt sauce.", ingredients: [i("Lentils", .9, "cup", "Pantry"), i("Brown rice", .65, "cup", "Grains"), i("Broccoli", 1, "cup", "Produce"), i("Greek yogurt", .25, "cup", "Protein & dairy")] },
    { type: "Dinner", time: "6:30 PM", name: "Ginger tofu stir-fry", calories: 590, protein: 38, prep: "22 min", icon: "🍛", tone: "salmon", description: "Crisp tofu, broccoli, peppers, and brown rice in ginger sauce.", ingredients: [i("Extra-firm tofu", 7, "oz", "Protein & dairy"), i("Broccoli", 1.5, "cup", "Produce"), i("Bell peppers", 1, "each", "Produce"), i("Brown rice", .75, "cup", "Grains")] },
    { type: "Dinner", time: "6:30 PM", name: "Black bean sweet potato tacos", calories: 620, protein: 32, prep: "28 min", icon: "🌮", tone: "berry", description: "Spiced black beans, roasted sweet potato, slaw, and lime crema.", ingredients: [i("Black beans", .9, "cup", "Pantry"), i("Sweet potatoes", 7, "oz", "Produce"), i("Corn tortillas", 3, "each", "Grains"), i("Greek yogurt", .25, "cup", "Protein & dairy")] },
    { type: "Snack", time: "3:30 PM", name: "Apple yogurt crunch", calories: 220, protein: 18, prep: "3 min", icon: "🍎", tone: "berry", description: "Greek yogurt, crisp apple, cinnamon, and pumpkin seeds.", ingredients: [i("Greek yogurt", .6, "cup", "Protein & dairy"), i("Apples", 1, "each", "Produce"), i("Pumpkin seeds", 1, "tbsp", "Pantry")] },
    { type: "Snack", time: "3:30 PM", name: "Hummus vegetable cup", calories: 210, protein: 10, prep: "5 min", icon: "🥕", tone: "grain", description: "Hummus with crunchy cucumber, carrots, and peppers.", ingredients: [i("Hummus", .4, "cup", "Pantry"), i("Cucumber", .5, "each", "Produce"), i("Carrots", 2, "each", "Produce")] },
  ],
  Vegan: [
    { type: "Breakfast", time: "8:00 AM", name: "Berry chia protein oats", calories: 420, protein: 27, prep: "8 min", icon: "🥣", tone: "berry", description: "Oats, berries, chia, pumpkin seeds, and plant yogurt.", ingredients: [i("Rolled oats", .55, "cup", "Grains"), i("Plant yogurt", .75, "cup", "Protein & dairy"), i("Blueberries", .75, "cup", "Produce"), i("Chia seeds", 1.5, "tbsp", "Pantry")] },
    { type: "Breakfast", time: "8:00 AM", name: "Savory chickpea breakfast wrap", calories: 430, protein: 25, prep: "14 min", icon: "🌯", tone: "grain", description: "Chickpea scramble, spinach, tomato, and avocado in a warm wrap.", ingredients: [i("Chickpeas", .75, "cup", "Pantry"), i("Baby spinach", 1, "cup", "Produce"), i("Avocados", .35, "each", "Produce"), i("Whole-grain wraps", 1, "each", "Grains")] },
    { type: "Lunch", time: "12:30 PM", name: "Mediterranean chickpea bowl", calories: 550, protein: 27, prep: "15 min", icon: "🥙", tone: "grain", description: "Chickpeas, quinoa, crunchy vegetables, herbs, and lemon tahini.", ingredients: [i("Chickpeas", 1, "cup", "Pantry"), i("Quinoa", .7, "cup", "Grains"), i("Cucumber", .5, "each", "Produce"), i("Tahini", 1, "tbsp", "Pantry")] },
    { type: "Lunch", time: "12:30 PM", name: "Smoky lentil power bowl", calories: 565, protein: 31, prep: "18 min", icon: "🥗", tone: "salmon", description: "Smoky lentils, roasted vegetables, brown rice, and herby tahini.", ingredients: [i("Lentils", 1, "cup", "Pantry"), i("Brown rice", .7, "cup", "Grains"), i("Broccoli", 1, "cup", "Produce"), i("Tahini", 1, "tbsp", "Pantry")] },
    { type: "Dinner", time: "6:30 PM", name: "Ginger tofu stir-fry", calories: 600, protein: 38, prep: "22 min", icon: "🍛", tone: "salmon", description: "Crisp tofu, broccoli, peppers, and brown rice in ginger sauce.", ingredients: [i("Extra-firm tofu", 8, "oz", "Protein & dairy"), i("Broccoli", 1.5, "cup", "Produce"), i("Bell peppers", 1, "each", "Produce"), i("Brown rice", .75, "cup", "Grains")] },
    { type: "Dinner", time: "6:30 PM", name: "Black bean sweet potato tacos", calories: 630, protein: 29, prep: "28 min", icon: "🌮", tone: "berry", description: "Spiced black beans, roasted sweet potato, slaw, and avocado crema.", ingredients: [i("Black beans", 1, "cup", "Pantry"), i("Sweet potatoes", 7, "oz", "Produce"), i("Corn tortillas", 3, "each", "Grains"), i("Avocados", .35, "each", "Produce")] },
    { type: "Snack", time: "3:30 PM", name: "Apple seed crunch", calories: 230, protein: 12, prep: "3 min", icon: "🍎", tone: "berry", description: "Crisp apple with pumpkin-seed butter and cinnamon.", ingredients: [i("Apples", 1, "each", "Produce"), i("Pumpkin-seed butter", 1.5, "tbsp", "Pantry")] },
    { type: "Snack", time: "3:30 PM", name: "Hummus vegetable cup", calories: 210, protein: 10, prep: "5 min", icon: "🥕", tone: "grain", description: "Hummus with crunchy cucumber, carrots, and peppers.", ingredients: [i("Hummus", .4, "cup", "Pantry"), i("Cucumber", .5, "each", "Produce"), i("Carrots", 2, "each", "Produce")] },
  ],
};

const substitutions: Record<string, { pattern: RegExp; replacement: string }[]> = {
  Dairy: [
    { pattern: /Greek yogurt/gi, replacement: "plant yogurt" },
    { pattern: /Cottage cheese/gi, replacement: "white bean dip" },
    { pattern: /Feta/gi, replacement: "dairy-free feta" },
  ],
  Gluten: [
    { pattern: /Whole-grain wraps/gi, replacement: "gluten-free wraps" },
    { pattern: /Whole-grain bread/gi, replacement: "gluten-free bread" },
    { pattern: /Orzo/gi, replacement: "brown rice" },
    { pattern: /Rolled oats/gi, replacement: "certified gluten-free oats" },
  ],
  Eggs: [{ pattern: /Eggs/gi, replacement: "chickpea scramble" }],
  Soy: [
    { pattern: /Extra-firm tofu/gi, replacement: "lentils" },
    { pattern: /White miso/gi, replacement: "lemon-garlic glaze" },
  ],
  Nuts: [{ pattern: /nut/gi, replacement: "seed" }],
  Shellfish: [],
};

function adaptMeal(seed: MealSeed, profile: Profile, desiredCalories: number, desiredProtein: number, id: string): Meal {
  const factor = desiredCalories / seed.calories;
  let name = seed.name;
  let description = seed.description;
  let ingredients = seed.ingredients.map((ingredient) => ({ ...ingredient }));

  for (const allergy of profile.allergies) {
    const rules = substitutions[allergy] ?? [];
    for (const rule of rules) {
      name = name.replace(rule.pattern, rule.replacement);
      description = description.replace(rule.pattern, rule.replacement);
      ingredients = ingredients.map((ingredient) => ({
        ...ingredient,
        name: ingredient.name.replace(rule.pattern, rule.replacement),
      }));
    }
  }

  const custom = profile.customAllergy.trim().toLowerCase();
  if (custom) {
    ingredients = ingredients.filter((ingredient) => !ingredient.name.toLowerCase().includes(custom));
  }

  const containsMeat = ingredients.some((ingredient) => /chicken|turkey/i.test(ingredient.name));
  if (profile.standards.includes("Kosher") && containsMeat) {
    ingredients = ingredients.map((ingredient) => /Greek yogurt|Feta|Cottage cheese/i.test(ingredient.name)
      ? { ...ingredient, name: "tahini herb sauce", category: "Pantry" }
      : ingredient);
    description = description.replace(/yogurt|feta|cottage cheese/gi, "tahini");
  }

  return {
    ...seed,
    id,
    name,
    description,
    calories: desiredCalories,
    protein: desiredProtein,
    ingredients: ingredients.map((ingredient) => ({
      ...ingredient,
      quantity: Number((ingredient.quantity * factor).toFixed(2)),
    })),
  };
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function generateMealPlan(profile: Profile, targets: Targets, seed = 0): PlanDay[] {
  const lowBudget = profile.budget === "$15–20";
  const startingPool = profile.diet === "Pescatarian" && lowBudget
    ? [...pools.Pescatarian, ...pools.Vegetarian.filter((meal) => meal.type === "Dinner")]
    : pools[profile.diet];
  const affordablePool = lowBudget
    ? startingPool.filter((meal) => !/salmon|cod/i.test(meal.name))
    : startingPool;
  const pool = affordablePool.length >= 8 ? affordablePool : startingPool;
  const byType = {
    Breakfast: pool.filter((meal) => meal.type === "Breakfast"),
    Lunch: pool.filter((meal) => meal.type === "Lunch"),
    Dinner: pool.filter((meal) => meal.type === "Dinner"),
    Snack: pool.filter((meal) => meal.type === "Snack"),
  };
  const calorieShares = { Breakfast: .23, Lunch: .30, Dinner: .35, Snack: .12 };
  const proteinShares = { Breakfast: .22, Lunch: .31, Dinner: .34, Snack: .13 };

  return days.map((day, dayIndex) => {
    const meals = (Object.keys(byType) as (keyof typeof byType)[]).map((type, typeIndex) => {
      const options = byType[type];
      const source = options[(dayIndex + seed + typeIndex) % options.length];
      return adaptMeal(
        source,
        profile,
        Math.round(targets.calories * calorieShares[type] / 5) * 5,
        Math.round(targets.protein * proteinShares[type]),
        `${day.toLowerCase()}-${type.toLowerCase()}-${seed}`,
      );
    });
    return { day, date: 17 + dayIndex, meals };
  });
}

export function buildGroceryList(plan: PlanDay[]): GroceryGroup[] {
  const totals = new Map<string, { name: string; quantity: number; unit: string; category: string }>();

  for (const day of plan) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const key = `${ingredient.category}|${ingredient.name.toLowerCase()}|${ingredient.unit}`;
        const current = totals.get(key);
        if (current) current.quantity += ingredient.quantity;
        else totals.set(key, { ...ingredient });
      }
    }
  }

  const categoryOrder: Ingredient["category"][] = ["Produce", "Protein & dairy", "Grains", "Pantry"];
  return categoryOrder.map((category) => ({
    group: category,
    items: [...totals.values()]
      .filter((item) => item.category === category)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        id: groceryItemId(item.category, item.name, item.unit),
        name: item.name,
        category: item.category as Ingredient["category"],
        minimumQuantity: normalizeQuantity(item.quantity),
        unit: item.unit,
        displayQuantity: formatQuantity(item.quantity, item.unit),
      })),
  })).filter((group) => group.items.length > 0);
}

export function buildGroceryHandoff(
  profile: Profile,
  items: GroceryItem[],
  onHandIds: string[],
): GroceryHandoff {
  const onHand = new Set(onHandIds);
  const toRequirement = ({ id, name, category, minimumQuantity, unit }: GroceryItem) => ({
    id,
    name,
    category,
    minimumQuantity,
    unit,
  });
  const excludedAsAlreadyOnHand = items
    .filter((item) => onHand.has(item.id))
    .map(({ id, name, minimumQuantity, unit }) => ({ id, name, minimumQuantity, unit }));

  return {
    schemaVersion: "1.0",
    intent: "build_grocery_cart",
    destination: "instacart_mcp",
    constraints: {
      diet: profile.diet,
      allergies: [...profile.allergies, profile.customAllergy.trim()].filter(Boolean),
      standards: profile.standards,
      weeklyBudget: budgetConstraint(profile),
    },
    quantityPolicy: {
      quantitiesAre: "minimum_required_for_approved_meal_plan",
      coverageRule: "Selected product packages must meet or exceed every remaining minimum quantity.",
      packageOverageAllowed: true,
    },
    optimization: {
      goal: "best_value_with_complete_coverage",
      priorities: [
        "cover_every_remaining_minimum",
        "respect_dietary_constraints",
        "minimize_total_cart_price",
        "prefer_better_unit_value_when_practical",
        "minimize_unnecessary_package_overage",
      ],
    },
    inventoryReview: { excludedAsAlreadyOnHand },
    items: items.filter((item) => !onHand.has(item.id)).map(toRequirement),
  };
}

function groceryItemId(category: string, name: string, unit: string) {
  return `${category}:${name}:${unit}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function budgetConstraint(profile: Profile): GroceryHandoff["constraints"]["weeklyBudget"] {
  if (profile.budget === "custom") {
    return { currency: "USD", target: profile.customBudget };
  }

  const amounts = profile.budget.match(/\d+/g)?.map(Number) ?? [];
  return amounts.length > 1
    ? { currency: "USD", minimum: amounts[0], maximum: amounts[1] }
    : { currency: "USD", minimum: amounts[0] };
}

function normalizeQuantity(quantity: number) {
  return Number(quantity.toFixed(2));
}

function formatQuantity(quantity: number, unit: string) {
  return `${normalizeQuantity(quantity)} ${unit}`;
}

export function goalLabel(goal: Goal) {
  return goal === "lose" ? "Lose weight steadily" : goal === "gain" ? "Build muscle" : "Maintain weight";
}

export function budgetLabel(profile: Profile) {
  return profile.budget === "custom" ? `$${profile.customBudget}/week` : `${profile.budget}/week`;
}
