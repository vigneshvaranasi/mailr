import { loader } from "@monaco-editor/react";

const MONACO_VERSION = "0.55.1";

loader.config({
  paths: {
    vs: `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`,
  },
});