import Link from "next/link";
import { getServerLocale } from "../server-locale";
import { tx } from "../i18n-shared";
import { AuthForm } from "./auth-form";

export default function LoginPage() {
  const locale = getServerLocale();
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="auth-kicker">{tx(locale, "MY U.A.U", "MY U.A.U")}</span>
          <h1>
            {tx(
              locale,
              <>Come a little<br /><em>closer.</em></>,
              <>조금 더<br /><em>가까이.</em></>,
            )}
          </h1>
          <p>
            {tx(
              locale,
              "Save artists, works, and the connections you want to return to.",
              "다시 돌아오고 싶은 아티스트와 작품, 연결을 저장하세요.",
            )}
          </p>
        </div>
        <AuthForm locale={locale} />
        <p className="auth-foot">
          {tx(locale, "No account yet?", "아직 계정이 없나요?")} <Link href="/join">{tx(locale, "Join the unit", "유닛에 함께하기")}</Link>
        </p>
      </div>
      <div className="auth-aside">
        <span>u.a.u</span>
        <p>
          {tx(
            locale,
            <>Artists enter through practice,<br /><em>remain through relationship.</em></>,
            <>아티스트는 실천으로 들어와<br /><em>관계로 남습니다.</em></>,
          )}
        </p>
      </div>
    </main>
  );
}
