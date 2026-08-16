import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGroceryHandoff,
  buildGroceryList,
  calculateTargets,
  defaultProfile,
  generateMealPlan,
  validatePlan,
  type Diet,
  type Profile,
} from "../app/planner.ts";

function profile(overrides: Partial<Profile> = {}): Profile {
  return { ...defaultProfile, name: "Test user", ...overrides };
}

test("steady targets retain conservative calorie floors", () => {
  const female = calculateTargets(profile({ sex: "female", weightKg: 45, heightCm: 155, activity: "sedentary", paceKg: 1 }));
  const male = calculateTargets(profile({ sex: "male", weightKg: 50, heightCm: 160, activity: "sedentary", paceKg: 1 }));

  assert.ok(female.calories >= 1200);
  assert.ok(male.calories >= 1500);
  assert.equal(female.targetSource, "estimated");
  assert.equal(male.targetSource, "estimated");
});

test("PSMF uses only confirmed clinician-provided calorie and protein targets", () => {
  const incomplete = calculateTargets(profile({ weightLossMethod: "psmf", psmfClinicianApproved: true }));
  assert.equal(incomplete.method, "steady");

  const prescribed = calculateTargets(profile({
    weightLossMethod: "psmf",
    psmfClinicianApproved: true,
    psmfCalories: 800,
    psmfProtein: 110,
  }));
  assert.equal(prescribed.method, "psmf");
  assert.equal(prescribed.calories, 800);
  assert.equal(prescribed.protein, 110);
  assert.equal(prescribed.targetSource, "clinician");
  assert.equal(prescribed.projectedKg, 0);
});

test("every supported general diet produces an approvable seven-day plan", () => {
  const diets: Diet[] = ["Balanced", "Pescatarian", "Vegetarian", "Vegan"];
  for (const diet of diets) {
    const currentProfile = profile({ diet });
    const targets = calculateTargets(currentProfile);
    const plan = generateMealPlan(currentProfile, targets);
    assert.equal(plan.length, 7, diet);
    assert.ok(plan.every((day) => day.meals.length === 4), diet);
    assert.deepEqual(validatePlan(currentProfile, targets, plan), { valid: true, issues: [] }, diet);
  }
});

test("built-in allergy substitutions leave no flagged allergens", () => {
  for (const allergy of ["Nuts", "Dairy", "Gluten", "Eggs", "Soy", "Shellfish"]) {
    const currentProfile = profile({ allergies: [allergy], noAllergies: false });
    const targets = calculateTargets(currentProfile);
    assert.equal(validatePlan(currentProfile, targets, generateMealPlan(currentProfile, targets)).valid, true, allergy);
  }
});

test("supported clinician-directed PSMF diets meet the provided targets", () => {
  const diets: Diet[] = ["Balanced", "Pescatarian", "Vegetarian"];
  for (const diet of diets) {
    const currentProfile = profile({
      diet,
      weightLossMethod: "psmf",
      psmfClinicianApproved: true,
      psmfCalories: 800,
      psmfProtein: 110,
    });
    const targets = calculateTargets(currentProfile);
    const plan = generateMealPlan(currentProfile, targets);
    assert.ok(plan.every((day) => day.meals.reduce((total, meal) => total + meal.calories, 0) <= targets.calories), diet);
    assert.ok(plan.every((day) => day.meals.reduce((total, meal) => total + meal.protein, 0) === targets.protein), diet);
    assert.deepEqual(validatePlan(currentProfile, targets, plan), { valid: true, issues: [] }, diet);
  }
});

test("validation rejects a diet violation and unsupported vegan PSMF", () => {
  const pescatarian = profile({ diet: "Pescatarian" });
  const pescatarianTargets = calculateTargets(pescatarian);
  const tamperedPlan = structuredClone(generateMealPlan(pescatarian, pescatarianTargets));
  tamperedPlan[0].meals[0].ingredients.push({ name: "Chicken breast", quantity: 4, unit: "oz", category: "Protein & dairy" });
  assert.equal(validatePlan(pescatarian, pescatarianTargets, tamperedPlan).valid, false);

  const veganPsmf = profile({ diet: "Vegan", weightLossMethod: "psmf", psmfClinicianApproved: true, psmfCalories: 800, psmfProtein: 100 });
  const veganTargets = calculateTargets(veganPsmf);
  assert.equal(validatePlan(veganPsmf, veganTargets, generateMealPlan(veganPsmf, veganTargets)).valid, false);
});

test("grocery handoff excludes removed items and preserves numeric requirements", () => {
  const currentProfile = profile({ allergies: ["Gluten"], noAllergies: false, budget: "custom", customBudget: 75 });
  const targets = calculateTargets(currentProfile);
  const items = buildGroceryList(generateMealPlan(currentProfile, targets)).flatMap((group) => group.items);
  const removed = items[0];
  const handoff = buildGroceryHandoff(currentProfile, items, [removed.id]);

  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.equal(handoff.items.length, items.length - 1);
  assert.equal(handoff.items.some((item) => item.id === removed.id), false);
  assert.equal(handoff.inventoryReview.excludedAsAlreadyOnHand[0].id, removed.id);
  assert.deepEqual(handoff.constraints.weeklyBudget, { currency: "USD", target: 75 });
  assert.ok(handoff.items.every((item) => item.minimumQuantity > 0));
});
