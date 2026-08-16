"use client";

import { useState, type CSSProperties } from "react";
import Onboarding from "./onboarding";
import {
  budgetLabel,
  buildGroceryList,
  calculateTargets,
  generateMealPlan,
  goalLabel,
  type Meal,
  type PlanDay,
  type Profile,
  type Targets,
} from "./planner";

type Page = "today" | "plan" | "groceries" | "progress";
type Stage = "onboarding" | "review" | "app";

export default function Home() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [page, setPage] = useState<Page>("today");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [planSeed, setPlanSeed] = useState(0);
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [savedMeals, setSavedMeals] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);

  function finishOnboarding(nextProfile: Profile) {
    const nextTargets = calculateTargets(nextProfile);
    setProfile(nextProfile);
    setTargets(nextTargets);
    setPlan(generateMealPlan(nextProfile, nextTargets));
    setPlanSeed(0);
    setSelectedDay("Mon");
    setChecked([]);
    setStage("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function regeneratePlan() {
    if (!profile || !targets) return;
    const nextSeed = planSeed + 1;
    setPlanSeed(nextSeed);
    setPlan(generateMealPlan(profile, targets, nextSeed));
    setSelectedDay("Mon");
  }

  function approvePlan() {
    setStage("app");
    setPage("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editProfile() {
    setStage("onboarding");
    setChecked([]);
  }

  function saveMeal(mealName: string) {
    setSavedMeals((current) => current.includes(mealName) ? current.filter((item) => item !== mealName) : [...current, mealName]);
  }

  if (stage === "onboarding") {
    return <Onboarding initialProfile={profile ?? undefined} onComplete={finishOnboarding} />;
  }

  if (!profile || !targets || plan.length === 0) return null;

  if (stage === "review") {
    return <PlanReview profile={profile} targets={targets} plan={plan} selectedDay={selectedDay} setSelectedDay={setSelectedDay} onMeal={setSelectedMeal} onEdit={editProfile} onRegenerate={regeneratePlan} onApprove={approvePlan} selectedMeal={selectedMeal} closeMeal={() => setSelectedMeal(null)} />;
  }

  const activeDay = plan.find((day) => day.day === selectedDay) ?? plan[0];
  const today = plan[0];
  const groceries = buildGroceryList(plan);
  const groceryCount = groceries.reduce((total, group) => total + group.items.length, 0);
  const dayCalories = sum(today.meals, "calories");
  const dayProtein = sum(today.meals, "protein");
  const calorieFit = Math.round((dayCalories / targets.calories) * 100);
  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "today", label: "Today", icon: "⌂" },
    { id: "plan", label: "Meal plan", icon: "▦" },
    { id: "groceries", label: "Groceries", icon: "◫" },
    { id: "progress", label: "Progress", icon: "↗" },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage("today")}><span className="brand-mark">✳</span> NutriPlan</button>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => <button className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)} key={item.id}><span>{item.icon}</span>{item.label}{item.id === "groceries" && <b>{groceryCount - checked.length}</b>}</button>)}
        </nav>
        <div className="sidebar-note"><span className="tiny-label">APPROVED PLAN</span><strong>{goalLabel(profile.goal)}</strong><p>{targets.calories.toLocaleString()} kcal · {targets.protein}g protein</p></div>
        <button className="profile" onClick={editProfile}><span>{profile.name.slice(0, 2).toUpperCase()}</span><span>{profile.name}<small>Edit onboarding</small></span><i>···</i></button>
      </aside>

      <section className="content">
        {page === "today" && (
          <>
            <header className="topbar"><div><span className="eyebrow">PLAN APPROVED</span><h1>Your week is ready, {profile.name}.</h1><p className="lede">Every meal below comes from the plan you approved. Its ingredients now power the grocery list.</p></div><button className="outline-btn" onClick={() => setPage("plan")}>Review plan</button></header>
            <section className="hero-grid">
              <article className="target-card">
                <div className="card-heading"><div><span className="eyebrow">MONDAY&apos;S PLAN</span><h2>{dayCalories.toLocaleString()} calories</h2></div><span className="on-track">{Math.abs(dayCalories - targets.calories) <= 100 ? "Target fit" : "Close fit"}</span></div>
                <div className="rings" aria-label="Planned nutrition against daily targets">
                  <div className="ring calories" style={{ "--progress": `${Math.min(100, calorieFit)}%` } as CSSProperties}><div><strong>{calorieFit}%</strong><span>of calorie target</span></div></div>
                  <div className="mini-stat"><span className="dot protein" /><div><strong>{dayProtein}g</strong><small>of {targets.protein}g protein</small></div></div>
                  <div className="mini-stat"><span className="dot fiber" /><div><strong>{targets.fiber}g</strong><small>daily fiber target</small></div></div>
                </div>
                <p className="insight">This day lands {Math.abs(dayCalories - targets.calories)} calories from your target and uses ingredients again later in the week.</p>
              </article>
              <article className="week-card">
                <div className="card-heading"><div><span className="eyebrow">APPROVAL STATUS</span><h2>7 days approved</h2></div><button aria-label="Open weekly plan" onClick={() => setPage("plan")}>→</button></div>
                <div className="week-days">{plan.map((day) => <div className={day.day === "Mon" ? "current" : ""} key={day.day}><span>{day.day[0]}</span><i className="done">✓</i></div>)}</div>
                <div className="week-footer"><strong>{profile.diet}</strong><span>meal pattern</span><strong>{budgetLabel(profile)}</strong><span>budget target</span></div>
              </article>
            </section>
            <MealsSection title="Meals for Monday" eyebrow="YOUR APPROVED DAY" meals={today.meals} savedMeals={savedMeals} onSave={saveMeal} onOpen={setSelectedMeal} onFullWeek={() => setPage("plan")} />
            <section className="grocery-strip"><div className="basket">◫</div><div><span className="eyebrow">GENERATED FROM YOUR PLAN</span><h3>{groceryCount} consolidated grocery items</h3><p>Only ingredients from approved meals, grouped and quantity-normalized.</p></div><div className="grocery-total"><span>Budget target</span><strong>{budgetLabel(profile)}</strong></div><button className="primary-btn" onClick={() => setPage("groceries")}>Review grocery list →</button></section>
          </>
        )}

        {page === "plan" && (
          <section className="page-view">
            <header className="topbar"><div><span className="eyebrow">APPROVED · WEEK OF AUGUST 17</span><h1>Your meal plan</h1><p className="lede">{profile.diet} meals built for {targets.calories.toLocaleString()} calories and {targets.protein}g protein per day.</p></div><button className="outline-btn" onClick={editProfile}>Edit profile</button></header>
            <DayTabs plan={plan} selectedDay={selectedDay} onSelect={setSelectedDay} />
            <DaySummary day={activeDay} targets={targets} />
            <MealsSection title={`Meals for ${activeDay.day}`} eyebrow="APPROVED DAY" meals={activeDay.meals} savedMeals={savedMeals} onSave={saveMeal} onOpen={setSelectedMeal} />
            <div className="plan-note"><span>♻</span><div><strong>Plan-to-cart traceability</strong><p>Each ingredient is stored with its meal, serving quantity, unit, and aisle category. The grocery list is the exact aggregate of this approved week.</p></div></div>
          </section>
        )}

        {page === "groceries" && (
          <section className="page-view">
            <header className="topbar"><div><span className="eyebrow">FROM APPROVED PLAN</span><h1>Your grocery list</h1><p className="lede">{checked.length} of {groceryCount} items checked. Editing the meal plan requires reapproval before this list changes.</p></div><span className="total-pill">{budgetLabel(profile)} target</span></header>
            <div className="grocery-layout">
              <div className="grocery-groups">{groceries.map((group) => <article className="grocery-group" key={group.group}><div className="group-heading"><h2>{group.group}</h2><span>{group.items.length} items</span></div>{group.items.map((item) => <label className={checked.includes(item.name) ? "checked" : ""} key={item.name}><input type="checkbox" checked={checked.includes(item.name)} onChange={() => setChecked((current) => current.includes(item.name) ? current.filter((value) => value !== item.name) : [...current, item.name])}/><i>✓</i><span><strong>{item.name}</strong><small>{item.quantity}</small></span></label>)}</article>)}</div>
              <aside className="retailer-card"><span className="retailer-logo">i</span><div><span className="eyebrow">NEXT INTEGRATION</span><h2>Ready for product matching</h2><p>The approved ingredient list is now normalized for an Instacart MCP search and cart-building pass.</p></div><div className="readiness"><span>Profile constraints</span><b>Applied</b><span>Meal approval</span><b>Complete</b><span>Product matching</span><b className="waiting">Next</b></div><button disabled>Connect Instacart MCP</button><small>Store pricing and purchases remain outside this version.</small></aside>
            </div>
          </section>
        )}

        {page === "progress" && (
          <section className="page-view">
            <header className="topbar"><div><span className="eyebrow">BASELINE CREATED</span><h1>Your progress starts here.</h1><p className="lede">Once check-ins are added, targets can adjust from multi-week trends instead of reacting to one day.</p></div><button className="outline-btn" disabled>Check-ins coming next</button></header>
            <div className="progress-grid"><article className="progress-chart empty-progress"><span className="eyebrow">STARTING POINT</span><div className="progress-kpis"><div><strong>{profile.weightKg.toFixed(1)} kg</strong><span>current weight</span></div><div><strong>{targets.projectedKg || "—"}{targets.projectedKg ? " kg" : ""}</strong><span>projected weekly change</span></div></div><div className="baseline-line"><i /><span>Log your first weekly check-in to begin the trend.</span></div></article><article className="consistency-card"><span className="eyebrow">PLAN FOUNDATION</span><h2>Consistency over precision</h2><p>Your approved plan is the baseline. Future adjustments should use adherence, hunger, energy, and weight trends together.</p><div className="signal"><span>✓</span><div><strong>Week one ready</strong><small>{plan.length} days · {groceryCount} grocery items</small></div></div></article></div>
            <div className="safety-note"><span>ⓘ</span><p>NutriPlan uses conservative general-wellness estimates. It does not diagnose conditions or replace guidance from a registered clinician.</p></div>
          </section>
        )}
      </section>

      {selectedMeal && <MealModal meal={selectedMeal} saved={savedMeals.includes(selectedMeal.name)} onSave={() => saveMeal(selectedMeal.name)} onClose={() => setSelectedMeal(null)} />}
    </main>
  );
}

