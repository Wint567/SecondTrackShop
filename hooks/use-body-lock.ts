"use client";

import { useEffect } from "react";

let activeLocks = 0;
let previousOverflow = "";
let previousPaddingRight = "";

export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    if (activeLocks === 0) {
      previousOverflow = document.body.style.overflow;
      previousPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        const currentPadding = Number.parseFloat(
          window.getComputedStyle(document.body).paddingRight,
        );
        document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      }
    }

    activeLocks += 1;
    document.body.style.overflow = "hidden";

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks === 0) {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      }
    };
  }, [locked]);
}
