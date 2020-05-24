import ts from "typescript/lib/tsserverlibrary";

export type LanguageServiceMethodWrapper<K extends keyof ts.LanguageService> = (
  delegate: ts.LanguageService[K],
  info?: ts.server.PluginCreateInfo
) => ts.LanguageService[K];

export class LanguageServiceProxyBuilder {
  private readonly wrappers: any[] = [];
  private readonly info: ts.server.PluginCreateInfo;

  public constructor(info: ts.server.PluginCreateInfo) {
    this.info = info;
  }

  public wrap<
    K extends keyof ts.LanguageService,
    Q extends LanguageServiceMethodWrapper<K>
  >(name: K, wrapper: Q) {
    this.wrappers.push({ name, wrapper });
    return this;
  }

  public build(): ts.LanguageService {
    const ret = this.info.languageService;

    this.wrappers.forEach(({ name, wrapper }) => {
      (ret as any)[name] = wrapper(
        this.info.languageService[name as keyof ts.LanguageService],
        this.info
      );
    });
    return ret;
  }
}