function PlanReview({ profile, targets, plan, selectedDay, setSelectedDay, onMeal, onEdit, onRegenerate, onApprove, selectedMeal, closeMeal }: { profile: Profile; targets: Targets; plan: PlanDay[]; selectedDay: string; setSelectedDay: (day: string) => void; onMeal: (meal: Meal) => void; onEdit: () => void; onRegenerate: () => void; onApprove: () => void; selectedMeal: Meal | null; closeMeal: () => void }) {
  const day = plan.find((item) => item.day === selectedDay) ?? plan[0];
  const weeklyAverage = Math.round(plan.reduce((total, item) => total + sum(item.meals, "calories"), 0) / plan.length);
  return <main className="review-screen"><header className="review-top"><button className="brand" onClick={onEdit}><span className="brand-mark">✳</span> NutriPlan</button><div className="workflow-steps"><span className="done">✓ Profile</span><i /><span className="active">2 Review meals</span><i /><span>3 Groceries</span></div><button className="text-btn" onClick={onEdit}>Edit answers</button></header><section className="review-content"><div className="review-hero"><div><span className="eyebrow">YOUR PROPOSED WEEK</span><h1>Here’s the plan, {profile.name}.</h1><p>Review the meals before anything becomes a grocery list. You can open recipes or ask for another complete option.</p></div><div className="target-summary"><span><b>{targets.calories.toLocaleString()}</b> kcal target</span><span><b>{targets.protein}g</b> protein</span><span><b>{weeklyAverage.toLocaleString()}</b> kcal plan avg.</span></div></div><div className="constraint-chips"><span>{profile.diet}</span>{profile.allergies.map((item) => <span key={item}>No {item}</span>)}{profile.customAllergy && <span>No {profile.customAllergy}</span>}<span>{budgetLabel(profile)} target</span></div><DayTabs plan={plan} selectedDay={selectedDay} onSelect={setSelectedDay} /><DaySummary day={day} targets={targets} /><MealsSection title={`Meals for ${day.day}`} eyebrow="PROPOSED DAY" meals={day.meals} onOpen={onMeal} /><div className="approval-card"><div><span className="eyebrow">APPROVAL GATE</span><h2>Does this week work for you?</h2><p>Approval freezes this meal set and generates the grocery list from these exact ingredients and quantities.</p></div><div><button className="outline-btn" onClick={onRegenerate}>Try another plan</button><button className="approve-btn" onClick={onApprove}>Approve plan & build groceries →</button></div></div></section>{selectedMeal && <MealModal meal={selectedMeal} saved={false} onSave={() => {}} onClose={closeMeal} reviewMode />}</main>;
}

