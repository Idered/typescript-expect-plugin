import ts from "typescript";
import { writeFileSync } from "fs";
import tmp from "tmp";

tmp.setGracefulCleanup();

function getTemporaryFile(node: ts.FunctionDeclaration) {
  const sourceFile = node.getSourceFile();
  const tempFile = tmp.fileSync({ postfix: ".ts" });
  const filepath = tempFile.name.split(".").slice(0, -1).join(".");
  writeFileSync(tempFile.name, sourceFile.getFullText());
  const fileModule = require(filepath);

  return fileModule;
}

export default getTemporaryFile;
