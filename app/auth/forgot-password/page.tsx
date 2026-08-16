import { AuthForm } from "../auth-form";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  return <article className="auth-card"><header><span className="auth-kicker">ACCOUNT RECOVERY</span><h2>Reset your password</h2><p>We’ll email you a secure link to choose a new password.</p></header><AuthForm action={requestPasswordReset} mode="forgot" /></article>;
}
