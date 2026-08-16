import { AuthForm } from "../auth-form";
import { signUp } from "../actions";

export default function SignUpPage() {
  return <article className="auth-card"><header><span className="auth-kicker">YOUR PRIVATE WORKSPACE</span><h2>Create your account</h2><p>Your profile and plans will be saved privately to this account.</p></header><AuthForm action={signUp} mode="sign-up" /></article>;
}
