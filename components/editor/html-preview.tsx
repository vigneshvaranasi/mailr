"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  PanelRightClose,
  Smartphone,
  Sun,
  Tablet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  usePreviewAppearance,
  useSetPreviewAppearance,
} from "@/lib/preview-appearance";
import { buildPreviewSrcDoc } from "@/lib/preview-srcdoc";
import { cn } from "@/lib/utils";

type PreviewViewport = "desktop" | "tablet" | "mobile";

export function HtmlPreview({
  html,
  onHidePreview,
}: {
  html: string;
  onHidePreview?: () => void;
}) {
  const empty = html.trim().length === 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  const previewAppearance = usePreviewAppearance();
  const setPreviewAppearance = useSetPreviewAppearance();

  const previewSrcDoc = useMemo(
    () =>
      empty
        ? ""
        : buildPreviewSrcDoc(html, {
            appearance: previewAppearance,
            scrollLock: false,
          }),
    [empty, html, previewAppearance],
  );

  const previewChromeBg =
    previewAppearance === "dark" ? "bg-[#202124]" : "bg-white";

  useEffect(() => {
    const sync = () => {
      const el = rootRef.current;
      setFullscreen(Boolean(el && document.fullscreenElement === el));
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el || empty) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // ignore
    }
  }, [empty]);

  const previewToolbarBtn =
    "border-0 bg-transparent text-[#d0d0d0] shadow-none hover:bg-[#3c3c3c] hover:text-white";

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0 w-full flex-col bg-[#1e1e1e]"
    >
      <div className="pointer-events-none absolute top-2 right-2 z-10 sm:top-2.5 sm:right-2.5">
        <div
          className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-[#3c3c3c]/90 bg-[#252526]/95 p-0.5 shadow-md backdrop-blur-sm"
          role="toolbar"
          aria-label="Preview controls"
        >
          <Button
            type="button"
            variant={viewport === "desktop" ? "secondary" : "ghost"}
            size="icon-xs"
            className={cn(
              previewToolbarBtn,
              viewport === "desktop" &&
                "bg-[#3c3c3c] text-white hover:bg-[#3c3c3c]",
            )}
            aria-pressed={viewport === "desktop"}
            title="Desktop width"
            disabled={empty}
            onClick={() => setViewport("desktop")}
          >
            <Monitor className="size-3.5" />
            <span className="sr-only">Desktop width</span>
          </Button>
          <Button
            type="button"
            variant={viewport === "tablet" ? "secondary" : "ghost"}
            size="icon-xs"
            className={cn(
              previewToolbarBtn,
              viewport === "tablet" &&
                "bg-[#3c3c3c] text-white hover:bg-[#3c3c3c]",
            )}
            aria-pressed={viewport === "tablet"}
            title="Tablet width (768px)"
            disabled={empty}
            onClick={() => setViewport("tablet")}
          >
            <Tablet className="size-3.5" />
            <span className="sr-only">Tablet width</span>
          </Button>
          <Button
            type="button"
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            size="icon-xs"
            className={cn(
              previewToolbarBtn,
              viewport === "mobile" &&
                "bg-[#3c3c3c] text-white hover:bg-[#3c3c3c]",
            )}
            aria-pressed={viewport === "mobile"}
            title="Mobile width (390px)"
            disabled={empty}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone className="size-3.5" />
            <span className="sr-only">Mobile width</span>
          </Button>
          <Button
            type="button"
            variant={previewAppearance === "dark" ? "secondary" : "ghost"}
            size="icon-xs"
            className={cn(
              previewToolbarBtn,
              previewAppearance === "dark" &&
                "bg-[#3c3c3c] text-white hover:bg-[#3c3c3c]",
            )}
            aria-pressed={previewAppearance === "dark"}
            title={
              previewAppearance === "dark"
                ? "Preview as light"
                : "Preview as dark"
            }
            disabled={empty}
            onClick={() => {
              setPreviewAppearance(
                previewAppearance === "dark" ? "light" : "dark",
              );
            }}
          >
            {previewAppearance === "dark" ? (
              <Moon className="size-3.5" />
            ) : (
              <Sun className="size-3.5" />
            )}
            <span className="sr-only">
              {previewAppearance === "dark"
                ? "Dark preview on"
                : "Light preview on"}
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={previewToolbarBtn}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen preview"}
            disabled={empty}
            onClick={() => void toggleFullscreen()}
          >
            {fullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
            <span className="sr-only">
              {fullscreen ? "Exit fullscreen" : "Fullscreen preview"}
            </span>
          </Button>
          {onHidePreview ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={previewToolbarBtn}
              title="Hide preview"
              onClick={onHidePreview}
            >
              <PanelRightClose className="size-3.5" />
              <span className="sr-only">Hide preview</span>
            </Button>
          ) : null}
        </div>
      </div>
      <div
        className={cn(
          "min-h-0 flex-1",
          previewAppearance === "dark" ? "bg-neutral-950" : "bg-neutral-200",
        )}
      >
        {empty ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
            HTML preview will appear here as you type.
          </div>
        ) : (
          <div
            className={cn(
              "flex h-full min-h-0 w-full",
              viewport === "desktop"
                ? "flex-col"
                : "justify-center overflow-auto p-3 sm:p-4",
            )}
          >
            <div
              className={cn(
                "flex min-h-0 flex-col",
                previewChromeBg,
                viewport === "desktop" &&
                  "h-full w-full min-h-0 flex-1 shadow-none",
                viewport === "tablet" &&
                  "h-full w-full max-w-[768px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/10",
                viewport === "mobile" &&
                  "h-full w-full max-w-[390px] rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] ring-1 ring-black/10",
              )}
            >
              <iframe
                className={cn(
                  "min-h-0 w-full flex-1 border-0",
                  previewChromeBg,
                )}
                srcDoc={previewSrcDoc}
                title="HTML preview"
                sandbox=""
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}