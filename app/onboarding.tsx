"use client";

import { useMemo, useState } from "react";
import {
  calculateTargets,
  defaultProfile,
  goalLabel,
  type Activity,
  type Diet,
  type Profile,
  type Sex,
} from "./planner";

const allergyOptions = [
  ["Nuts", "🥜"],
  ["Dairy", "🧀"],
  ["Gluten", "🌾"],
  ["Eggs", "🥚"],
  ["Soy", "🫘"],
  ["Shellfish", "🦐"],
] as const;

const dietOptions: { label: Diet; emoji: string; description: string }[] = [
  { label: "Balanced", emoji: "🍽️", description: "Meat, fish, eggs, and dairy allowed" },
  { label: "Pescatarian", emoji: "🐟", description: "Fish, eggs, and dairy included" },
  { label: "Vegetarian", emoji: "🥕", description: "No meat or fish" },
  { label: "Vegan", emoji: "🌱", description: "Plant-based only" },
];

type StepId = "goal" | "about" | "height" | "weight" | "pace" | "activity" | "allergies" | "diet" | "budget" | "summary";

export default function Onboarding({ initialProfile, onComplete }: { initialProfile?: Profile; onComplete: (profile: Profile) => void }) {
  const [profile, setProfile] = useState<Profile>(initialProfile ?? defaultProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [heightUnit, setHeightUnit] = useState<"cm" | "in">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [error, setError] = useState("");

  const steps: StepId[] = profile.goal === "lose"
    ? ["goal", "about", "height", "weight", "pace", "activity", "allergies", "diet", "budget", "summary"]
    : ["goal", "about", "height", "weight", "activity", "allergies", "diet", "budget", "summary"];
  const current = steps[stepIndex] ?? "summary";
  const targets = useMemo(() => calculateTargets(profile), [profile]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((existing) => ({ ...existing, [key]: value }));
  }

  function next() {
    setError("");
    if (current === "about" && (!profile.name.trim() || profile.age < 18)) {
      setError("Add your name and an age of 18 or older.");
      return;
    }
    if (current === "allergies" && !profile.noAllergies && profile.allergies.length === 0 && !profile.customAllergy.trim()) {
      setError("Select an allergy or choose “No allergies.”");
      return;
    }
    if (current === "summary") {
      onComplete(profile);
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function back() {
    setError("");
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function toggleAllergy(allergy: string) {
    setProfile((existing) => ({
      ...existing,
      noAllergies: false,
      allergies: existing.allergies.includes(allergy)
        ? existing.allergies.filter((item) => item !== allergy)
        : [...existing.allergies, allergy],
    }));
  }

  return (
    <main className="onboarding-screen">
      <div className="wizard-shell">
        <header className="wizard-brand">
          <span className="brand-mark">✳</span>
          <strong>NutriPlan</strong>
          <span>Profile → plan → groceries</span>
        </header>

        <div className="wizard-progress">
          <div><span>Step {stepIndex + 1} of {steps.length}</span><b>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</b></div>
          <i><span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} /></i>
        </div>

        <section className="wizard-content" key={current}>
          <div className="wizard-heading">
            <span className="eyebrow">{stepEyebrow(current)}</span>
            <h1>{stepTitle(current)}</h1>
            <p>{stepSubtitle(current)}</p>
          </div>

          {current === "goal" && (
            <div className="option-stack">
              <Choice title="Lose weight" icon="🍀" description="A sustainable, conservative calorie deficit" selected={profile.goal === "lose"} onClick={() => update("goal", "lose")} />
              <Choice title="Gain muscle" icon="💪" description="A modest surplus with higher protein" selected={profile.goal === "gain"} onClick={() => update("goal", "gain")} />
              <Choice title="Maintain weight" icon="⚖️" description="Keep your current energy balance" selected={profile.goal === "maintain"} onClick={() => update("goal", "maintain")} />
            </div>
          )}

          {current === "about" && (
            <div className="wizard-form">
              <label className="wide">What should we call you?<input value={profile.name} onChange={(event) => update("name", event.target.value)} placeholder="Your first name" /></label>
              <label>Age<input type="number" min="18" max="100" value={profile.age} onChange={(event) => update("age", Number(event.target.value))} /></label>
              <label>Sex used for calculation<select value={profile.sex} onChange={(event) => update("sex", event.target.value as Sex)}><option value="female">Female</option><option value="male">Male</option></select></label>
              <p className="field-context">These inputs are used only to estimate resting energy needs. They don’t affect which foods you can choose.</p>
            </div>
          )}

          {current === "height" && (
            <Measurement
              units={["cm", "in"]}
              selectedUnit={heightUnit}
              onUnit={(unit) => setHeightUnit(unit as "cm" | "in")}
              value={profile.heightCm}
              display={heightUnit === "cm" ? `${Math.round(profile.heightCm)} cm` : cmToFeet(profile.heightCm)}
              min={122}
              max={213}
              step={heightUnit === "cm" ? 1 : 2.54}
              onChange={(value) => update("heightCm", value)}
              range="4'0&quot; – 7'0&quot;"
            />
          )}

          {current === "weight" && (
            <Measurement
              units={["kg", "lb"]}
              selectedUnit={weightUnit}
              onUnit={(unit) => setWeightUnit(unit as "kg" | "lb")}
              value={profile.weightKg}
              display={weightUnit === "kg" ? `${profile.weightKg.toFixed(1)} kg` : `${(profile.weightKg * 2.20462).toFixed(1)} lb`}
              min={41}
              max={227}
              step={weightUnit === "kg" ? 1 : .453592}
              onChange={(value) => update("weightKg", value)}
              range="90 – 500 lb"
            />
          )}

          {current === "pace" && (
            <div className="option-stack">
              <Choice title="0.25 kg per week" icon="〰" description="Gentle and highly sustainable" selected={profile.paceKg === .25} onClick={() => update("paceKg", .25)} />
              <Choice title="0.5 kg per week" icon="📉" description="A steady default for many adults" selected={profile.paceKg === .5} onClick={() => update("paceKg", .5)} recommended />
              <Choice title="1 kg per week" icon="↘" description="Applied only when the calculated deficit remains reasonable" selected={profile.paceKg === 1} onClick={() => update("paceKg", 1)} />
              <div className="guardrail-note"><span>ⓘ</span><p>The calculator caps the deficit at 20% of estimated maintenance calories even if a faster pace is selected.</p></div>
            </div>
          )}

          {current === "activity" && (
            <div className="option-stack">
              <Choice title="Mostly sedentary" icon="🪑" description="Desk-based day with minimal intentional exercise" selected={profile.activity === "sedentary"} onClick={() => update("activity", "sedentary" as Activity)} />
              <Choice title="Active about 3× per week" icon="🏃" description="Light-to-moderate training or regular walking" selected={profile.activity === "3x"} onClick={() => update("activity", "3x" as Activity)} />
              <Choice title="Active about 5× per week" icon="🏋️" description="Frequent training and an active routine" selected={profile.activity === "5x"} onClick={() => update("activity", "5x" as Activity)} />
            </div>
          )}

          {current === "allergies" && (
            <div className="allergy-area">
              <div className="check-grid">
                {allergyOptions.map(([label, icon]) => <CheckChoice key={label} title={label} icon={icon} checked={profile.allergies.includes(label)} onClick={() => toggleAllergy(label)} />)}
              </div>
              <label className="text-entry">Other allergy or ingredient to exclude<input value={profile.customAllergy} onChange={(event) => { update("customAllergy", event.target.value); if (event.target.value) update("noAllergies", false); }} placeholder="e.g. sesame" /></label>
              <CheckChoice title="No allergies" icon="✓" checked={profile.noAllergies} onClick={() => setProfile((existing) => ({ ...existing, noAllergies: !existing.noAllergies, allergies: [], customAllergy: "" }))} />
            </div>
          )}

          {current === "diet" && (
            <div className="option-stack">
              {dietOptions.map((option) => <Choice key={option.label} title={option.label} icon={option.emoji} description={option.description} selected={profile.diet === option.label} onClick={() => update("diet", option.label)} />)}
              <div className="standards-row"><span>Preparation standards</span>{["Halal", "Kosher"].map((standard) => <button type="button" className={profile.standards.includes(standard) ? "selected" : ""} key={standard} onClick={() => update("standards", profile.standards.includes(standard) ? profile.standards.filter((item) => item !== standard) : [...profile.standards, standard])}>{standard}</button>)}</div>
            </div>
          )}

          {current === "budget" && (
            <div className="option-stack">
              {[
                ["$15–20", "Budget-focused", "Staples and repeated ingredients"],
                ["$20–30", "Everyday", "Balanced variety and value"],
                ["$30+", "Flexible", "More variety and premium proteins"],
              ].map(([value, title, description]) => <Choice key={value} title={`${value} / week`} icon="＄" description={`${title} · ${description}`} selected={profile.budget === value} onClick={() => update("budget", value as Profile["budget"])} />)}
              <Choice title="Custom weekly budget" icon="🎯" description="Set your own target" selected={profile.budget === "custom"} onClick={() => update("budget", "custom")} />
              {profile.budget === "custom" && <label className="custom-budget">Weekly target ($)<input type="number" min="15" max="500" value={profile.customBudget} onChange={(event) => update("customBudget", Number(event.target.value))} /></label>}
              <div className="guardrail-note"><span>ⓘ</span><p>Budget is a planning preference until live store pricing is connected. You’ll always review the actual cart total later.</p></div>
            </div>
          )}

          {current === "summary" && (
            <div className="summary-stack">
              <div className="summary-target">
                <span className="eyebrow">ESTIMATED DAILY TARGET</span>
                <strong>{targets.calories.toLocaleString()} <small>kcal</small></strong>
                <p>{targets.protein}g protein · {targets.fiber}g fiber · {targets.maintenance.toLocaleString()} kcal estimated maintenance</p>
              </div>
              <div className="summary-table">
                <SummaryRow label="Goal" value={goalLabel(profile.goal)} />
                <SummaryRow label="Body" value={`${Math.round(profile.heightCm)} cm · ${profile.weightKg.toFixed(1)} kg`} />
                <SummaryRow label="Diet" value={profile.diet + (profile.standards.length ? ` · ${profile.standards.join(", ")}` : "")} />
                <SummaryRow label="Allergies" value={profile.noAllergies ? "None" : [...profile.allergies, profile.customAllergy].filter(Boolean).join(", ")} />
                <SummaryRow label="Budget" value={profile.budget === "custom" ? `$${profile.customBudget}/week` : `$${profile.budget}/week`} />
              </div>
              <div className="guardrail-note"><span>✓</span><p>Next, NutriPlan will propose seven days of meals. The grocery list is created only after you approve that plan.</p></div>
            </div>
          )}

          {error && <p className="wizard-error" role="alert">{error}</p>}
        </section>

        <footer className="wizard-actions">
          {stepIndex > 0 && <button type="button" className="wizard-back" onClick={back}>← Back</button>}
          <button type="button" className="wizard-next" onClick={next}>{current === "summary" ? "Create my meal plan →" : "Continue →"}</button>
        </footer>
        <p className="wizard-disclaimer">General wellness planning only—not medical advice. Clinician-provided targets should take precedence.</p>
      </div>
    </main>
  );
}

function Choice({ title, icon, description, selected, recommended, onClick }: { title: string; icon: string; description: string; selected: boolean; recommended?: boolean; onClick: () => void }) {
  return <button type="button" className={`wizard-choice ${selected ? "selected" : ""}`} onClick={onClick}><span className="choice-icon">{icon}</span><span><strong>{title}{recommended && <em>Recommended</em>}</strong><small>{description}</small></span><i>{selected ? "●" : ""}</i></button>;
}

function CheckChoice({ title, icon, checked, onClick }: { title: string; icon: string; checked: boolean; onClick: () => void }) {
  return <button type="button" className={`check-choice ${checked ? "selected" : ""}`} onClick={onClick}><i>{checked ? "✓" : ""}</i><span>{icon}</span><strong>{title}</strong></button>;
}

function Measurement({ units, selectedUnit, onUnit, value, display, min, max, step, onChange, range }: { units: [string, string]; selectedUnit: string; onUnit: (unit: string) => void; value: number; display: string; min: number; max: number; step: number; onChange: (value: number) => void; range: string }) {
  return <div className="measurement"><div className="unit-toggle">{units.map((unit) => <button type="button" key={unit} className={unit === selectedUnit ? "selected" : ""} onClick={() => onUnit(unit)}>{unit}</button>)}</div><div className="stepper"><button type="button" onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))} disabled={value <= min}>−</button><strong>{display}</strong><button type="button" onClick={() => onChange(Math.min(max, Number((value + step).toFixed(2))))} disabled={value >= max}>+</button></div><p>Supported range: {range}</p></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value || "None"}</strong></div>;
}

