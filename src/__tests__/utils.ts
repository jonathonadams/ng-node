import { promisify } from 'util';
// @ts-ignore
import rimraf from 'rimraf';
import { access, constants } from 'fs';

const rimrafP = promisify(rimraf);

export async function removeExampleOutDir() {
  const outDir = 'example/out';
  return rimrafP(outDir);
}

export function hasTxtFileBeenCopied(): Promise<boolean> {
  return new Promise((rs, re) => {
    access('example/out/apps/api/text.txt', constants.F_OK, (err) => {
      err ? rs(false) : rs(true);
    });
  });
}
