"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "./i18n-provider";
import { tx } from "./i18n-shared";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLanguage();
  useEffect(() => { console.error(error); }, [error]);
  return <main className="page-wrap inner-page status-page" role="alert">
    <span className="status-code">{tx(locale, "Something went wrong", "문제가 생겼어요")}</span>
    <h1>{tx(locale, "This page could not open.", "페이지를 열지 못했습니다.")}</h1>
    <p>{tx(locale, "Please try again in a moment. Your saved work is safe.", "잠시 후 다시 시도해 주세요. 저장된 내용은 안전합니다.")}</p>
    <div className="status-actions"><button type="button" className="button button-blue" onClick={reset}>{tx(locale, "Try again", "다시 시도")}</button><Link className="underlined-link" href="/">{tx(locale, "Back to u.a.u", "u.a.u 홈으로")}</Link></div>
  </main>;
}
