import { AuthForm } from "../auth-form";
import { updatePassword } from "../actions";

export default function UpdatePasswordPage() {
  return <article className="auth-card"><header><span className="auth-kicker">ALMOST DONE</span><h2>Choose a new password</h2><p>Use at least 8 characters, then you’ll return to your plan.</p></header><AuthForm action={updatePassword} mode="update" /></article>;
}
