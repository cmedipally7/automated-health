import type { ReactNode } from "react";
import Link from "next/link";
import "./auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen">
      <section className="auth-story" aria-label="About NutriPlan">
        <Link className="auth-brand" href="/"><span>✳</span> NutriPlan</Link>
        <div>
          <span className="auth-kicker">YOUR PLAN, WHERE YOU LEFT IT</span>
          <h1>A calmer way to plan a healthy week.</h1>
          <p>Your private account keeps your profile, approved meal plan, saved recipes, and grocery review ready for next time.</p>
          <ul><li>Private account access</li><li>Persistent meal plans</li><li>Saved grocery review</li></ul>
        </div>
        <small>General wellness planning—not medical diagnosis or treatment.</small>
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  );
}
