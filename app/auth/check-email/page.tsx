import Link from "next/link";

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; reset?: string }> }) {
  const { email, reset } = await searchParams;
  return <article className="auth-card auth-check"><span className="mail">✉</span><header><span className="auth-kicker">CHECK YOUR INBOX</span><h2>{reset ? "Your reset link is on its way" : "Confirm your account"}</h2><p>We sent a secure link{email ? ` to ${email}` : " to your email"}. Open it in this browser to continue.</p></header><Link href="/auth/login">Back to sign in</Link></article>;
}
