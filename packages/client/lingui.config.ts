import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from "@lingui/cli";
import { LinguiConfig } from "@lingui/conf";

import { Languages } from "./components/i18n/Languages";

/* eslint-disable */
const supressWarningIfWereNotInLinguiExtract = !(
  process as any
)?.argv[1]?.includes("lingui-extract.js");
const require = createRequire(import.meta.url);
/* eslint-enable */

const isModuleNotFound = (error: unknown) =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'MODULE_NOT_FOUND',
  );

function loadExtractor() {
  try {
    return require('@lingui-solid/babel-plugin-extract-messages/extractor');
  } catch (error) {
    if (!isModuleNotFound(error)) throw error;

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
      '../js-lingui-solid/packages/babel-plugin-extract-messages/dist/extractor.js',
      '../js-lingui-solid/packages/babel-plugin-extract-messages/src/extractor.ts',
    ];

    for (const candidate of candidates) {
      try {
        return require(path.resolve(__dirname, candidate));
      } catch (candidateError) {
        if (!isModuleNotFound(candidateError)) throw candidateError;
      }
    }

    throw error;
  }
}

const extractorModule = loadExtractor() as {
  default?: unknown;
  extractor?: unknown;
};

const linguiExtractor =
  (extractorModule.extractor as unknown) ??
  extractorModule.default ??
  extractorModule;

export default defineConfig({
  sourceLocale: "en",
  locales: Object.values(Languages).map(({ i18n }) => i18n),
  catalogs: [
    {
      path: "<rootDir>/components/i18n/catalogs/{locale}/messages",
      include: ["src", "components"],
      exclude: ["**/node_modules/**", "**/i18n/locales/**"],
      extractor: linguiExtractor,
    },
  ],
  runtimeConfigModule: {
    Trans: ["@lingui-solid/solid", "Trans"],
    useLingui: ["@lingui-solid/solid", "useLingui"],
    extractors: [extractor],
  },
  ...(supressWarningIfWereNotInLinguiExtract
    ? {}
    : {
        macro: {
          corePackage: ["@lingui-solid/solid"],
          jsxPackage: ["@lingui-solid/solid/macro"],
        },
      }),
} as LinguiConfig);
