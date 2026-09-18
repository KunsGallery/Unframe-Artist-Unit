import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FlowArt, FlowSection } from "./story-scroll";
import { tx } from "../i18n-shared";
import { getServerLocale } from "../server-locale";

export default function AboutPage() {
  const locale = getServerLocale();
  return (
    <main className="story-page">
      <FlowArt aria-label={tx(locale, "u.a.u introduction", "u.a.u 소개")}>
        <FlowSection className="story-tone-blue" aria-label={tx(locale, "A connection that lasts longer than one person", "한 사람보다 오래 남는 연결")}>
          <div className="story-card-topline">
            <span>{tx(locale, "01 / THE CONNECTION", "01 / 연결의 시작")}</span>
            <span>{tx(locale, "LONGER THAN ONE PERSON", "한 사람보다 오래")}</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">{tx(locale, "A network held by a moving brand", "움직이는 브랜드가 쌓아가는 네트워크")}</p>
            <h1>
              {tx(locale, "Stay", "남고")}
              <br />
              <em>{tx(locale, "connected.", "연결됩니다.")}</em>
            </h1>
            <p className="story-card-copy">
              {tx(locale, "This is not a relationship built around one person. It grows inside UNFRAME — through exhibitions, artists, audiences, conversations, and the records that remain.", "개인이 중심이 되는 관계가 아닙니다. 전시와 작가, 관객과 대화, 그리고 남겨진 기록을 통해 UNFRAME 안에서 계속 자라나는 관계입니다.")}
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>{tx(locale, "UNFRAME → U.A.U", "UNFRAME → U.A.U")}</span>
              <Link href="/artists">
              {tx(locale, "Meet the artists", "아티스트 만나기")} <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-ink" aria-label={tx(locale, "Starting from a place already in motion", "이미 움직이고 있는 곳에서 시작합니다")}>
          <div className="story-card-topline">
            <span>{tx(locale, "02 / ALREADY IN MOTION", "02 / 이미 움직이고 있는 곳")}</span>
            <span>{tx(locale, "FOLLOW WHAT COMES AFTER", "그 이후를 따라가기")}</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">{tx(locale, "UNFRAME came first", "UNFRAME이 먼저 있었습니다")}</p>
            <h2>
              {tx(locale, "Begin", "시작하고")}
              <br />
              <em>{tx(locale, "where it moves.", "움직이는 곳에서.")}</em>
            </h2>
            <p className="story-card-copy">
              {tx(locale, "Before u.a.u, UNFRAME was already opening exhibitions, meeting artists, welcoming audiences, and making the next project. u.a.u extends that motion into the relationships that come after.", "u.a.u가 생기기 전부터 UNFRAME은 전시를 열고, 작가를 만나고, 관객을 맞이하고, 다음 프로젝트를 만들고 있었습니다. u.a.u는 그 움직임을 이후의 관계로 확장합니다.")}
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>{tx(locale, "EXHIBITION → ENCOUNTER → CONNECTION", "전시 → 만남 → 연결")}</span>
              <Link href="/connections">
              {tx(locale, "Follow the thread", "실마리 따라가기")} <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-clay" aria-label={tx(locale, "For galleries and institutions", "갤러리와 기관을 위한 공간")}>
          <div className="story-card-topline">
            <span>{tx(locale, "03 / FOR GALLERIES & INSTITUTIONS", "03 / 갤러리와 기관을 위한 공간")}</span>
            <span>{tx(locale, "KEEP IT MOVING", "계속 움직이기")}</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">{tx(locale, "A longer life for the projects you start", "당신이 시작한 프로젝트의 더 긴 생명")}</p>
            <h2>
              {tx(locale, "Keep", "계속")}
              <br />
              <em>{tx(locale, "it moving.", "움직이게.")}</em>
            </h2>
            <p className="story-card-copy">
              {tx(locale, "Give exhibitions, projects, and collaborations room to travel. Keep the context attached, even after the room has emptied.", "전시와 프로젝트, 협업이 이동할 수 있는 공간을 만드세요. 방이 비워진 뒤에도 맥락이 이어지도록 하세요.")}
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>03 / 04</span>
              <Link href="/projects">
              {tx(locale, "View projects", "프로젝트 보기")} <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-paper" aria-label={tx(locale, "For collectors", "컬렉터를 위한 공간")}>
          <div className="story-card-topline">
            <span>{tx(locale, "04 / FOR COLLECTORS", "04 / 컬렉터를 위한 공간")}</span>
            <span>{tx(locale, "STAY CLOSE", "가까이 머물기")}</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">{tx(locale, "A way back into the work", "작품으로 돌아가는 방법")}</p>
            <h2>
              {tx(locale, "Stay", "머물고")}
              <br />
              <em>{tx(locale, "close.", "가까이.")}</em>
            </h2>
            <p className="story-card-copy">
              {tx(locale, "Spend time with the work, understand its place in a practice, and keep a way back into what happens after the first encounter.", "작품과 시간을 보내고, 실천 안에서 작품의 자리를 이해하세요. 첫 만남 이후에 일어나는 일로 돌아갈 길도 남겨두세요.")}
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>04 / 04</span>
            <div className="story-footer-actions">
              <Link href="/works">
                {tx(locale, "Browse the works", "작품 둘러보기")} <ArrowUpRight size={16} />
              </Link>
              <Link className="story-home-button" href="/">
                {tx(locale, "Back to the main page", "메인 페이지로 돌아가기")} <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </FlowSection>
      </FlowArt>
    </main>
  );
}
