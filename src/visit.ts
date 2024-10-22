import ts from "typescript";
import expect from "expect";
import parseComment from "./parse-comment";
import getTemporaryFile from "./get-temporary-file";
import { getJSDocExpectTags } from "./get-expect-tag";
import { MessageBag } from "./message-bag";

export default (node: ts.Node, messageBag: MessageBag) => {
  let defaultExport: ts.Identifier;
  let namedExports: ts.Identifier[] = [];

  try {
    // Get default export
    node.forEachChild((node) => {
      if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
        defaultExport = node.expression;
      }
    });

    // Get named exports
    node.forEachChild((node) => {
      if (ts.isExportDeclaration(node)) {
        node.exportClause.forEachChild((item) => {
          if (ts.isExportSpecifier(item)) {
            namedExports = [...namedExports, item.name];
          }
        });
      }
    });

    node.forEachChild((node) => {
      const isTopLevel = ts.isSourceFile(node.parent);

      if (ts.isFunctionDeclaration(node) && isTopLevel) {
        if (hasExportModifier(node) || hasNamedExport(namedExports, node)) {
          executeTest(node, messageBag);
        }
        if (isDefaultExport(defaultExport, node)) {
          executeTest(node, messageBag, {
            defaultExport: true,
          });
        }
      }
    });
  } catch (err) {}
};

function hasNamedExport(
  namedExports: ts.Identifier[],
  node: ts.FunctionDeclaration
) {
  return namedExports.find(
    (item) => item.escapedText === node.name.escapedText
  );
}

function isDefaultExport(
  defaultExport: ts.Identifier,
  node: ts.FunctionDeclaration
) {
  return defaultExport && node.name.escapedText === defaultExport.escapedText;
}

function hasExportModifier(node: ts.FunctionDeclaration) {
  return node.modifiers?.some(
    (item) => item.kind === ts.SyntaxKind.ExportKeyword
  );
}

function executeTest(
  node: ts.FunctionDeclaration,
  messageBag: MessageBag,
  options: {
    defaultExport?: boolean;
  } = {}
) {
  const expectTags = getJSDocExpectTags(node);
  try {
    var fileModule = getTemporaryFile(node);
  } catch (err) {
    if (err.diagnosticText) {
      const [, pos, end] = err.diagnosticText.match(/\((\d+),(\d+)\)/);
      messageBag.add({
        pos,
        end,
        content: err.diagnosticText,
      });
    }
  }

  if (!fileModule) {
    return;
  }

  for (const tag of expectTags) {
    try {
      const comment = parseComment(tag.comment);
      if (!comment) continue;
      const { matcher, params, result } = comment;
      const functionName = options.defaultExport ? "default" : node.name.text;
      const call = matcher
        .split(".")
        .reduce(
          (prev, current) => prev[current],
          expect(fileModule[functionName](...params))
        );
      if (typeof call === "function") {
        call(...result);
      }
    } catch (err) {
      messageBag.add({
        pos: tag.pos,
        end: tag.end,
        content: err.message.replace(/\n\s*\n/g, "\n"),
      });
    }
  }
}
