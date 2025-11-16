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

const resolveExtractor = () => {
  try {
    return require('@lingui-solid/babel-plugin-extract-messages/extractor');
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND'
    ) {
      throw error;
    }
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(
      __dirname,
      '../js-lingui-solid/packages/babel-plugin-extract-messages/dist/extractor.js',
    ),
    path.resolve(
      __dirname,
      '../js-lingui-solid/packages/babel-plugin-extract-messages/src/extractor.ts',
    ),
  ];

  for (const candidate of candidates) {
    try {
      require.resolve(candidate);
      return require(candidate);
    } catch (candidateError) {
      if (
        !(candidateError instanceof Error) ||
        (candidateError as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND'
      ) {
        throw candidateError;
      }
    }
  }

  console.warn(
    '[lingui] extractor not found; skipping message extraction (ensure js-lingui-solid is checked out for full tooling).',
  );
  return undefined;
};

const linguiExtractor = resolveExtractor();

export default defineConfig({
  sourceLocale: "en",
  locales: Object.values(Languages).map(({ i18n }) => i18n),
  catalogs: [
    {
      path: "<rootDir>/components/i18n/catalogs/{locale}/messages",
      include: ["src", "components"],
      exclude: ["**/node_modules/**", "**/i18n/locales/**"],
      ...(linguiExtractor ? { extractor: linguiExtractor } : {}),
    },
  ],
  runtimeConfigModule: {
    Trans: ["@lingui-solid/solid", "Trans"],
    useLingui: ["@lingui-solid/solid", "useLingui"],
    ...(linguiExtractor ? { extractors: [linguiExtractor] } : {}),
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
