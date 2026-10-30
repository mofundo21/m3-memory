import { MemoryForm } from "./submit/memory-form";

export default function HomePage() {
  return <main className="shell form-wrap"><div className="form-head"><div className="progress">M3 Memory Archive</div><h1>Tell me how we met</h1><p className="lede">Share whatever you remember. Your submission stays private until it is reviewed.</p></div><MemoryForm /></main>;
}
