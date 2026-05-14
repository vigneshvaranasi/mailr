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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
} from "lucide-react";
import { usePanelRef } from "react-resizable-panels";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  getProjectById,
  updateProjectHtml,
} from "@/lib/projects-storage";

import { HtmlPreview } from "./html-preview";

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

type ProjectHtmlEditorProps = {
  projectId: string;
};

export function ProjectHtmlEditor({ projectId }: ProjectHtmlEditorProps) {
  const [text, setText] = useState<string | null>(null);
  const previewHtml = useDeferredValue(text ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<string>("");
  const hydratedRef = useRef(false);
  const codePanelRef = usePanelRef();
  const previewPanelRef = usePanelRef();
  const [codeCollapsed, setCodeCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  const collapseCodePane = useCallback(() => {
    if (previewPanelRef.current?.isCollapsed()) {
      previewPanelRef.current.expand();
    }
    codePanelRef.current?.collapse();
  }, []);

  const collapsePreviewPane = useCallback(() => {
    if (codePanelRef.current?.isCollapsed()) {
      codePanelRef.current.expand();
    }
    previewPanelRef.current?.collapse();
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
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
    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0">
      {codeCollapsed ? (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute top-1/2 left-1 z-20 -translate-y-1/2 shadow-md"
          title="Show editor"
          onClick={() => codePanelRef.current?.expand()}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Show editor</span>
        </Button>
      ) : null}
      {previewCollapsed ? (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute top-1/2 right-1 z-20 -translate-y-1/2 shadow-md"
          title="Show preview"
          onClick={() => previewPanelRef.current?.expand()}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Show preview</span>
        </Button>
      ) : null}
      <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
        <ResizablePanel
          id="editor-code"
          panelRef={codePanelRef}
          collapsible
          collapsedSize={0}
          defaultSize="50%"
          minSize={14}
          className="flex min-h-0 min-w-0 flex-col"
          onResize={(size) => setCodeCollapsed(size.asPercentage < 0.75)}
        >
          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute top-2 left-2 z-10">
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="pointer-events-auto size-8 border-0 bg-[#252526]/95 text-[#d0d0d0] shadow-md backdrop-blur-sm hover:bg-[#3c3c3c] hover:text-white"
                title="Hide editor"
                onClick={collapseCodePane}
              >
                <PanelLeftClose className="size-4" />
                <span className="sr-only">Hide editor</span>
              </Button>
            </div>
            <MonacoHtmlPane
              value={text}
              onChange={(v) => {
                setText(v);
                scheduleSave(v);
              }}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          disabled={codeCollapsed || previewCollapsed}
          className="bg-[#3c3c3c] after:bg-[#3c3c3c] [&>div]:rounded-none [&>div]:border-0"
        />
        <ResizablePanel
          id="editor-preview"
          panelRef={previewPanelRef}
          collapsible
          collapsedSize={0}
          defaultSize="50%"
          minSize={14}
          className="flex min-h-0 min-w-0 flex-col"
          onResize={(size) => setPreviewCollapsed(size.asPercentage < 0.75)}
        >
          <HtmlPreview html={previewHtml} onHidePreview={collapsePreviewPane} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}