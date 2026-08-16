"use server";

import { createClient } from "../lib/supabase/server";
import { validatePlan, type PlanDay, type Profile, type Targets } from "./planner";

export type MutationResult = { ok: true; planId?: string } | { ok: false; error: string };

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Your session expired. Sign in again to save changes.");
  return { supabase, user };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "We could not save that change.";
}

async function persistPlan(
  profile: Profile,
  targets: Targets,
  plan: PlanDay[],
  seed: number,
  planId: string | null,
  status: "draft" | "approved",
): Promise<MutationResult> {
  try {
    const { supabase, user } = await authenticatedClient();
    const profileResult = await supabase.from("health_profiles").upsert({ user_id: user.id, profile }, { onConflict: "user_id" });
    if (profileResult.error) return { ok: false, error: profileResult.error.message };

    const values = {
      user_id: user.id,
      seed,
      status,
      profile_snapshot: profile,
      targets_snapshot: targets,
      plan_snapshot: plan,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    };

    if (planId) {
      const result = await supabase.from("meal_plans").update(values).eq("id", planId).eq("user_id", user.id).select("id").single();
      if (result.error) return { ok: false, error: result.error.message };
      if (status === "draft") {
        const groceryResult = await supabase.from("grocery_item_states").delete().eq("plan_id", result.data.id).eq("user_id", user.id);
        if (groceryResult.error) return { ok: false, error: groceryResult.error.message };
      }
      return { ok: true, planId: String(result.data.id) };
    }

    const result = await supabase.from("meal_plans").insert(values).select("id").single();
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true, planId: String(result.data.id) };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function savePlanDraft(profile: Profile, targets: Targets, plan: PlanDay[], seed: number, planId: string | null) {
  return persistPlan(profile, targets, plan, seed, planId, "draft");
}

export async function approvePlan(profile: Profile, targets: Targets, plan: PlanDay[], seed: number, planId: string | null) {
  const validation = validatePlan(profile, targets, plan);
  if (!validation.valid) return { ok: false, error: validation.issues[0] ?? "This plan cannot be approved." } satisfies MutationResult;
  return persistPlan(profile, targets, plan, seed, planId, "approved");
}

export async function setMealSaved(mealName: string, saved: boolean): Promise<MutationResult> {
  try {
    const { supabase, user } = await authenticatedClient();
    const mealKey = mealName.trim().toLowerCase();
    const result = saved
      ? await supabase.from("saved_meals").upsert({ user_id: user.id, meal_key: mealKey, meal_name: mealName }, { onConflict: "user_id,meal_key" })
      : await supabase.from("saved_meals").delete().eq("user_id", user.id).eq("meal_key", mealKey);
    return result.error ? { ok: false, error: result.error.message } : { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function setGroceryRemoved(planId: string, itemKey: string, removed: boolean): Promise<MutationResult> {
  try {
    const { supabase, user } = await authenticatedClient();
    const result = removed
      ? await supabase.from("grocery_item_states").upsert({ plan_id: planId, user_id: user.id, item_key: itemKey }, { onConflict: "plan_id,item_key" })
      : await supabase.from("grocery_item_states").delete().eq("plan_id", planId).eq("user_id", user.id).eq("item_key", itemKey);
    return result.error ? { ok: false, error: result.error.message } : { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}

export async function restoreGroceries(planId: string): Promise<MutationResult> {
  try {
    const { supabase, user } = await authenticatedClient();
    const result = await supabase.from("grocery_item_states").delete().eq("plan_id", planId).eq("user_id", user.id);
    return result.error ? { ok: false, error: result.error.message } : { ok: true };
  } catch (error) {
    return { ok: false, error: message(error) };
  }
}
