"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdditionalUserInfo,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseConfigured, auth, db } from "../firebase-client";
import { tx, type Locale } from "../i18n-shared";

const providers = [
  { id: "google", name: "Google" },
  { id: "apple", name: "Apple" },
  { id: "naver", name: "Naver" },
  { id: "facebook", name: "Facebook" },
] as const;

export function SocialLoginButtons({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function routeAfterAuth(user: User, isNewUser = false) {
    if (isNewUser) {
      router.replace("/onboarding");
      return;
    }
    if (!db) {
      router.replace("/dashboard");
      return;
    }
    try {
      const profile = await getDoc(doc(db, "users", user.uid));
      router.replace(profile.data()?.onboardingCompleted === true ? "/dashboard" : "/onboarding");
    } catch {
      router.replace("/dashboard");
    }
  }

  useEffect(() => {
    if (!auth || !firebaseConfigured) return;

    getRedirectResult(auth)
      .then((result) => {
        if (result) return routeAfterAuth(result.user, getAdditionalUserInfo(result)?.isNewUser === true);
      })
      .catch(() => {
        setError(
          tx(
            locale,
            "Google sign-in could not be completed. Please try again.",
            "Google 로그인을 완료하지 못했습니다. 다시 시도해 주세요.",
          ),
        );
      });
  }, [locale, router]);

  async function signInWithGoogle() {
    if (!auth || !firebaseConfigured) {
      setError(tx(locale, "Firebase is not configured yet.", "Firebase 설정이 아직 완료되지 않았습니다."));
      return;
    }

    setPending(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        const credential = await signInWithPopup(auth, provider);
        await routeAfterAuth(credential.user, getAdditionalUserInfo(credential)?.isNewUser === true);
      } catch (caughtError) {
        const code = caughtError instanceof Error ? caughtError.message : "";
        if (code.includes("popup-blocked") || code.includes("operation-not-supported-in-this-environment")) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw caughtError;
      }
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : "";
      setError(
        code.includes("popup-closed-by-user")
          ? tx(locale, "The Google sign-in window was closed.", "Google 로그인 창이 닫혔습니다.")
          : tx(locale, "Google sign-in could not be completed. Please try again.", "Google 로그인을 완료하지 못했습니다. 다시 시도해 주세요."),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div
        className="auth-providers"
        aria-label={tx(locale, "Social login options", "소셜 로그인 선택")}
      >
        {providers.map((provider) => {
          const isGoogle = provider.id === "google";
          return (
            <button
              className="button button-outline auth-provider"
              data-auth-provider={provider.id}
              disabled={!isGoogle || pending}
              type="button"
              key={provider.id}
              onClick={isGoogle ? signInWithGoogle : undefined}
            >
              <span
                className={`auth-provider-mark auth-provider-mark-${provider.id}`}
                aria-hidden="true"
              >
                {provider.name.slice(0, 1)}
              </span>
              {tx(locale, `Continue with ${provider.name}`, `${provider.name}로 계속하기`)}
              {!isGoogle && (
                <span className="auth-provider-status">
                  {tx(locale, "Soon", "준비 중")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="auth-error" role="alert">{error}</p>
      )}
    </>
  );
}
