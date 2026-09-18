"use client";

import { ArrowLeft, ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { accountTypes, createArtistApplication, saveUserProfile, useUserProfile, type UauAccountType } from "../profile";
import { useAuth } from "../auth-provider";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";

type OnboardingStep = 1 | 2 | 3 | 4;

type OnboardingForm = {
  accountType: UauAccountType | "";
  displayName: string;
  artistName: string;
  country: string;
  basedInCity: string;
  practice: string;
  bio: string;
};

const initialForm: OnboardingForm = {
  accountType: "",
  displayName: "",
  artistName: "",
  country: "",
  basedInCity: "",
  practice: "",
  bio: "",
};

function getInvitationNumber(uid: string) {
  let value = 0;
  for (const character of uid.slice(0, 8)) value = (value * 31 + character.charCodeAt(0)) % 100;
  return value + 1;
}

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
  const [step, setStep] = useState<OnboardingStep>(1);
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invitationNumber = user ? getInvitationNumber(user.uid) : 1;
  const invitationLabel = String(invitationNumber).padStart(3, "0");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (profile?.onboardingCompleted && !showWelcome) {
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
        bio: profile?.bio ?? "",
      }));
      setHydrated(true);
    }
  }, [hydrated, profile, profileLoading, router, showWelcome, user]);

  function updateField(field: keyof OnboardingForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function moveToRole() {
    setError(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function moveToDetails() {
    if (!form.accountType) {
      setError(tx(locale, "Choose the way you enter the unit.", "유닛에 들어오는 방식을 선택해 주세요."));
      return;
    }
    setError(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finishOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !form.accountType) return;
    setSaving(true);
    setError(null);
    try {
      const provisionalArtistId = form.accountType === "artist" ? `U.A.U. ${invitationLabel}` : undefined;
      await saveUserProfile(user.uid, {
        accountType: form.accountType,
        displayName: form.displayName.trim(),
        artistName: form.artistName.trim(),
        country: form.country.trim(),
        basedInCity: form.basedInCity.trim(),
        practice: form.practice.trim(),
        bio: form.bio.trim(),
        invitationNumber,
        invitationAcceptedAt: Timestamp.now(),
        ...(provisionalArtistId ? { uauArtistId: provisionalArtistId, verificationStatus: "pending" as const } : {}),
        onboardingCompleted: true,
        language: locale,
      });
      if (form.accountType === "artist") {
        await createArtistApplication(user.uid, {
          name: form.displayName.trim(),
          artistName: form.artistName.trim(),
          country: form.country.trim(),
          basedInCity: form.basedInCity.trim(),
          practice: form.practice.trim(),
          bio: form.bio.trim(),
          invitationNumber,
        });
      }
      if (form.displayName.trim()) await updateProfile(user, { displayName: form.displayName.trim() });
      setShowWelcome(true);
      setStep(4);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : tx(locale, "We couldn't save your details. Please try again.", "정보를 저장하지 못했습니다. 다시 시도해 주세요."));
    } finally {
      setSaving(false);
    }
  }

  const selectedRole = useMemo(() => form.accountType ? accountTypes.find((role) => role.value === form.accountType) : null, [form.accountType]);
  const isArtist = form.accountType === "artist";

  if (loading || !user || profileLoading || !hydrated) {
    return <main className="onboarding-page"><div className="onboarding-loading">{tx(locale, "Opening your place…", "당신의 자리를 열고 있습니다…")}</div></main>;
  }

  return <main className="onboarding-page">
    <div className="onboarding-wrap">
      <div className="onboarding-topline"><span>{tx(locale, "THE INVITATION / U.A.U", "초대장 / U.A.U")}</span><span>{step === 4 ? "OPEN" : `${step} / 3`}</span></div>
      {step !== 4 && <div className="onboarding-progress" aria-label={tx(locale, "Onboarding progress", "온보딩 진행률")}><i className={step >= 1 ? "is-active" : ""} /><i className={step >= 2 ? "is-active" : ""} /><i className={step >= 3 ? "is-active" : ""} /></div>}

      {step === 1 && <section className="invitation-step" aria-labelledby="invitation-title">
        <div className="invitation-film" aria-hidden="true"><span>gesture / material / room</span><i /><b>u.a.u</b><small>UNFRAME ARTIST UNIT</small></div>
        <div className="invitation-copy"><span className="invitation-kicker">{tx(locale, `INVITATION Nº ${invitationLabel}`, `초대장 Nº ${invitationLabel}`)}</span><h1 id="invitation-title">{tx(locale, <>You are<br /><em>invited in.</em></>, <>당신을<br /><em>초대합니다.</em></>)}</h1><p>{tx(locale, "U.A.U begins with a real practice, a room that has moved, and the relationship that stays after. This is your first door.", "U.A.U는 실제 작업과 움직이는 공간, 그리고 그 이후에도 남는 관계에서 시작됩니다. 이것은 당신을 위한 첫 번째 문입니다.")}</p><button className="button button-blue" type="button" onClick={moveToRole}>{tx(locale, "Accept the invitation", "초대장 받기")} <ArrowRight size={16} /></button><small>{tx(locale, "You can leave the unit at any time.", "언제든 유닛을 나갈 수 있습니다.")}</small></div>
      </section>}

      {step === 2 && <section className="onboarding-step" aria-labelledby="onboarding-title">
        <div className="onboarding-heading"><button className="onboarding-back" type="button" onClick={() => setStep(1)}><ArrowLeft size={14} /> {tx(locale, "Back", "뒤로")}</button><h1 id="onboarding-title">{tx(locale, <>Who are<br /><em>you here?</em></>, <>당신은<br /><em>누구인가요?</em></>)}</h1><p>{tx(locale, "Tell us how you enter u.a.u. This shapes the first room we prepare for you.", "u.a.u에 어떤 방식으로 들어오는지 알려주세요. 당신을 위한 첫 공간을 준비하는 데 도움이 됩니다.")}</p></div>
        <div className="onboarding-role-list" role="list" aria-label={tx(locale, "Choose your role", "역할 선택")}>{accountTypes.map((role) => <button key={role.value} type="button" className={form.accountType === role.value ? "onboarding-role is-selected" : "onboarding-role"} aria-pressed={form.accountType === role.value} onClick={() => updateField("accountType", role.value)}><span className="onboarding-role-mark" aria-hidden="true">{form.accountType === role.value ? <Check size={15} /> : ""}</span><span className="onboarding-role-copy"><strong>{tx(locale, role.en, role.ko)}</strong><small>{roleDescription(role.value, locale)}</small></span><ArrowRight size={16} aria-hidden="true" /></button>)}</div>
        {error && <p className="onboarding-error" role="alert">{error}</p>}<button className="button button-blue onboarding-next" type="button" onClick={moveToDetails}>{tx(locale, "Continue", "다음")} <ArrowRight size={16} /></button>
      </section>}

      {step === 3 && <section className="onboarding-step" aria-labelledby="onboarding-details-title">
        <div className="onboarding-heading onboarding-heading-details"><button className="onboarding-back" type="button" onClick={() => setStep(2)}><ArrowLeft size={14} /> {tx(locale, "Back", "뒤로")}</button><h1 id="onboarding-details-title">{isArtist ? tx(locale, <>Make your<br /><em>practice legible.</em></>, <>당신의<br /><em>작업을 알려주세요.</em></>) : tx(locale, <>Leave a door<br /><em>open.</em></>, <>다음 연결을 위해<br /><em>문을 열어두세요.</em></>)}</h1>{selectedRole && <span className="onboarding-selected-role">{tx(locale, "Entering as", "선택한 역할")} · {tx(locale, selectedRole.en, selectedRole.ko)}</span>}<p>{isArtist ? tx(locale, "Just the essentials for now. Your identity can keep changing with your practice.", "지금은 꼭 필요한 내용만 입력하세요. 당신의 정체성은 작업과 함께 계속 바뀔 수 있습니다.") : tx(locale, "A few details help the right people find their way to you.", "몇 가지 정보만으로도 필요한 사람들이 당신에게 찾아올 수 있습니다.")}</p></div>
        <form className="onboarding-form" onSubmit={finishOnboarding}><label>{isArtist ? tx(locale, "Your name", "이름") : tx(locale, "Name / organization", "이름 / 조직명")}<input value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} placeholder={isArtist ? tx(locale, "Your name", "이름") : tx(locale, "How should we call you?", "어떻게 불러드릴까요?")} required /></label>{isArtist && <label>{tx(locale, "Public / English name", "공개 이름 / 영문 이름")}<input value={form.artistName} onChange={(event) => updateField("artistName", event.target.value)} placeholder={tx(locale, "The name on your artist page", "아티스트 페이지에 표시할 이름")} /></label>}<div className="onboarding-two-up"><label>{tx(locale, "Based in", "활동 지역")}<input value={form.basedInCity} onChange={(event) => updateField("basedInCity", event.target.value)} placeholder={tx(locale, "Seoul", "서울")} required /></label><label>{tx(locale, "Country", "국가")}<input value={form.country} onChange={(event) => updateField("country", event.target.value)} placeholder={tx(locale, "Korea", "한국")} required /></label></div><label>{isArtist ? tx(locale, "Practice / medium", "작업 분야 / 매체") : tx(locale, "Field / focus", "분야 / 관심")}<input value={form.practice} onChange={(event) => updateField("practice", event.target.value)} placeholder={isArtist ? tx(locale, "Painting, sound, research…", "회화, 사운드, 리서치…") : tx(locale, "What are you working around?", "어떤 일을 하고 계신가요?")} required /></label><label>{tx(locale, "One sentence to keep open", "열어두고 싶은 한 문장")}<textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder={tx(locale, "What are you keeping open?", "무엇을 열어두고 있나요?")} rows={3} /></label>{error && <p className="onboarding-error" role="alert">{error}</p>}<div className="onboarding-submit-row"><button className="button button-blue" type="submit" disabled={saving}>{saving ? tx(locale, "Creating your identity…", "정체성을 만드는 중…") : tx(locale, "Create my identity", "나의 정체성 만들기")} <Sparkles size={15} /></button><span>{tx(locale, "Your information can be edited from your profile.", "정보는 프로필에서 언제든 수정할 수 있습니다.")}</span></div></form>
      </section>}

      {step === 4 && <section className="identity-accepted" aria-labelledby="identity-accepted-title"><div className="identity-seal"><Check size={22} /></div><span className="invitation-kicker">{tx(locale, "INVITATION ACCEPTED", "초대장 수락 완료")}</span><h1 id="identity-accepted-title">{tx(locale, <>Welcome to<br /><em>the unit.</em></>, <>유닛에<br /><em>오신 것을 환영합니다.</em></>)}</h1><p>{tx(locale, "Your first identity is open. It will become more precise as you make, meet, and continue.", "당신의 첫 정체성이 열렸습니다. 만들고, 만나고, 이어가면서 더 선명해질 것입니다.")}</p><div className="identity-card"><span>{isArtist ? tx(locale, "ARTIST ID / PENDING REVIEW", "아티스트 ID / 검토 대기") : tx(locale, "UNIT IDENTITY", "유닛 아이덴티티")}</span><strong>{isArtist ? `U.A.U. ${invitationLabel}` : form.displayName}</strong><small>{form.practice || tx(locale, "New connection", "새로운 연결")}{form.basedInCity ? ` · ${form.basedInCity}` : ""}</small>{isArtist && <em><LockKeyhole size={13} /> {tx(locale, "Verified after UNFRAME review", "UNFRAME 검토 후 인증")}</em>}</div><button className="button button-blue" type="button" onClick={() => router.replace("/dashboard")}>{tx(locale, "Enter my dashboard", "대시보드 들어가기")} <ArrowRight size={16} /></button></section>}
    </div>
  </main>;
}
