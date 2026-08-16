import { AuthForm } from "../auth-form";
import { signIn } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <article className="auth-card"><header><span className="auth-kicker">WELCOME BACK</span><h2>Sign in to NutriPlan</h2><p>Open your private meal-planning workspace.</p></header>{params.error && <p className="auth-error" role="alert">{params.error}</p>}<AuthForm action={signIn} mode="login" next={params.next} /></article>;
}
