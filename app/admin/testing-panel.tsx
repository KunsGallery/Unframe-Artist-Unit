"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { ArrowUpRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth-provider";
import { db } from "../firebase-client";
import { useLanguage } from "../i18n-provider";
import { tx } from "../i18n-shared";
import { useUserProfile, type UauUserProfile } from "../profile";

type AdminTestRecord = { id: string; [key: string]: unknown };
type TestAction = "reset" | "collector" | "curator" | "approve";

const sampleCollectorPreferences = {
  media: ["Painting", "Digital"],
  materials: ["Acrylic", "Mixed media"],
  themes: ["Body", "Landscape"],
  regions: ["Korea", "Japan"],
};

function useAdminTestingData(uid?: string | null) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [records, setRecords] = useState<Record<string, AdminTestRecord[]>>({});

  useEffect(() => {
    if (!uid || !db) {
      setAllowed(false);
      return;
    }

    const firestore = db;
    const accessUnsubscribe = onSnapshot(doc(firestore, "admins", uid), (snapshot) => {
      const data = snapshot.data();
      setAllowed(snapshot.exists() && data?.active === true);
    }, () => setAllowed(false));

    const names = ["users", "curatorial_briefs", "curatorial_proposals"];
    const collectionUnsubscribes = names.map((name) => onSnapshot(collection(firestore, name), (snapshot) => {
      setRecords((current) => ({
        ...current,
        [name]: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      }));
    }, () => undefined));

    return () => {
      accessUnsubscribe();
      collectionUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [uid]);

  return { allowed, records };
}

export default function AdminTestingPanel() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { profile } = useUserProfile(user?.uid);
  const { allowed, records } = useAdminTestingData(user?.uid);
  const [busy, setBusy] = useState<TestAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingRoleRequests = useMemo(
    () => (records.users ?? []).filter((item) => item.accessStatus === "pending"),
    [records.users],
  );
  const briefs = records.curatorial_briefs ?? [];
  const proposals = records.curatorial_proposals ?? [];
  const recordItems = useMemo<Array<AdminTestRecord & { recordType: "brief" | "proposal" }>>(
    () => [
      ...briefs.map((item) => ({ ...item, recordType: "brief" as const })),
      ...proposals.map((item) => ({ ...item, recordType: "proposal" as const })),
    ].slice(0, 12),
    [briefs, proposals],
  );

  async function applyTestState(action: TestAction) {
    if (!db || !user) return;
    setBusy(action);
    setMessage(null);
    setError(null);

    const common = {
      onboardingCompleted: action !== "reset",
      updatedAt: serverTimestamp(),
    };
    const states: Record<Exclude<TestAction, "reset" | "approve">, Partial<UauUserProfile>> = {
      collector: {
        accountType: "collector",
        accessStatus: "open",
        intentWords: ["Find", "Keep", "Follow"],
        collectorPreferences: sampleCollectorPreferences,
        recommendationDigest: "realtime",
        recommendationOptIn: true,
      },
      curator: {
        accountType: "curator",
        accessStatus: "pending",
        intentWords: ["Frame", "Connect", "Commission"],
        recommendationDigest: "weekly",
        recommendationOptIn: true,
      },
    };

    try {
      if (action === "reset") {
        await updateDoc(doc(db, "users", user.uid), {
          accountType: null,
          accessStatus: "open",
          intentWords: [],
          collectorPreferences: {
            media: [],
            materials: [],
            themes: [],
            regions: [],
          },
          recommendationDigest: "realtime",
          recommendationOptIn: true,
          onboardingCompleted: false,
          updatedAt: serverTimestamp(),
        });
        setMessage(tx(locale, "Your test profile is ready for a fresh onboarding run.", "테스트 프로필을 초기화했습니다. 온보딩을 다시 시작할 수 있습니다."));
        router.push("/onboarding");
      } else if (action === "approve") {
        await updateDoc(doc(db, "users", user.uid), {
          accessStatus: "approved",
          onboardingCompleted: true,
          updatedAt: serverTimestamp(),
        });
        setMessage(tx(locale, "The current test role is approved.", "현재 테스트 역할을 승인 상태로 바꿨습니다."));
        router.push("/dashboard/brief");
      } else {
        await updateDoc(doc(db, "users", user.uid), { ...common, ...states[action] });
        setMessage(tx(locale, "A test scenario is ready.", "테스트 시나리오를 준비했습니다."));
        router.push(action === "collector" ? "/dashboard/recommendations" : "/dashboard/brief");
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : tx(locale, "The test state could not be saved.", "테스트 상태를 저장하지 못했습니다."));
    } finally {
      setBusy(null);
    }
  }

  async function markReviewed(collectionName: "curatorial_briefs" | "curatorial_proposals", id: string) {
    if (!db) return;
    setError(null);
    try {
      await updateDoc(doc(db, collectionName, id), { status: "reviewed", reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setMessage(tx(locale, "The record is marked as reviewed.", "해당 기록을 검토 완료로 표시했습니다."));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : tx(locale, "The record could not be updated.", "기록을 업데이트하지 못했습니다."));
    }
  }

  if (allowed !== true) return null;

  return (
    <section className="admin-testing-panel" aria-labelledby="admin-testing-title">
      <div className="admin-testing-wrap">
        <div className="admin-testing-heading">
          <div>
            <p className="meta-line">{tx(locale, "ADMIN / TEST LAB", "관리자 / 테스트 랩")}</p>
            <h2 id="admin-testing-title">{tx(locale, <>Keep testing<br /><em>the next room.</em></>, <>다음 공간을<br /><em>계속 시험하세요.</em></>)}</h2>
          </div>
          <p>{tx(locale, "These controls only change the signed-in administrator's profile. Use them to replay onboarding and inspect the systems added to u.a.u without creating another Firebase user.", "이 컨트롤은 현재 로그인한 관리자 계정의 프로필만 바꿉니다. 새 Firebase 사용자를 만들지 않고 온보딩과 새 시스템을 반복해서 확인할 수 있습니다.")}</p>
        </div>

        {(message || error) && <div className={`admin-testing-message${error ? " is-error" : ""}`} role="status">{error || message}</div>}

        <div className="admin-testing-grid">
          <section className="admin-testing-section">
            <div className="admin-testing-section-head">
              <div>
                <p className="meta-line">{tx(locale, "REPLAY ONBOARDING", "온보딩 반복 테스트")}</p>
                <h3>{tx(locale, "Try every entry point.", "모든 진입점을 시험하세요.")}</h3>
              </div>
              <RotateCcw size={19} aria-hidden="true" />
            </div>
            <p className="admin-testing-copy">{tx(locale, "Reset the current account, or seed a role state to jump directly into its next experience.", "현재 계정을 초기화하거나 역할별 상태를 넣고 다음 경험으로 바로 이동합니다.")}</p>
            <div className="admin-testing-actions">
              <button className="button button-blue" type="button" disabled={busy !== null} onClick={() => void applyTestState("reset")}>
                <RotateCcw size={14} /> {busy === "reset" ? tx(locale, "Resetting…", "초기화 중…") : tx(locale, "Reset and open onboarding", "초기화하고 온보딩 열기")}
              </button>
              <button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void applyTestState("collector")}>
                <Sparkles size={14} /> {busy === "collector" ? tx(locale, "Preparing…", "준비 중…") : tx(locale, "Preview collector", "컬렉터 미리보기")}
              </button>
              <button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void applyTestState("curator")}>
                <Sparkles size={14} /> {busy === "curator" ? tx(locale, "Preparing…", "준비 중…") : tx(locale, "Preview curator review", "큐레이터 심사 미리보기")}
              </button>
              <button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void applyTestState("approve")}>
                <Check size={14} /> {busy === "approve" ? tx(locale, "Approving…", "승인 중…") : tx(locale, "Approve current test role", "현재 테스트 역할 승인")}
              </button>
            </div>
            <div className="admin-testing-profile">
              <span>{tx(locale, "CURRENT TEST PROFILE", "현재 테스트 프로필")}</span>
              <strong>{profile?.accountType || tx(locale, "Not selected", "아직 선택되지 않음")}</strong>
              <small>{profile?.accessStatus || "open"} · {profile?.onboardingCompleted ? tx(locale, "onboarding complete", "온보딩 완료") : tx(locale, "onboarding incomplete", "온보딩 미완료")}</small>
            </div>
          </section>

          <section className="admin-testing-section">
            <div className="admin-testing-section-head">
              <div>
                <p className="meta-line">{tx(locale, "LIVE SYSTEM", "실시간 시스템")}</p>
                <h3>{tx(locale, "What needs attention.", "확인이 필요한 흐름.")}</h3>
              </div>
              <ArrowUpRight size={19} aria-hidden="true" />
            </div>
            <div className="admin-testing-metrics">
              <a href="/admin/access"><strong>{pendingRoleRequests.length}</strong><span>{tx(locale, "pending role requests", "대기 중인 역할 신청")}</span><ArrowUpRight size={13} /></a>
              <a href="/dashboard/brief"><strong>{briefs.length}</strong><span>{tx(locale, "curatorial briefs", "기획 브리프")}</span><ArrowUpRight size={13} /></a>
              <a href="/dashboard/brief"><strong>{proposals.length}</strong><span>{tx(locale, "artist proposals", "아티스트 제안")}</span><ArrowUpRight size={13} /></a>
            </div>
            <p className="admin-testing-copy">{tx(locale, "Counts update through Firestore listeners. Open role review to approve curator, gallery, director, and institution access.", "수치는 Firestore 리스너를 통해 실시간으로 바뀝니다. 역할 검토에서 큐레이터, 갤러리, 디렉터, 기관 계정을 승인할 수 있습니다.")}</p>
          </section>
        </div>

        <div className="admin-testing-records">
          <div className="admin-testing-records-heading">
            <div>
              <p className="meta-line">{tx(locale, "CURATORIAL PIPELINE", "기획 파이프라인")}</p>
              <h3>{tx(locale, "New threads, kept visible.", "새로운 실마리를 놓치지 않기.")}</h3>
            </div>
            <span>{tx(locale, "Realtime", "실시간")}</span>
          </div>
          {briefs.length === 0 && proposals.length === 0 ? (
            <p className="admin-empty">{tx(locale, "No briefs or proposals yet. Use the role test above to begin.", "아직 브리프나 제안서가 없습니다. 위의 역할 테스트로 시작해보세요.")}</p>
          ) : (
            <div className="admin-testing-record-list">
              {recordItems.map((item) => {
                const recordType = String(item.recordType);
                const title = String(item.title ?? item.message ?? (recordType === "brief" ? "Untitled brief" : "Untitled proposal"));
                return <div className="admin-testing-record" key={`${recordType}-${item.id}`}><div><span>{recordType}</span><strong>{title}</strong><small>{String(item.ownerUid ?? item.senderUid ?? "—")} · {String(item.status ?? "open")}</small></div>{item.status !== "reviewed" && <button type="button" onClick={() => void markReviewed(recordType === "brief" ? "curatorial_briefs" : "curatorial_proposals", item.id)} aria-label={tx(locale, "Mark as reviewed", "검토 완료로 표시")}><Check size={14} /></button>}</div>;
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
