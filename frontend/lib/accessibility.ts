"use client";

import { useEffect, useState } from "react";

const KEY = "digby_large_text";

export function useLargeText() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY) === "1";
    setEnabled(stored);
    if (stored) document.documentElement.classList.add("large-text");
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      localStorage.setItem(KEY, "1");
      document.documentElement.classList.add("large-text");
    } else {
      localStorage.removeItem(KEY);
      document.documentElement.classList.remove("large-text");
    }
  }

  return { enabled, toggle };
}
