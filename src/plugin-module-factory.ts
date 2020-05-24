import typescript from "typescript/lib/tsserverlibrary";
import { LanguageServiceProxyBuilder } from "./language-service-proxy-builder";
import { Adapter } from "./adapter";

// TODO: Use provided typescript
const create = (ts: typeof typescript) => (
  info: ts.server.PluginCreateInfo
): ts.LanguageService => {
  const { languageService, project } = info;
  const logger = (msg: string) =>
    project.projectService.logger.info(`[typescript-jest-service] ${msg}`);
  const getProgram = () => {
    const program = languageService.getProgram();
    if (!program) throw new Error();
    return program;
  };
  const adapter = new Adapter({
    logger,
    getSourceFile(fileName: string) {
      return getProgram().getSourceFile(fileName);
    },
  });
  const proxy = new LanguageServiceProxyBuilder(info)
    .wrap("getSemanticDiagnostics", (delegate) =>
      adapter.getSemanticDiagnostics.bind(adapter, delegate)
    )
    .wrap("getQuickInfoAtPosition", (delegate) =>
      adapter.getQuickInfoAtPosition.bind(adapter, delegate)
    )
    .wrap("getCompletionEntryDetails", (delegate) =>
      adapter.getCompletionEntryDetails.bind(adapter, delegate)
    )
    .wrap("getSignatureHelpItems", (delegate) =>
      adapter.getSignatureHelpItems.bind(adapter, delegate)
    )
    .wrap("getCompletionsAtPosition", (delegate) =>
      adapter.getCompletionsAtPosition.bind(adapter, delegate)
    )
    .build();
  return proxy;
};

type FactoryProps = {
  typescript: typeof typescript;
};

export const pluginModuleFactory: typescript.server.PluginModuleFactory = ({
  typescript,
}: FactoryProps) => ({
  create: create(typescript),
});
