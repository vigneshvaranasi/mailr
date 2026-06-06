"use client";

import "@/lib/monaco-loader";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EditorProps, Monaco } from "@monaco-editor/react";
import type * as MonacoEditorModule from "monaco-editor";

import { cn } from "@/lib/utils";

function useRootDarkClass(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

const JSON_EDITOR_FONT =
  'var(--font-geist-mono), "Cascadia Code", "Segoe UI Mono", Menlo, Monaco, Consolas, monospace';

const MonacoEditor = dynamic(
  async () => (await import("@monaco-editor/react")).default,
  {
    ssr: false,
    loading: () => (
      <div
        className="border-input bg-muted/40 text-muted-foreground flex min-h-[260px] items-center justify-center rounded-md border text-sm"
        aria-hidden
      >
        Loading editor…
      </div>
    ),
  },
);

function setupJsonLanguage(monaco: Monaco) {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [],
    enableSchemaRequest: false,
  });
}

export type JsonCodeEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  heightClassName?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

export function JsonCodeEditor({
  id,
  value,
  onChange,
  disabled,
  className,
  heightClassName = "h-[min(42vh,420px)] min-h-[260px]",
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
}: JsonCodeEditorProps) {
  const dark = useRootDarkClass();
  const theme = dark ? "vs-dark" : "vs";

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    setupJsonLanguage(monaco);
  }, []);

  const handleMount = useCallback(
    (ed: MonacoEditorModule.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      ed.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        () => {
          void ed.getAction("editor.action.formatDocument")?.run();
        },
      );
    },
    [],
  );

  const options: EditorProps["options"] = useMemo(
    () => ({
      automaticLayout: true,
      readOnly: Boolean(disabled),
      minimap: { enabled: true, scale: 1 },
      fontSize: 14,
      lineHeight: 22,
      fontLigatures: true,
      fontFamily: JSON_EDITOR_FONT,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: "on",
      wrappingIndent: "indent",
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: "smooth",
      renderWhitespace: "selection",
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      padding: { top: 12, bottom: 12 },
      formatOnPaste: true,
      formatOnType: false,
      folding: false,
      glyphMargin: false,
      lineDecorationsWidth: "1.25ch",
      lineNumbersMinChars: 3,
      lineNumbers: "on",
      occurrencesHighlight: "singleFile",
      renderLineHighlight: "line",
      unicodeHighlight: {
        ambiguousCharacters: false,
        invisibleCharacters: false,
      },
    }),
    [disabled],
  );

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : ariaLabel ?? "JSON editor"}
      className={cn(
        "border-input overflow-hidden rounded-md border shadow-xs focus-within:ring-[3px] focus-within:ring-ring/50",
        className,
      )}
    >
      <div className={cn("w-full", heightClassName)}>
        <MonacoEditor
          height="100%"
          theme={theme}
          language="json"
          path="merge-rows.json"
          value={value}
          options={options}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(v) => onChange(v ?? "")}
        />
      </div>
    </div>
  );
}