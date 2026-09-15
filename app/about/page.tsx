import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FlowArt, FlowSection } from "./story-scroll";

export default function AboutPage() {
  return (
    <main className="story-page">
      <FlowArt aria-label="u.a.u introduction">
        <FlowSection className="story-tone-blue" aria-label="For artists">
          <div className="story-card-topline">
            <span>01 / FOR ARTISTS</span>
            <span>MAKE YOUR WAY IN</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">A page for the practice behind the work</p>
            <h1>
              Make
              <br />
              <em>your page.</em>
            </h1>
            <p className="story-card-copy">
              Shape how your practice is seen. Bring the work, references, and
              directions that make you yours — then let the page keep moving
              with you.
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>u.a.u / UNFRAME ARTIST UNIT</span>
            <Link href="/artists">
              Explore artist pages <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-ink" aria-label="For curators and directors">
          <div className="story-card-topline">
            <span>02 / FOR CURATORS &amp; DIRECTORS</span>
            <span>FOLLOW THE THREAD</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">A place to begin with a real encounter</p>
            <h2>
              Find
              <br />
              <em>the practice.</em>
            </h2>
            <p className="story-card-copy">
              Start from a work, a question, or an instinct. Follow the thread
              into the next studio visit, proposal, conversation, or
              collaboration.
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>02 / 04</span>
            <Link href="/connections">
              See the connections <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-clay" aria-label="For galleries and institutions">
          <div className="story-card-topline">
            <span>03 / FOR GALLERIES &amp; INSTITUTIONS</span>
            <span>KEEP IT MOVING</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">A longer life for the projects you start</p>
            <h2>
              Keep
              <br />
              <em>it moving.</em>
            </h2>
            <p className="story-card-copy">
              Give exhibitions, projects, and collaborations room to travel.
              Keep the context attached, even after the room has emptied.
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>03 / 04</span>
            <Link href="/projects">
              View projects <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>

        <FlowSection className="story-tone-paper" aria-label="For collectors">
          <div className="story-card-topline">
            <span>04 / FOR COLLECTORS</span>
            <span>STAY CLOSE</span>
          </div>
          <div className="story-card-main">
            <p className="story-kicker">A way back into the work</p>
            <h2>
              Stay
              <br />
              <em>close.</em>
            </h2>
            <p className="story-card-copy">
              Spend time with the work, understand its place in a practice, and
              keep a way back into what happens after the first encounter.
            </p>
          </div>
          <div className="story-card-bottomline">
            <span>04 / 04</span>
            <Link href="/works">
              Browse the works <ArrowUpRight size={16} />
            </Link>
          </div>
        </FlowSection>
      </FlowArt>
    </main>
  );
}
