"use client";

import { FormEvent, useMemo, useState } from "react";

type Page = "today" | "plan" | "groceries" | "progress";
type Meal = { type: string; time: string; name: string; calories: number; protein: number; prep: string; icon: string; tone: string; description: string; ingredients: string[] };

const weekMeals: Record<string, Meal[]> = {
  Mon: [
    { type: "Breakfast", time: "8:00 AM", name: "Berry protein oats", calories: 410, protein: 32, prep: "8 min", icon: "🥣", tone: "berry", description: "Creamy overnight oats with Greek yogurt, berries, chia, and vanilla protein.", ingredients: ["Rolled oats", "Greek yogurt", "Blueberries", "Chia seeds"] },
    { type: "Lunch", time: "12:30 PM", name: "Herby chicken grain bowl", calories: 560, protein: 48, prep: "20 min", icon: "🥗", tone: "grain", description: "Lemon-herb chicken with quinoa, crisp vegetables, and a yogurt tahini drizzle.", ingredients: ["Chicken breast", "Quinoa", "Cucumber", "Greek yogurt"] },
    { type: "Dinner", time: "6:30 PM", name: "Miso salmon & greens", calories: 610, protein: 46, prep: "25 min", icon: "🍲", tone: "salmon", description: "Miso-glazed salmon with sesame broccoli and brown rice.", ingredients: ["Salmon", "Broccoli", "Brown rice", "White miso"] },
  ],
  Tue: [
    { type: "Breakfast", time: "8:00 AM", name: "Spinach feta egg wrap", calories: 390, protein: 31, prep: "12 min", icon: "🌯", tone: "grain", description: "Soft eggs, spinach, and feta tucked into a warm whole-grain wrap.", ingredients: ["Eggs", "Spinach", "Feta", "Whole-grain wraps"] },
    { type: "Lunch", time: "12:30 PM", name: "Lemony tuna crunch salad", calories: 510, protein: 44, prep: "10 min", icon: "🥬", tone: "salmon", description: "A bright, crunchy salad with tuna, white beans, herbs, and lemon.", ingredients: ["Tuna", "White beans", "Mixed greens", "Lemon"] },
    { type: "Dinner", time: "6:30 PM", name: "Turkey meatballs & orzo", calories: 650, protein: 49, prep: "30 min", icon: "🍝", tone: "berry", description: "Lean turkey meatballs, roasted tomato sauce, orzo, and wilted spinach.", ingredients: ["Ground turkey", "Orzo", "Tomatoes", "Spinach"] },
  ],
  Wed: [
    { type: "Breakfast", time: "8:00 AM", name: "Apple cinnamon yogurt", calories: 380, protein: 34, prep: "5 min", icon: "🍎", tone: "berry", description: "Greek yogurt with warm cinnamon apple, walnuts, and oats.", ingredients: ["Greek yogurt", "Apples", "Walnuts", "Rolled oats"] },
    { type: "Lunch", time: "12:30 PM", name: "Leftover meatball bowl", calories: 540, protein: 45, prep: "7 min", icon: "🥘", tone: "grain", description: "Yesterday's meatballs repurposed over greens and orzo for zero waste.", ingredients: ["Turkey meatballs", "Orzo", "Mixed greens", "Tomatoes"] },
    { type: "Dinner", time: "6:30 PM", name: "Ginger tofu stir-fry", calories: 590, protein: 38, prep: "22 min", icon: "🍛", tone: "salmon", description: "Crisp tofu, broccoli, peppers, and brown rice in a ginger sesame sauce.", ingredients: ["Tofu", "Broccoli", "Bell peppers", "Brown rice"] },
  ],
};

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const groceryGroups = [
  { group: "Produce", items: [["Blueberries", "1 pint"], ["Apples", "4"], ["Broccoli", "2 heads"], ["Baby spinach", "10 oz"], ["Mixed greens", "8 oz"], ["Cucumber", "2"], ["Bell peppers", "3"], ["Lemons", "4"]] },
  { group: "Protein & dairy", items: [["Chicken breast", "1.5 lb"], ["Salmon fillets", "1.25 lb"], ["Lean ground turkey", "1 lb"], ["Extra-firm tofu", "14 oz"], ["Greek yogurt", "32 oz"], ["Eggs", "1 dozen"], ["Feta", "4 oz"]] },
  { group: "Pantry", items: [["Rolled oats", "18 oz"], ["Brown rice", "2 lb"], ["Quinoa", "12 oz"]] },
];

function fallbackMeals(day: string) {
  const base = weekMeals[["Mon", "Tue", "Wed"][dayNames.indexOf(day) % 3]];
  return base.map((meal, index) => ({ ...meal, name: index === 1 && day === "Sun" ? "Rotisserie chicken power bowl" : meal.name }));
}

