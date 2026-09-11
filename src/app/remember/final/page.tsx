import { Suspense } from "react";
import FinalMemoryContent from "./content";

export default function FinalMemoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" />}>
      <FinalMemoryContent />
    </Suspense>
  );
}
