import BuilderUI from "@/components/BuilderUI";
import { Suspense } from "react";

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="loader-container"><div className="spinner"></div></div>}>
      <BuilderUI />
    </Suspense>
  );
}
