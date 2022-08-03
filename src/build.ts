import esbuild from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs/promises';
import { dirname, join } from 'path';
import sass from 'sass';
import { varObjects } from './html/htmlElements.js';
import { serialize } from './utility.js';
import { default as json5 } from 'json5';

export async function build({
  scriptEntry,
  outputDir,
  app,
  styleEntry,
  translationEntry,
}: {
  scriptEntry?: string;
  styleEntry?: string;
  translationEntry?: string;
  outputDir: string;
  app: () => JSX.Element;
}) {
  try {
    let html = renderToStaticMarkup(app());
    const path = join(outputDir, 'system');
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(
      new URL('./script/_generated.js', import.meta.url),
      `
    // This file is auto-generated as part of the build
    import { deserialize } from "../utility.js";
    export const cascades = deserialize(\`${serialize(varObjects.cascades)}\`);
    export const repeatingSectionDetails = deserialize(\`${serialize(
      varObjects.repeatingSectionDetails
    )}\`);
    export const attributeSets = deserialize(\`${serialize(
      Object.fromEntries(varObjects.varData)
    )}\`)
    `
    );
    await fs.writeFile(
      new URL('./script/_generated.d.ts', import.meta.url),
      `
      // This file is auto-generated as part of the build
      import { Trigger } from '../utility.js';
      export declare const cascades: {
          [name: string]: Trigger;
      };
      export declare const repeatingSectionDetails: {
          section: string;
          fields: string[];
      }[];
      export declare const attributeSets: Record<${Array.from(
        varObjects.varData.keys()
      )
        .map((k) => `'${k}'`)
        .join('|')}, Set<string>>;
    `
    );
    // await fs.writeFile(
    //   new URL('./script/_generated.js', import.meta.url),
    //   `
    // // This file is auto-generated as part of the build
    // import { deserialize } from "./utility";
    // export const cascades: { [name: string]: Trigger } = deserialize(\`${serialize(
    //   varObjects.cascades
    // )}\`);
    // export const repeatingSectionDetails: { section: string; fields: string[] }[] = deserialize(\`${serialize(
    //   varObjects.repeatingSectionDetails
    // )}\`);
    // export const attributeSets: Record<${
    //   Array.from(varObjects.varData.keys())
    //     .map((val) => `'${val}'`)
    //     .join('|') || 'string'
    // },Set<string>> = deserialize(\`${serialize(
    //     Object.fromEntries(varObjects.varData)
    //   )}\`)
    // `
    // );
    if (scriptEntry) {
      const { outputFiles } = await esbuild.build({
        entryPoints: [scriptEntry],
        bundle: true,
        format: 'esm',
        write: false,
      });
      const worker = outputFiles[0].text.trim();
      html += `\n<script type="text/worker">\n${worker}\n</script>`;
    }
    await fs.writeFile(`${path}.html`, html);
    if (styleEntry) {
      const styles = sass.compile(styleEntry);
      await fs.writeFile(`${path}.css`, styles.css);
    }
    if (translationEntry) {
      const json = await fs.readFile(translationEntry);
      await fs.writeFile(
        join(outputDir, 'translation.json'),
        JSON.stringify(json5.parse(json.toString()), undefined, 2)
      );
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