function DayTabs({ plan, selectedDay, onSelect }: { plan: PlanDay[]; selectedDay: string; onSelect: (day: string) => void }) {
  return <div className="day-tabs" role="tablist" aria-label="Days of the week">{plan.map((day) => <button role="tab" aria-selected={selectedDay === day.day} onClick={() => onSelect(day.day)} className={selectedDay === day.day ? "selected" : ""} key={day.day}><span>{day.day}</span><b>{day.date}</b></button>)}</div>;
}

function DaySummary({ day, targets }: { day: PlanDay; targets: Targets }) {
  return <div className="day-summary"><span><b>{sum(day.meals, "calories")}</b> kcal planned</span><span><b>{sum(day.meals, "protein")}g</b> protein</span><span><b>~{day.meals.reduce((total, meal) => total + Number(meal.prep.split(" ")[0]), 0)} min</b> total prep</span><i>Target: {targets.calories} kcal · {targets.protein}g protein</i></div>;
}

function MealsSection({ title, eyebrow, meals, savedMeals = [], onSave, onOpen, onFullWeek }: { title: string; eyebrow: string; meals: Meal[]; savedMeals?: string[]; onSave?: (name: string) => void; onOpen: (meal: Meal) => void; onFullWeek?: () => void }) {
  return <section className="meal-section"><div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{onFullWeek && <button className="text-btn" onClick={onFullWeek}>View full week →</button>}</div><div className="meal-grid">{meals.map((meal) => <article className="meal-card" key={meal.id}><div className={`meal-art ${meal.tone}`}><span>{meal.icon}</span>{onSave && <button className={savedMeals.includes(meal.name) ? "saved" : ""} onClick={() => onSave(meal.name)} aria-label={`Save ${meal.name}`}>{savedMeals.includes(meal.name) ? "♥" : "♡"}</button>}</div><div className="meal-copy"><span>{meal.type} · {meal.time}</span><h3>{meal.name}</h3><p>{meal.calories} kcal · {meal.protein}g protein · {meal.prep}</p><button onClick={() => onOpen(meal)}>View recipe <b>→</b></button></div></article>)}</div></section>;
}

