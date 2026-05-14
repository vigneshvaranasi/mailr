"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PreviewAppearance = "light" | "dark";

type PreviewAppearanceContextValue = {
  appearance: PreviewAppearance;
  setAppearance: (v: PreviewAppearance) => void;
};

const PreviewAppearanceContext =
  createContext<PreviewAppearanceContextValue | null>(null);

export function PreviewAppearanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [appearance, setAppearance] = useState<PreviewAppearance>("light");
  const value = useMemo(
    () => ({ appearance, setAppearance }),
    [appearance],
  );
  return (
    <PreviewAppearanceContext.Provider value={value}>
      {children}
    </PreviewAppearanceContext.Provider>
  );
}

export function usePreviewAppearance(): PreviewAppearance {
  const ctx = useContext(PreviewAppearanceContext);
  if (!ctx) {
    throw new Error(
      "usePreviewAppearance must be used within PreviewAppearanceProvider",
    );
  }
  return ctx.appearance;
}

export function useSetPreviewAppearance(): (
  v: PreviewAppearance,
) => void {
  const ctx = useContext(PreviewAppearanceContext);
  if (!ctx) {
    throw new Error(
      "useSetPreviewAppearance must be used within PreviewAppearanceProvider",
    );
  }
  return ctx.setAppearance;
}