import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const sections: Record<string,{label:string;table:string;description:string}> = {
  people:{label:"People",table:"persons",description:"Contributors and people connected to archive encounters."},
  encounters:{label:"Encounters",table:"encounters",description:"First meetings and later encounters connected across time."},
  events:{label:"Events",table:"events",description:"Normalized festivals, performances, gatherings, and other events."},
  locations:{label:"Locations",table:"locations",description:"Venues, cities, regions, and countries represented in the archive."},
  media:{label:"Media",table:"media",description:"Private photographs, videos, audio, documents, and surviving evidence."},
};

export default async function ArchiveSectionPage({params}:{params:Promise<{section:string}>}){
  await requireAdmin(); const {section}=await params; const config=sections[section]; if(!config)notFound();
  const {count}=await createSupabaseAdmin().from(config.table).select("*",{count:"exact",head:true});
  return <main className="admin-shell"><AdminNav active={config.label}/><header className="workspace-head"><div><p className="admin-brand">Archive index</p><h1>{config.label}</h1><p>{config.description}</p></div><strong className="archive-count">{count||0}</strong></header><section className="admin-card"><div className="empty-state"><h2>{count ? `${count} records indexed` : `No ${config.label.toLowerCase()} yet`}</h2><p>The detailed {config.label.toLowerCase()} workspace is prepared but intentionally remains minimal until records are linked and normalized by the reviewer.</p></div></section></main>;
}
