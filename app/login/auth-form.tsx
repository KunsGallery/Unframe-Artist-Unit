"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { createUserWithEmailAndPassword, getAdditionalUserInfo, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, auth, db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";
import { SocialLoginButtons } from "./social-login-buttons";
import { useRouter } from "next/navigation";

export function AuthForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function routeAfterAuth(uid: string, isNewUser = false) {
    if (isNewUser || !db) {
      router.replace(isNewUser ? "/onboarding" : "/dashboard");
      return;
    }
    try {
      const profile = await getDoc(doc(db, "users", uid));
      router.replace(profile.data()?.onboardingCompleted === true ? "/dashboard" : "/onboarding");
    } catch {
      router.replace("/onboarding");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || !firebaseConfigured) {
      setError(tx(locale, "Firebase is not configured yet.", "Firebase 설정이 아직 완료되지 않았습니다."));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const credential = mode === "signin"
        ? await signInWithEmailAndPassword(auth, email.trim(), password)
        : await createUserWithEmailAndPassword(auth, email.trim(), password);
      await routeAfterAuth(credential.user.uid, getAdditionalUserInfo(credential)?.isNewUser === true);
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : "";
      const message = code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")
        ? tx(locale, "The email or password is not correct.", "이메일 또는 비밀번호를 확인해 주세요.")
        : code.includes("auth/email-already-in-use")
          ? tx(locale, "This email already has an account. Try signing in.", "이미 가입된 이메일입니다. 로그인해 주세요.")
          : code.includes("auth/weak-password")
            ? tx(locale, "Use a password with at least 6 characters.", "비밀번호는 6자 이상 입력해 주세요.")
            : tx(locale, "We couldn't complete this step. Please try again.", "요청을 완료하지 못했습니다. 다시 시도해 주세요.");
      setError(message);
    } finally {
      setPending(false);
    }
  }

  async function resetPassword() {
    if (!auth || pending) return;
    if (!email.trim()) { setError(tx(locale, "Enter your email address first.", "먼저 이메일 주소를 입력해 주세요.")); return; }
    setPending(true); setError(null); setNotice("");
    try { await sendPasswordResetEmail(auth, email.trim()); setNotice(tx(locale, "If an account exists, a reset email will arrive. Check your inbox and spam folder.", "해당 이메일로 가입된 계정이 있으면 재설정 메일이 발송됩니다. 받은 편지함과 스팸함을 확인해 주세요.")); }
    catch { setError(tx(locale, "Unable to send a reset email. Check the address and try again later.", "재설정 메일을 보내지 못했습니다. 주소를 확인하고 잠시 후 다시 시도해 주세요.")); }
    finally { setPending(false); }
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="auth-form-heading"><span>{mode === "signin" ? tx(locale, "RETURNING MEMBER", "기존 멤버") : tx(locale, "FIRST ENTRY", "첫 입장")}</span><button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}>{mode === "signin" ? tx(locale, "Create account", "계정 만들기") : tx(locale, "I already have an account", "이미 계정이 있습니다")}</button></div>
    <label>{tx(locale, "Email address", "이메일 주소")}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
    <label>{tx(locale, "Password", "비밀번호")}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required /></label>
    <button className="button button-blue" type="submit" disabled={pending}>{pending ? tx(locale, "Opening…", "여는 중…") : mode === "signin" ? tx(locale, "Sign in", "로그인") : tx(locale, "Create account", "계정 만들기")} <ArrowRight size={16} /></button>
    {mode === "signin" && <button type="button" className="text-link" disabled={pending} onClick={resetPassword}>{tx(locale, "Forgot password?", "비밀번호를 잊으셨나요?")}</button>}
    {notice && <p role="status">{notice}</p>}
    <div className="auth-divider"><span>{tx(locale, "or", "또는")}</span></div>
    <SocialLoginButtons locale={locale} />
    {error && <p className="auth-error" role="alert">{error}</p>}
  </form>;
}
