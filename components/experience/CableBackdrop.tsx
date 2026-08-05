"use client";

import dynamic from "next/dynamic";
import { Component, ReactNode, useEffect, useRef, useState } from "react";

const CableScene = dynamic(() => import("./CableScene").then((module) => module.CableScene), {
  loading: () => <CableFallback />,
  ssr: false,
});

function CableFallback() {
  return <span aria-hidden="true" className="cable-backdrop__fallback" />;
}

class CableBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <CableFallback /> : this.props.children;
  }
}

function supportsEnhanced3D() {
  try {
    const canvas = document.createElement("canvas");
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowEnd =
      (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) ||
      (memory !== undefined && memory <= 2);
    return (
      !lowEnd &&
      Boolean(
        window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")),
      )
    );
  } catch {
    return false;
  }
}

export function CableBackdrop({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [capable, setCapable] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCapable(!reducedMotion.matches && supportsEnhanced3D());
    update();
    reducedMotion.addEventListener("change", update);
    return () => reducedMotion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "120px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const enhance = capable && inView && pageVisible;
  return (
    <div aria-hidden="true" className={`cable-backdrop ${className}`} ref={hostRef}>
      {enhance ? (
        <CableBoundary>
          <CableScene />
        </CableBoundary>
      ) : (
        <CableFallback />
      )}
    </div>
  );
}
