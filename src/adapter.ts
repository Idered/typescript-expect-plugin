import ts, { ScriptElementKind } from "typescript";
import bts from "byots";
import { register } from "ts-node";
import visit from "./visit";
import { MessageBag } from "./message-bag";
import {
  EXPECT_KEYWORDS,
  TS_LANGSERVICE_EXPECT_DIAGNOSTIC_ERROR_CODE,
} from "./consts";

register({
  compilerOptions: {
    target: "ESNext",
  },
});

export type ESLintAdapterOptions = {
  logger: (msg: string) => void;
  getSourceFile: (fileName: string) => ts.SourceFile | undefined;
  getProgram?: () => ts.Program;
};

export class Adapter {
  private readonly logger: (msg: string) => void;
  private readonly getSourceFile: (
    fileName: string
  ) => ts.SourceFile | undefined;
  private messageBag: MessageBag;

  public constructor({ logger, getSourceFile }: ESLintAdapterOptions) {
    this.logger = logger;
    this.getSourceFile = getSourceFile;
    this.messageBag = new MessageBag();
  }

  public getSemanticDiagnostics(
    delegate: ts.LanguageService["getSemanticDiagnostics"],
    fileName: string
  ): ReturnType<ts.LanguageService["getSemanticDiagnostics"]> {
    const original = delegate(fileName);

    try {
      this.messageBag.clear();
      const sourceFile = this.getSourceFile(fileName);
      if (!sourceFile) return original;
      visit(sourceFile, this.messageBag);

      const diagnostics = this.transformErrorsToDiagnostics(sourceFile);
      return [...original, ...diagnostics];
    } catch (error) {
      this.logger(error.message ? error.message : "unknown error");
      return original;
    }
  }

  public getCompletionsAtPosition(
    delegate: ts.LanguageService["getCompletionsAtPosition"],
    fileName: string,
    position: number,
    options: ts.GetCompletionsAtPositionOptions
  ): ReturnType<ts.LanguageService["getCompletionsAtPosition"]> {
    let original = delegate(fileName, position, options);
    const source = (this.getSourceFile(fileName) as unknown) as bts.SourceFile;
    const token = bts.getTokenAtPosition(source, position);

    if (bts.isJSDocTag(token) && original) {
      original.entries = [
        ...original.entries,
        {
          kind: ScriptElementKind.keyword,
          kindModifiers: "",
          name: "expect",
          sortText: "0",
        },
      ];
    }

    if (bts.isInComment(source, position) && bts.isJSDoc(token)) {
      if (!original) {
        original = {
          entries: [],
          isGlobalCompletion: false,
          isMemberCompletion: false,
          isNewIdentifierLocation: false,
        };
      }

      const tag = token.tags?.find(
        (item) =>
          item.end + item.comment?.length + 1 >= position &&
          item.pos <= position
      );
      const isExpectTag =
        tag && tag.comment && tag.tagName.escapedText === "expect";

      if (isExpectTag) {
        const hasNotKeyword = tag.comment?.includes("not");
        const fnKeyword =
          EXPECT_KEYWORDS.find((keyword) => tag.comment?.includes(keyword)) ||
          "";

        const keywordPosition =
          tag.end + tag.comment.indexOf(fnKeyword) + fnKeyword.length;

        original.entries = [
          ...original.entries,
          ...[
            ...(hasNotKeyword || fnKeyword ? [] : ["not"]),
            ...(fnKeyword && keywordPosition !== position
              ? []
              : EXPECT_KEYWORDS),
          ].map((name) => ({
            kind: ScriptElementKind.functionElement,
            name,
            kindModifiers: "",
            sortText: "0",
          })),
        ];
      }
    }

    return original;
  }

  public getQuickInfoAtPosition(
    delegate: ts.LanguageService["getQuickInfoAtPosition"],
    fileName: string,
    position: number
  ): ReturnType<ts.LanguageService["getQuickInfoAtPosition"]> {
    const original = delegate(fileName, position);
    // Remove expect tags when user hover function name
    if (original) {
      original.tags = original.tags?.filter((item) => item.name !== "expect");
    }
    return original;
  }

  public getCompletionEntryDetails(
    delegate: ts.LanguageService["getCompletionEntryDetails"],
    fileName: string,
    position: number,
    entryName: string,
    formatOptions: ts.FormatCodeOptions | ts.FormatCodeSettings,
    source: string,
    preferences: ts.UserPreferences
  ): ReturnType<ts.LanguageService["getCompletionEntryDetails"]> {
    const original = delegate(
      fileName,
      position,
      entryName,
      formatOptions,
      source,
      preferences
    );
    // Remove expect tags for autocomplete popup
    if (original) {
      original.tags = original.tags?.filter((item) => item.name !== "expect");
    }
    return original;
  }

  public getSignatureHelpItems(
    delegate: ts.LanguageService["getSignatureHelpItems"],
    fileName: string,
    position: number,
    options: ts.SignatureHelpItemsOptions
  ): ReturnType<ts.LanguageService["getSignatureHelpItems"]> {
    const original = delegate(fileName, position, options);
    // Remove expect tags for autocomplete popup
    if (original) {
      original.items = original.items.map((item) => ({
        ...item,
        // Remove expect tags from signature tooltip
        tags: item.tags?.filter((item) => item.name !== "expect"),
      }));
    }
    return original;
  }

  private transformErrorsToDiagnostics(
    sourceFile: ts.SourceFile
  ): ts.Diagnostic[] {
    return this.messageBag.messages.map((item) => ({
      category: ts.DiagnosticCategory.Error,
      file: sourceFile,
      messageText: item.content,
      start: item.pos,
      length: item.end - item.pos - 1,
      code: TS_LANGSERVICE_EXPECT_DIAGNOSTIC_ERROR_CODE,
    }));
  }
}
