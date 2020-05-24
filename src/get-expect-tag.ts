import ts from "typescript";

export function isJSDocExpectTag(tag: ts.JSDocTag): tag is ts.JSDocTag {
  return tag.tagName.escapedText === "expect";
}

export function getJSDocExpectTags(node: ts.Node): readonly ts.JSDocTag[] {
  return ts.getAllJSDocTags(node, isJSDocExpectTag);
}