export default function Home() {
  const [page, setPage] = useState<Page>("today");
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [savedMeals, setSavedMeals] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [name, setName] = useState("Francesco");
  const [targets, setTargets] = useState({ calories: 1850, protein: 145, fiber: 32, deficit: 4300 });
  const meals = weekMeals[selectedDay] ?? fallbackMeals(selectedDay);
  const eaten = Math.round(targets.calories * 0.85);
  const checkedCount = checked.length;

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "today", label: "Today", icon: "⌂" },
    { id: "plan", label: "Meal plan", icon: "▦" },
    { id: "groceries", label: "Groceries", icon: "◫" },
    { id: "progress", label: "Progress", icon: "↗" },
  ];

  function saveMeal(mealName: string) {
    setSavedMeals((current) => current.includes(mealName) ? current.filter((item) => item !== mealName) : [...current, mealName]);
  }

  function updateTargets(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const weightLb = Number(data.get("weight")) || 190;
    const heightIn = Number(data.get("height")) || 70;
    const age = Number(data.get("age")) || 35;
    const sex = String(data.get("sex"));
    const activity = Number(data.get("activity")) || 1.375;
    const kg = weightLb * 0.453592;
    const cm = heightIn * 2.54;
    const bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === "female" ? -161 : 5);
    const maintenance = bmr * activity;
    const floor = sex === "female" ? 1200 : 1500;
    const calorieTarget = Math.max(floor, Math.round((maintenance - 500) / 50) * 50);
    setTargets({ calories: calorieTarget, protein: Math.round(kg * 1.6), fiber: Math.max(25, Math.round(calorieTarget / 1000 * 14)), deficit: 3500 });
    setName(String(data.get("name")) || "You");
    setSetupOpen(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage("today")}><span className="brand-mark">✳</span> NutriPlan</button>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)} key={item.id}>
              <span>{item.icon}</span>{item.label}{item.id === "groceries" && <b>{18 - checkedCount}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">YOUR FOCUS</span>
          <strong>Lose weight steadily</strong>
          <p>~1 lb projected this week</p>
        </div>
        <button className="profile" onClick={() => setSetupOpen(true)}><span>{name.slice(0, 2).toUpperCase()}</span><span>{name}<small>Plan settings</small></span><i>···</i></button>
      </aside>

      <section className="content">
        {page === "today" && (
          <>
            <header className="topbar">
              <div><span className="eyebrow">YOUR PERSONAL PLAN</span><h1>Your week, made simple.</h1><p className="lede">A realistic plan built around your goals, schedule, and grocery budget.</p></div>
              <button className="outline-btn" onClick={() => setSetupOpen(true)}>Adjust my plan</button>
            </header>
            <section className="hero-grid">
              <article className="target-card">
                <div className="card-heading"><div><span className="eyebrow">TODAY&apos;S TARGET</span><h2>{targets.calories.toLocaleString()} calories</h2></div><span className="on-track">On track</span></div>
                <div className="rings" aria-label="Daily nutrition progress">
                  <div className="ring calories" style={{ "--progress": `${Math.round(eaten / targets.calories * 100)}%` } as React.CSSProperties}><div><strong>{eaten.toLocaleString()}</strong><span>of {targets.calories.toLocaleString()} kcal</span></div></div>
                  <div className="mini-stat"><span className="dot protein"></span><div><strong>{Math.round(targets.protein * .87)}g</strong><small>of {targets.protein}g protein</small></div></div>
                  <div className="mini-stat"><span className="dot fiber"></span><div><strong>{Math.round(targets.fiber * .86)}g</strong><small>of {targets.fiber}g fiber</small></div></div>
                </div>
                <p className="insight">Dinner closes most of your remaining protein gap without pushing you over calories.</p>
              </article>
              <article className="week-card">
                <div className="card-heading"><div><span className="eyebrow">THIS WEEK</span><h2>7 days planned</h2></div><button aria-label="Open weekly plan" onClick={() => setPage("plan")}>→</button></div>
                <div className="week-days">
                  {dayNames.map((day, index) => <div className={index === 6 ? "current" : ""} key={day}><span>{day[0]}</span><i className={index < 4 ? "done" : ""}>{index < 4 ? "✓" : index === 6 ? "3" : "·"}</i></div>)}
                </div>
                <div className="week-footer"><strong>−{targets.deficit.toLocaleString()} kcal</strong><span>weekly deficit</span><strong>~1.0 lb</strong><span>projected</span></div>
              </article>
            </section>
            <MealsSection meals={weekMeals.Mon} savedMeals={savedMeals} onSave={saveMeal} onOpen={setSelectedMeal} onFullWeek={() => setPage("plan")} />
            <section className="grocery-strip">
              <div className="basket">◫</div>
              <div><span className="eyebrow">GROCERIES READY</span><h3>18 ingredients for your whole week</h3><p>Organized by aisle, with smart quantities and substitution preferences.</p></div>
              <div className="grocery-total"><span>Est. total</span><strong>$86.40</strong></div>
              <button className="primary-btn" onClick={() => setPage("groceries")}>Review grocery list →</button>
            </section>
          </>
        )}

        {page === "plan" && (
          <section className="page-view">
            <header className="topbar"><div><span className="eyebrow">WEEK OF AUGUST 17</span><h1>Your meal plan</h1><p className="lede">Balanced for your calorie and protein targets, with overlapping ingredients to reduce waste.</p></div><button className="outline-btn" onClick={() => setSetupOpen(true)}>Tune plan</button></header>
            <div className="day-tabs" role="tablist" aria-label="Days of the week">
              {dayNames.map((day, index) => <button role="tab" aria-selected={selectedDay === day} onClick={() => setSelectedDay(day)} className={selectedDay === day ? "selected" : ""} key={day}><span>{day}</span><b>{17 + index}</b></button>)}
            </div>
            <div className="day-summary"><span><b>{meals.reduce((sum, m) => sum + m.calories, 0)}</b> kcal planned</span><span><b>{meals.reduce((sum, m) => sum + m.protein, 0)}g</b> protein</span><span><b>~{meals.reduce((sum, m) => sum + Number(m.prep.split(" ")[0]), 0)} min</b> total prep</span><i>Target: {targets.calories} kcal · {targets.protein}g protein</i></div>
            <MealsSection meals={meals} savedMeals={savedMeals} onSave={saveMeal} onOpen={setSelectedMeal} />
            <div className="plan-note"><span>♻</span><div><strong>Smart ingredient reuse</strong><p>Tuesday’s turkey meatballs become Wednesday’s lunch. Greek yogurt appears in three meals, so the full tub gets used.</p></div></div>
          </section>
        )}

        {page === "groceries" && (
          <section className="page-view">
            <header className="topbar"><div><span className="eyebrow">WEEKLY SHOP</span><h1>Your grocery list</h1><p className="lede">{checkedCount} of 18 items checked. Quantities already account for every recipe serving.</p></div><span className="total-pill">Estimated $86.40</span></header>
            <div className="grocery-layout">
              <div className="grocery-groups">
                {groceryGroups.map((group) => <article className="grocery-group" key={group.group}><div className="group-heading"><h2>{group.group}</h2><span>{group.items.length} items</span></div>{group.items.map(([item, quantity]) => <label className={checked.includes(item) ? "checked" : ""} key={item}><input type="checkbox" checked={checked.includes(item)} onChange={() => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}/><i>✓</i><span><strong>{item}</strong><small>{quantity}</small></span><button type="button" aria-label={`Options for ${item}`}>···</button></label>)}</article>)}
              </div>
              <aside className="retailer-card">
                <span className="retailer-logo">i</span><div><span className="eyebrow">FULFILLMENT</span><h2>Ready for Instacart</h2><p>The ingredient list is normalized and ready to match against real products once the Instacart MCP is available.</p></div>
                <div className="readiness"><span>Nutrition plan</span><b>Ready</b><span>Quantities</span><b>Ready</b><span>Product matching</span><b className="waiting">MCP</b></div>
                <button disabled>Connect Instacart MCP</button><small>No purchase can happen without your final review.</small>
              </aside>
            </div>
          </section>
        )}

        {page === "progress" && (
          <section className="page-view">
            <header className="topbar"><div><span className="eyebrow">YOUR TREND</span><h1>Progress, not perfection.</h1><p className="lede">The plan adjusts from what you actually eat—not from one imperfect day.</p></div><button className="outline-btn">Log check-in</button></header>
            <div className="progress-grid">
              <article className="progress-chart"><span className="eyebrow">WEIGHT TREND</span><div className="progress-kpis"><div><strong>−3.8 lb</strong><span>last 4 weeks</span></div><div><strong>78%</strong><span>plan adherence</span></div></div><div className="chart" aria-label="Weight trending down over four weeks"><i style={{height:"28%"}}></i><i style={{height:"42%"}}></i><i style={{height:"48%"}}></i><i style={{height:"63%"}}></i><i style={{height:"72%"}}></i><i style={{height:"82%"}}></i><i style={{height:"91%"}}></i></div><div className="chart-labels"><span>Jul 20</span><span>Today</span></div></article>
              <article className="consistency-card"><span className="eyebrow">WHAT'S WORKING</span><h2>Protein-forward lunches</h2><p>On days you hit at least 40g of protein at lunch, your evening hunger is 23% lower.</p><div className="signal"><span>↗</span><div><strong>Keep this pattern</strong><small>Included in next week’s plan</small></div></div></article>
            </div>
            <div className="safety-note"><span>ⓘ</span><p>Weight naturally fluctuates. NutriPlan uses multi-week trends and conservative targets; it doesn’t diagnose conditions or replace medical advice.</p></div>
          </section>
        )}
      </section>

      {setupOpen && <SetupModal name={name} onClose={() => setSetupOpen(false)} onSubmit={updateTargets} />}
      {selectedMeal && <MealModal meal={selectedMeal} saved={savedMeals.includes(selectedMeal.name)} onSave={() => saveMeal(selectedMeal.name)} onClose={() => setSelectedMeal(null)} />}
    </main>
  );
}

