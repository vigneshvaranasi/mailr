"use client";

import "@/lib/monaco-loader";

import dynamic from "next/dynamic";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import type { EditorProps, Monaco } from "@monaco-editor/react";
import type * as MonacoEditorModule from "monaco-editor";
import { emmetHTML } from "emmet-monaco-es";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  getProjectById,
  updateProjectHtml,
} from "@/lib/projects-storage";

const SAVE_DEBOUNCE_MS = 450;

let emmetHtmlInstalled = false;

function ensureEmmetHtml(monaco: Monaco) {
  if (emmetHtmlInstalled) return;
  emmetHTML(monaco as unknown as typeof MonacoEditorModule, ["html"]);
  emmetHtmlInstalled = true;
}

function setupMonacoTheme(monaco: Monaco) {
  monaco.editor.defineTheme("mailr-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.foreground": "#d4d4d4",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#cccccc",
      "editor.selectionBackground": "#264f7888",
      "editor.inactiveSelectionBackground": "#3a3d41",
      "editorCursor.foreground": "#aeafad",
      "editorWhitespace.foreground": "#3b3a39",
      "editorIndentGuide.background": "#404040",
      "editorIndentGuide.activeBackground": "#707070",
      "editorBracketHighlight.foreground1": "#ffd700",
      "editorBracketPairGuide.activeBackground1": "#707070",
      "scrollbarSlider.background": "#79797966",
      "scrollbarSlider.hoverBackground": "#646464b3",
      "scrollbarSlider.activeBackground": "#bfbfbf66",
      "minimap.background": "#1e1e1e",
    },
  });
}

const CodeEditor = dynamic(
  async () => (await import("@monaco-editor/react")).default,
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted h-full w-full animate-pulse rounded-none" />
    ),
  },
);

type InnerEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

function MonacoHtmlPane({ value, onChange }: InnerEditorProps) {
  const handleBeforeMount = useCallback((monaco: Monaco) => {
    ensureEmmetHtml(monaco);
    setupMonacoTheme(monaco);
    monaco.languages.html.htmlDefaults.setOptions({
      format: { tabSize: 2, wrapLineLength: 120 },
    });
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

  const options: EditorProps["options"] = {
    automaticLayout: true,
    minimap: { enabled: true, scale: 1 },
    fontSize: 14,
    lineHeight: 22,
    fontLigatures: true,
    fontFamily:
      'var(--font-geist-mono), "Cascadia Code", "Segoe UI Mono", Menlo, Monaco, Consolas, monospace',
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
    suggest: {
      showKeywords: true,
      showSnippets: true,
      preview: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    snippetSuggestions: "top",
    wordBasedSuggestions: "matchingDocuments",
    formatOnPaste: false,
    formatOnType: false,
    colorDecorators: true,
    linkedEditing: true,
  };

  return (
    <CodeEditor
      height="100%"
      theme="mailr-dark"
      language="html"
      value={value}
      path="index.html"
      options={options}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(v) => onChange(v ?? "")}
    />
  );
}

function HtmlPreview({ html }: { html: string }) {
  const empty = html.trim().length === 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#1e1e1e]">
      <div className="flex shrink-0 items-center border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
        <span className="text-xs font-medium tracking-wide text-[#cccccc]">
          Preview
        </span>
      </div>
      <div className="min-h-0 flex-1 bg-neutral-200">
        {empty ? (
          <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
            HTML preview will appear here as you type.
          </div>
        ) : (
          <iframe
            className="h-full w-full border-0 bg-white"
            srcDoc={html}
            title="HTML preview"
            sandbox=""
          />
        )}
      </div>
    </div>
  );
}

type ProjectHtmlEditorProps = {
  projectId: string;
};

export function ProjectHtmlEditor({ projectId }: ProjectHtmlEditorProps) {
  const [text, setText] = useState<string | null>(null);
  const previewHtml = useDeferredValue(text ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<string>("");
  const hydratedRef = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage */
    const p = getProjectById(projectId);
    if (!p) {
      setText("");
      return;
    }
    setText(p.html);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [projectId]);

  useEffect(() => {
    hydratedRef.current = false;
  }, [projectId]);

  useEffect(() => {
    if (text !== null) {
      latestRef.current = text;
      hydratedRef.current = true;
    }
  }, [text]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (hydratedRef.current) {
        updateProjectHtml(projectId, latestRef.current);
      }
    },
    [projectId],
  );

  const scheduleSave = useCallback(
    (html: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateProjectHtml(projectId, html);
      }, SAVE_DEBOUNCE_MS);
    },
    [projectId],
  );

  if (text === null) {
    return (
      <div className="bg-muted h-full min-h-[60vh] w-full animate-pulse rounded-none md:min-h-0" />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0">
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
        <ResizablePanel defaultSize="50%" minSize="20" className="min-w-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
              <span className="text-xs font-medium tracking-wide text-[#cccccc]">
                HTML
              </span>
            </div>
            <div className="min-h-0 flex-1">
              <MonacoHtmlPane
                value={text}
                onChange={(v) => {
                  setText(v);
                  scheduleSave(v);
                }}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="bg-[#3c3c3c] after:bg-[#3c3c3c] [&>div]:rounded-none [&>div]:border-0"
        />
        <ResizablePanel defaultSize="50%" minSize="20" className="min-w-0">
          <HtmlPreview html={previewHtml} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}