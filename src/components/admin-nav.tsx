import Link from "next/link";

const items = [
  ["Dashboard", "/admin"], ["Submissions", "/admin/submissions"], ["People", "/admin/people"],
  ["Encounters", "/admin/encounters"], ["Events", "/admin/events"], ["Locations", "/admin/locations"],
  ["Media", "/admin/media"], ["Book Desk", "/admin/book-desk"], ["Follow-ups", "/admin/follow-ups"],
  ["Archive Search", "/admin/search"],
] as const;

export function AdminNav({ active }: { active: string }) {
  return <nav className="archive-nav" aria-label="Control Room"><div className="archive-wordmark"><span>MOFUNDO</span><strong>Memory Archive</strong></div><div className="archive-nav-links">{items.map(([label, href]) => <Link className={active === label ? "active" : ""} href={href} key={href}>{label}</Link>)}</div></nav>;
}