function MealsSection({ meals, savedMeals, onSave, onOpen, onFullWeek }: { meals: Meal[]; savedMeals: string[]; onSave: (name: string) => void; onOpen: (meal: Meal) => void; onFullWeek?: () => void }) {
  return <section className="meal-section"><div className="section-title"><div><span className="eyebrow">{onFullWeek ? "MONDAY'S PLAN" : "SELECTED DAY"}</span><h2>Meals for the day</h2></div>{onFullWeek && <button className="text-btn" onClick={onFullWeek}>View full week →</button>}</div><div className="meal-grid">{meals.map((meal) => <article className="meal-card" key={meal.name}><div className={`meal-art ${meal.tone}`}><span>{meal.icon}</span><button className={savedMeals.includes(meal.name) ? "saved" : ""} onClick={() => onSave(meal.name)} aria-label={`Save ${meal.name}`}>{savedMeals.includes(meal.name) ? "♥" : "♡"}</button></div><div className="meal-copy"><span>{meal.type} · {meal.time}</span><h3>{meal.name}</h3><p>{meal.calories} kcal · {meal.protein}g protein · {meal.prep}</p><button onClick={() => onOpen(meal)}>View recipe <b>→</b></button></div></article>)}</div></section>;
}

function SetupModal({ name, onClose, onSubmit }: { name: string; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><form className="setup-modal" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PLAN SETTINGS</span><h2>Build your targets</h2><p>We use a standard energy equation, then apply a conservative calorie deficit.</p></div><button type="button" onClick={onClose} aria-label="Close">×</button></div><div className="form-grid"><label>Name<input name="name" defaultValue={name}/></label><label>Goal<select name="goal" defaultValue="lose"><option value="lose">Lose weight</option><option value="maintain">Maintain weight</option><option value="gain">Gain muscle</option></select></label><label>Age<input name="age" type="number" min="18" max="100" defaultValue="35"/></label><label>Sex used for equation<select name="sex" defaultValue="male"><option value="male">Male</option><option value="female">Female</option></select></label><label>Height (inches)<input name="height" type="number" min="48" max="84" defaultValue="70"/></label><label>Current weight (lb)<input name="weight" type="number" min="90" max="500" defaultValue="190"/></label><label className="wide">Activity level<select name="activity" defaultValue="1.375"><option value="1.2">Mostly sedentary</option><option value="1.375">Lightly active</option><option value="1.55">Moderately active</option><option value="1.725">Very active</option></select></label></div><div className="preference-row"><span>High protein</span><span>30-minute meals</span><span>Reduce food waste</span></div><div className="modal-actions"><button type="button" className="outline-btn" onClick={onClose}>Cancel</button><button className="primary-btn">Calculate & update plan →</button></div><small className="fine-print">For general wellness only. People who are pregnant, under 18, have an eating disorder history, or manage a medical condition should use clinician-provided targets.</small></form></div>;
}

function MealModal({ meal, saved, onSave, onClose }: { meal: Meal; saved: boolean; onSave: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><article className="recipe-modal" onMouseDown={(event) => event.stopPropagation()}><div className={`recipe-hero ${meal.tone}`}><span>{meal.icon}</span><button onClick={onClose} aria-label="Close">×</button></div><div className="recipe-body"><span className="eyebrow">{meal.type} · {meal.prep}</span><h2>{meal.name}</h2><p>{meal.description}</p><div className="recipe-macros"><span><b>{meal.calories}</b> calories</span><span><b>{meal.protein}g</b> protein</span><span><b>1</b> serving</span></div><h3>What you’ll need</h3><ul>{meal.ingredients.map((ingredient) => <li key={ingredient}><span>✓</span>{ingredient}</li>)}</ul><h3>Quick method</h3><p>Prep the ingredients, cook the main protein until done, and assemble with the vegetables and grain. Season to taste and serve warm.</p><button className="primary-btn" onClick={onSave}>{saved ? "Saved to favorites ♥" : "Save this meal ♡"}</button></div></article></div>;
}
