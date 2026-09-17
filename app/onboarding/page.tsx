"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { accountTypes, saveUserProfile, useUserProfile, type UauAccountType } from "../profile";
import { useAuth } from "../auth-provider";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

type OnboardingForm = {
  accountType: UauAccountType | "";
  displayName: string;
  artistName: string;
  country: string;
  basedInCity: string;
  practice: string;
};

const initialForm: OnboardingForm = {
  accountType: "",
  displayName: "",
  artistName: "",
  country: "",
  basedInCity: "",
  practice: "",
};

function roleDescription(role: UauAccountType, locale: "en" | "ko") {
  const descriptions: Record<UauAccountType, [string, string]> = {
    artist: ["Build a practice, share works, stay in the conversation.", "작업을 만들고, 작품을 나누고, 대화를 이어갑니다."],
    curator: ["Shape context and bring the right practices together.", "맥락을 만들고, 필요한 실천들을 연결합니다."],
    gallery: ["Represent artists, exhibitions, and the spaces between them.", "아티스트와 전시, 그 사이의 공간을 만듭니다."],
    collector: ["Follow works closely and build a personal constellation.", "작품을 가까이 따라가며 나만의 별자리를 만듭니다."],
    director: ["Move projects forward from the first idea to the next room.", "첫 아이디어에서 다음 공간까지 프로젝트를 움직입니다."],
    institution: ["Open a line between your programme and new practices.", "기관의 프로그램과 새로운 실천 사이에 선을 엽니다."],
  };
  return tx(locale, descriptions[role][0], descriptions[role][1]);
}

