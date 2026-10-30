import { V3MemoryForm } from "./submit/v3-memory-form";

export default function HomePage() {
  return <main className="shell form-wrap"><div className="form-head"><div className="progress">MOFUNDO Memory Archive</div><h1>Tell me how we met</h1><p className="lede">Take your time. You don't have to remember everything—small details, uncertain dates, and fragments all belong here.</p></div><V3MemoryForm /></main>;
}
