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
        <FlowSection className="story-tone-blue" aria-label={tx(locale, "For artists", "아티스트를 위한 공간")}>
          <div className="story-card-topline">
            <span>{tx(locale, "01 / FOR ARTISTS", "01 / 아티스트를 위한 공간")}</span>
            <span>{tx(locale, "MAKE YOUR WAY IN", "당신의 방식으로 들어오기")}</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">{tx(locale, "A page for the practice behind the work", "작품 뒤의 실천을 위한 페이지")}</p>
            <h1>
              {tx(locale, "Make", "만들고")}
              <br />
              <em>{tx(locale, "your page.", "당신의 페이지를.")}</em>
            </h1>
            <p className="story-card-copy">
              {tx(locale, "Shape how your practice is seen. Bring the work, references, and directions that make you yours — then let the page keep moving with you.", "당신의 실천이 어떻게 보일지 직접 만드세요. 작업과 레퍼런스, 당신을 당신답게 만드는 방향을 가져오면 페이지도 함께 계속 움직입니다.")}
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>u.a.u / UNFRAME ARTIST UNIT</span>
            <Link data-cursor="next" href="/artists">
              {tx(locale, "Explore artist pages", "아티스트 페이지 둘러보기")} <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-ink" aria-label={tx(locale, "For curators and directors", "큐레이터와 디렉터를 위한 공간")}>
          <div className="story-card-topline">
            <span>{tx(locale, "02 / FOR CURATORS & DIRECTORS", "02 / 큐레이터와 디렉터를 위한 공간")}</span>
            <span>{tx(locale, "FOLLOW THE THREAD", "연결의 실마리 따라가기")}</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">{tx(locale, "A place to begin with a real encounter", "실제 만남에서 시작하는 자리")}</p>
            <h2>
              {tx(locale, "Find", "찾고")}
              <br />
              <em>{tx(locale, "the practice.", "실천을.")}</em>
            </h2>
            <p className="story-card-copy">
              {tx(locale, "Start from a work, a question, or an instinct. Follow the thread into the next studio visit, proposal, conversation, or collaboration.", "작품과 질문, 혹은 직감에서 시작하세요. 다음 스튜디오 방문과 제안, 대화, 협업으로 이어지는 실마리를 따라가세요.")}
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>02 / 04</span>
            <Link data-cursor="next" href="/connections">
              {tx(locale, "See the connections", "연결 보기")} <ArrowUpRight size={16} />
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
            <Link data-cursor="next" href="/projects">
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
              <Link data-cursor="next" href="/works">
                {tx(locale, "Browse the works", "작품 둘러보기")} <ArrowUpRight size={16} />
              </Link>
              <Link className="story-home-button" data-cursor="next" href="/">
                {tx(locale, "Back to the main page", "메인 페이지로 돌아가기")} <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </FlowSection>
      </FlowArt>
    </main>
  );
}
