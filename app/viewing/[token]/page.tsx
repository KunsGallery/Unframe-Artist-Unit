"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { ArrowUpRight } from "lucide-react";
import { db } from "../../firebase-client";
import { useLanguage } from "../../i18n-provider";
import { tx } from "../../i18n-shared";

type PreviewWork = { id: string; title: string; year?: string; medium?: string; dimensions?: string; imageUrl: string };
type Room = { artistName: string; title: string; intro?: string; works: PreviewWork[] };

export default function ViewingRoomPage() {
  const params = useParams<{ token: string }>();
  const { locale } = useLanguage();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!db || !params?.token) { setLoading(false); return; }
    return onSnapshot(doc(db, "private_viewing_rooms", params.token), (snapshot) => {
      const data = snapshot.exists() && snapshot.data().active === true ? snapshot.data() as Room : null;
      setRoom(data); setLoading(false);
    }, () => { setRoom(null); setLoading(false); });
  }, [params?.token]);
  if (loading) return <main className="private-viewing-page"><p>{tx(locale, "Opening the room…", "뷰잉룸을 여는 중…")}</p></main>;
  if (!room) return <main className="private-viewing-page"><div className="private-viewing-closed"><span>U.A.U / INVITATION</span><h1>{tx(locale, "This room is closed.", "이 뷰잉룸은 닫혔습니다.")}</h1><p>{tx(locale, "The invitation may have expired or been withdrawn by the artist.", "초대가 만료되었거나 아티스트가 룸을 닫았습니다.")}</p><Link className="text-link" href="/artists">{tx(locale, "Explore U.A.U artists", "U.A.U 아티스트 둘러보기")} <ArrowUpRight size={14}/></Link></div></main>;
  return <main className="private-viewing-page"><header><Link href="/" aria-label="u.a.u home"><img src="/assets/uau-logo-lockup.png" alt="u.a.u"/></Link><span>{tx(locale, "PRIVATE VIEWING ROOM", "프라이빗 뷰잉룸")}</span></header><section className="private-viewing-heading"><span>{room.artistName} · U.A.U</span><h1>{room.title}</h1>{room.intro && <p>{room.intro}</p>}<small>{tx(locale, "A preview shared by invitation", "초대를 통해 먼저 공유된 작품입니다")}</small></section><section className="private-viewing-grid">{room.works.map((work, index) => <article key={work.id}><div><img src={work.imageUrl} alt={work.title} loading={index > 1 ? "lazy" : "eager"}/></div><span>{[work.year, work.medium, work.dimensions].filter(Boolean).join(" · ")}</span><h2>{work.title}</h2></article>)}</section><footer>u.a.u / UNFRAME ARTIST UNIT <span>{tx(locale, "Shared privately by the artist", "아티스트가 초대로 공유한 페이지")}</span></footer></main>;
}
