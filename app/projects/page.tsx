import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Breadcrumb, DemoNotice, MetaLine, PageIntro, PageSection, SectionHeading } from "../components";
import { projects } from "../data";
import { projectText, tx } from "../i18n-shared";
import { getServerLocale } from "../server-locale";

export default function ProjectsPage() {
  const locale = getServerLocale();
  return <main><DemoNotice /><div className="page-wrap inner-page"><Breadcrumb current={tx(locale, "Projects", "프로젝트")} /><PageIntro /><PageSection sectionId="list"><div className="project-list">{projects.length === 0 ? <div className="empty-state"><h3>{tx(locale, "No public projects yet.", "아직 공개된 프로젝트가 없습니다.")}</h3><p>{tx(locale, "Published projects will appear here when they are ready.", "공개된 프로젝트가 준비되면 이곳에 나타납니다.")}</p></div> : projects.map((project, index) => { const copy = projectText(locale, project.slug)!; return <Link className="project-row" href={`/projects/${project.slug}`} key={project.slug}><span className="project-number">0{index + 1}</span><div className="project-mark"><span>{project.artists[0].slice(0, 2)}</span><span>{project.artists[1].slice(0, 2)}</span>{project.artists[2] && <span>{project.artists[2].slice(0, 2)}</span>}</div><div className="project-main"><MetaLine>{copy.meta}</MetaLine><h2>{project.title}</h2><p>{copy.description}</p><div className="project-participants">{project.artists.map(name => <span key={name}>{name}</span>)}</div></div><div className="project-status">{copy.status}<ArrowUpRight size={18} /></div></Link>})}</div></PageSection><PageSection sectionId="manifesto"><section className="project-manifesto"><SectionHeading title={tx(locale, "Why we meet", "우리가 만나는 이유")} /><div><p>{tx(locale, "Some projects begin with a clear proposal. Others begin with a person staying in the room a little longer.", "어떤 프로젝트는 분명한 제안에서 시작합니다. 어떤 프로젝트는 한 사람이 방에 조금 더 오래 머무는 데서 시작합니다.")}</p><Link href="/connections" className="text-link">{tx(locale, "See the relationship archive", "관계 아카이브 보기")} <ArrowUpRight size={14} /></Link></div></section></PageSection></div></main>;
}
