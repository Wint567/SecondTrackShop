import { LoadingState } from "@/components/ui/AsyncStates";

export default function Loading() {
  return (
    <main className="cutpaste-sheet route-loading" id="main-content">
      <p className="eyebrow">Loading the archive</p>
      <LoadingState count={8} />
    </main>
  );
}