function cmToFeet(cm: number) {
  const inches = cm / 2.54;
  return `${Math.floor(inches / 12)}′ ${Math.round(inches % 12)}″`;
}

function stepEyebrow(step: StepId) {
  const map: Record<StepId, string> = { goal: "YOUR OUTCOME", about: "ABOUT YOU", height: "BODY DETAILS", weight: "BODY DETAILS", pace: "YOUR PACE", activity: "YOUR ROUTINE", allergies: "FOOD SAFETY", diet: "FOOD PREFERENCES", budget: "SHOPPING", summary: "REVIEW" };
  return map[step];
}

function stepTitle(step: StepId) {
  const map: Record<StepId, string> = { goal: "What’s your main goal?", about: "A little about you.", height: "How tall are you?", weight: "What’s your current weight?", pace: "What pace feels realistic?", activity: "How active are you?", allergies: "Any food allergies?", diet: "How do you prefer to eat?", budget: "What should the week cost?", summary: "Your starting targets." };
  return map[step];
}

function stepSubtitle(step: StepId) {
  const map: Record<StepId, string> = { goal: "We’ll build your nutrition and meal plan around this.", about: "These details make the target calculation auditable and personal.", height: "Height helps estimate your baseline energy needs.", weight: "Weight informs your calorie and protein targets.", pace: "We’ll respect this preference while applying conservative guardrails.", activity: "More activity generally means more fuel.", allergies: "These are hard exclusions from every proposed meal.", diet: "We’ll use this to select the recipe pool.", budget: "This guides ingredient reuse and protein choices.", summary: "Review the calculation before we propose your meals." };
  return map[step];
}
