"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error } = await createSupabaseBrowser().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (error) { setError(error.message); setLoading(false); return; }
    router.replace("/admin"); router.refresh();
  }
  async function emailLink() {
    const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value.trim();
    if (!email) { setError("Enter your administrator email first."); return; }
    setLoading(true); setError(""); setMessage("");
    const { error } = await createSupabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` } });
    if (error) setError(error.message); else setMessage("Check your email for the secure sign-in link.");
    setLoading(false);
  }
  return <form className="login-form" onSubmit={login}><label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Password<input name="password" type="password" required autoComplete="current-password" /></label>{error && <p className="error" role="alert">{error}</p>}{message && <p className="login-message" role="status">{message}</p>}<button className="admin-primary" disabled={loading}>{loading ? "Please wait..." : "Sign in"}</button><button className="admin-secondary" type="button" onClick={emailLink} disabled={loading}>Email me a sign-in link</button></form>;
}