function MealModal({ meal, saved, onSave, onClose, reviewMode = false }: { meal: Meal; saved: boolean; onSave: () => void; onClose: () => void; reviewMode?: boolean }) {
  return <div className="modal-backdrop"><button className="modal-dismiss" onClick={onClose} aria-label="Close recipe" /><article className="recipe-modal" role="dialog" aria-modal="true" aria-labelledby="recipe-title"><div className={`recipe-hero ${meal.tone}`}><span>{meal.icon}</span><button onClick={onClose} aria-label="Close">×</button></div><div className="recipe-body"><span className="eyebrow">{meal.type} · {meal.prep}</span><h2 id="recipe-title">{meal.name}</h2><p>{meal.description}</p><div className="recipe-macros"><span><b>{meal.calories}</b> calories</span><span><b>{meal.protein}g</b> protein</span><span><b>1</b> serving</span></div><h3>What you’ll need</h3><ul>{meal.ingredients.map((ingredient) => <li key={ingredient.name}><span>✓</span>{ingredient.name} · {ingredient.quantity} {ingredient.unit}</li>)}</ul><h3>Quick method</h3><p>Prep the ingredients, cook the main protein or legume until ready, and assemble with the vegetables and grain. Season to taste and serve warm.</p>{reviewMode ? <button className="primary-btn" onClick={onClose}>Looks good</button> : <button className="primary-btn" onClick={onSave}>{saved ? "Saved to favorites ♥" : "Save this meal ♡"}</button>}</div></article></div>;
}

function sum(meals: Meal[], key: "calories" | "protein") {
  return meals.reduce((total, meal) => total + meal[key], 0);
}
