import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DemoNotice, MetaLine } from "../components";
import { ConnectionMarquee, FlowCards, RotatingWord } from "../motion-components";

export default function AboutPage() {
  return <main>
    <DemoNotice />
    <div className="page-wrap inner-page about-page">
      <div className="breadcrumb"><Link href="/">u.a.u</Link><span>/</span><span>About</span></div>
      <section className="about-hero"><div><MetaLine>ONE UNIT / MANY WAYS IN</MetaLine><h1>Make room for<br /><RotatingWord words={["your practice.", "a new project.", "a longer conversation.", "the unexpected."]} /></h1><p>u.a.u is a place to be seen in context, to meet the right people, and to keep something moving after the first encounter.</p></div><div className="about-hero-note"><span>02</span><p>Artists, curators, galleries, directors, and collectors can enter from different doors — and still find one another inside.</p></div></section>

      <ConnectionMarquee items={["Artists", "Curators", "Galleries", "Directors", "Collectors", "Institutions", "Independent practices", "Unfinished ideas"]} />

      <section className="flow-intro"><div><MetaLine>WHAT CAN HAPPEN HERE</MetaLine><h2>Not one service.<br /><em>A shared field.</em></h2></div><p>Bring a practice, a project, a question, or a reason to keep a door open. The unit changes shape around the relationship.</p></section>
      <FlowCards cards={[
        { eyebrow: "FOR ARTISTS", title: "Make a page that feels like you.", body: "Build a public presence around the work, references, and relationships that make your practice yours — not another generic portfolio.", action: "See artist profiles", href: "/artists", tone: "flow-card-blue" },
        { eyebrow: "FOR CURATORS & DIRECTORS", title: "Find the practice behind the name.", body: "Follow a thread from exhibition to studio to the next idea, and make a thoughtful proposal when the timing is right.", action: "Trace a connection", href: "/connections", tone: "flow-card-paper" },
        { eyebrow: "FOR GALLERIES & INSTITUTIONS", title: "Keep the conversation moving.", body: "Document what began in a room and give collaborative projects a longer life — with context that stays attached.", action: "Explore projects", href: "/projects", tone: "flow-card-clay" },
        { eyebrow: "FOR COLLECTORS", title: "Collect with a way back in.", body: "Spend time with the work, understand its place in a practice, and stay close to what happens after the acquisition.", action: "Browse the works", href: "/works", tone: "flow-card-ink" },
      ]} />

      <section className="about-cta"><MetaLine>THE DOOR IS OPEN</MetaLine><h2>Bring us what<br /><em>you are making.</em></h2><Link className="button button-blue" href="/join">Find your way in <ArrowUpRight size={16} /></Link></section>
    </div>
  </main>;
}