export default function OnboardingPage() {
  const { locale } = useLanguage();
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      router.replace("/dashboard");
      return;
    }
    if (!profileLoading && !hydrated) {
      setForm((current) => ({
        ...current,
        displayName: profile?.displayName ?? user?.displayName ?? "",
        artistName: profile?.artistName ?? "",
        accountType: profile?.accountType ?? "",
        country: profile?.country ?? "",
        basedInCity: profile?.basedInCity ?? "",
        practice: profile?.practice ?? "",
      }));
      setHydrated(true);
    }
  }, [hydrated, profile, profileLoading, router, user]);

  function updateField(field: keyof OnboardingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function moveToDetails() {
    if (!form.accountType) {
      setError(tx(locale, "Choose the way you enter the unit.", "유닛에 들어오는 방식을 선택해 주세요."));
      return;
    }
    setError(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !form.accountType) return;
    setSaving(true);
    setError(null);
    try {
      await saveUserProfile(user.uid, {
        accountType: form.accountType,
        displayName: form.displayName.trim(),
        artistName: form.artistName.trim(),
        country: form.country.trim(),
        basedInCity: form.basedInCity.trim(),
        practice: form.practice.trim(),
        onboardingCompleted: true,
        language: locale,
      });
      if (form.displayName.trim()) await updateProfile(user, { displayName: form.displayName.trim() });
      router.replace("/dashboard");
    } catch {
      setError(tx(locale, "We couldn't save your details. Please try again.", "정보를 저장하지 못했습니다. 다시 시도해 주세요."));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || profileLoading || !hydrated) {
    return <main className="onboarding-page"><div className="onboarding-loading">{tx(locale, "Opening your place…", "당신의 자리를 열고 있습니다…")}</div></main>;
  }

  const selectedRole = form.accountType ? accountTypes.find((role) => role.value === form.accountType) : null;
  const isArtist = form.accountType === "artist";

  return <main className="onboarding-page">
    <div className="onboarding-wrap">
      <div className="onboarding-topline">
        <span>{tx(locale, "WELCOME TO THE UNIT", "유닛에 오신 것을 환영합니다")}</span>
        <span>{step} / 2</span>
      </div>
      <div className="onboarding-progress" aria-hidden="true"><i className={step === 1 ? "is-active" : "is-complete"} /><i className={step === 2 ? "is-active" : ""} /></div>

      {step === 1 ? <section className="onboarding-step" aria-labelledby="onboarding-title">
        <div className="onboarding-heading">
          <h1 id="onboarding-title">{tx(locale, <>Who are<br /><em>you here?</em></>, <>당신은<br /><em>누구인가요?</em></>)}</h1>
          <p>{tx(locale, "Tell us how you enter u.a.u. This helps us shape the right first room for you.", "u.a.u에 어떤 방식으로 들어오는지 알려주세요. 당신에게 맞는 첫 공간을 준비하는 데 도움이 됩니다.")}</p>
        </div>
        <div className="onboarding-role-list" role="list" aria-label={tx(locale, "Choose your role", "역할 선택")}>
          {accountTypes.map((role) => <button key={role.value} type="button" className={form.accountType === role.value ? "onboarding-role is-selected" : "onboarding-role"} aria-pressed={form.accountType === role.value} onClick={() => updateField("accountType", role.value)}>
            <span className="onboarding-role-mark" aria-hidden="true">{form.accountType === role.value ? <Check size={15} /> : ""}</span>
            <span className="onboarding-role-copy"><strong>{tx(locale, role.en, role.ko)}</strong><small>{roleDescription(role.value, locale)}</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>)}
        </div>
        {error && <p className="onboarding-error" role="alert">{error}</p>}
        <button className="button button-blue onboarding-next" type="button" onClick={moveToDetails}>{tx(locale, "Continue", "다음")} <ArrowRight size={16} /></button>
      </section> : <section className="onboarding-step" aria-labelledby="onboarding-details-title">
        <div className="onboarding-heading onboarding-heading-details">
          <button className="onboarding-back" type="button" onClick={() => setStep(1)}><ArrowLeft size={14} /> {tx(locale, "Back", "뒤로")}</button>
          <h1 id="onboarding-details-title">{isArtist ? tx(locale, <>Make your<br /><em>practice legible.</em></>, <>당신의<br /><em>작업을 알려주세요.</em></>) : tx(locale, <>Leave a door<br /><em>open.</em></>, <>다음 연결을 위해<br /><em>문을 열어두세요.</em></>)}</h1>
          {selectedRole && <span className="onboarding-selected-role">{tx(locale, "Entering as", "선택한 역할")} · {tx(locale, selectedRole.en, selectedRole.ko)}</span>}
          <p>{isArtist ? tx(locale, "Just the essentials for now. You can shape the rest of your artist page later.", "지금은 꼭 필요한 내용만 입력하세요. 나머지는 나중에 아티스트 페이지에서 다듬을 수 있습니다.") : tx(locale, "A few details help the right people find their way to you.", "몇 가지 정보만으로도 필요한 사람들이 당신에게 찾아올 수 있습니다.")}</p>
        </div>
        <form className="onboarding-form" onSubmit={finishOnboarding}>
          <label>{isArtist ? tx(locale, "Your name", "이름") : tx(locale, "Name / organization", "이름 / 조직명")}<input value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} placeholder={isArtist ? tx(locale, "Your name", "이름") : tx(locale, "How should we call you?", "어떻게 불러드릴까요?")} required /></label>
          {isArtist && <label>{tx(locale, "Public / English name", "공개 이름 / 영문 이름")}<input value={form.artistName} onChange={(event) => updateField("artistName", event.target.value)} placeholder={tx(locale, "The name on your artist page", "아티스트 페이지에 표시할 이름")} /></label>}
          <div className="onboarding-two-up"><label>{tx(locale, "Based in", "활동 지역")}<input value={form.basedInCity} onChange={(event) => updateField("basedInCity", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} required /></label><label>{tx(locale, "Country", "국가")}<input value={form.country} onChange={(event) => updateField("country", event.target.value)} placeholder={tx(locale, "Korea", "한국")} required /></label></div>
          <label>{isArtist ? tx(locale, "Practice / medium", "작업 분야 / 매체") : tx(locale, "Field / focus", "분야 / 관심") }<input value={form.practice} onChange={(event) => updateField("practice", event.target.value)} placeholder={isArtist ? tx(locale, "Painting, sound, research…", "회화, 사운드, 리서치…") : tx(locale, "What are you working around?", "어떤 일을 하고 계신가요?")} required /></label>
          {error && <p className="onboarding-error" role="alert">{error}</p>}
          <div className="onboarding-submit-row"><button className="button button-blue" type="submit" disabled={saving}>{saving ? tx(locale, "Saving…", "저장 중…") : tx(locale, "Enter the unit", "유닛에 들어가기")} <ArrowRight size={16} /></button><span>{tx(locale, "You can edit this anytime from your profile.", "프로필에서 언제든 수정할 수 있습니다.")}</span></div>
        </form>
      </section>}
    </div>
  </main>;
}
