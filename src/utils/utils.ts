import { normalize } from 'path';
import fs, { access } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import treeKill from 'tree-kill';
import glob from 'glob';
import cpFile from 'cp-file';
import { BuilderContext } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
// @ts-ignore
import rimraf from 'rimraf';

const rimrafP = promisify(rimraf);

// Interfaces for the build and execute schemas
export interface ServerBuildSchema extends JsonObject {
  outputPath: string;
  src: string;
  tsConfig: string;
}

export interface ServerExecuteSchema extends ServerBuildSchema {
  main: string;
  envPath: string | null;
}

export function globObservable(pattern: string): Observable<string[]> {
  return new Observable(observer => {
    glob(pattern, (err, matches) => {
      if (err) {
        observer.error(err);
      }

      observer.next(matches);

      return {
        unsubscribe() {} // no op
      };
    });
  });
}

export function nonTsFilePattern(rootDir: string): string {
  return `${rootDir}/**/*.!(*(*.)ts|*(*.)tsx)`;
}

export function outputFile(outPath: string, srcDir: string) {
  return function(srcFile: string) {
    return `${outPath}${srcFile.substr(srcDir.length, srcFile.length)}`;
  };
}

export async function removeExampleOutDir() {
  const outDir = 'example/out';
  return rimrafP(outDir);
}

export function hasTxtFileBeenCopied(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    access('example/out/apps/api/text.txt', fs.constants.F_OK, err => {
      err ? resolve(false) : resolve(true);
    });
  });
}

export function tsc(
  options: ServerBuildSchema,
  context: BuilderContext
): Observable<string> {
  return new Observable(observer => {
    const command = `${normalize(
      context.workspaceRoot + '/node_modules/.bin/tsc'
    )}`;

    const cp = exec(
      `${command} -b ${options.tsConfig}`,
      (error, stdout, stderr) => {
        // TODO ? is this the right thing for serve as well
        if (stdout.toString().includes('error')) {
          observer.error(stdout.toString());
        }

        if (error) {
          observer.error(error.toString());
        } else {
          // A successfully run produces no output
          context.logger.info(stdout);
          observer.next(stdout);
          observer.complete();
        }
      }
    );

    return {
      unsubscribe() {
        treeKill(cp.pid, 'SIGKILL');
      }
    };
  });
}

export function copy(srcDir: string, outputPath: string): Observable<string> {
  return of(srcDir).pipe(
    map(dir => nonTsFilePattern(dir)),
    switchMap(pattern => globObservable(pattern)),
    map(files => [files, files.map(outputFile(outputPath, srcDir))]),
    switchMap(([srcFiles, destFiles]) =>
      // if there are no source files, return an observable of empty object so it completes
      srcFiles.length !== 0 ? filesCopied(srcFiles, destFiles) : of({})
    ),
    map(() => 'Non TS files copied into output directory'),
    take(1) // complete after first omit
  );
}

function filesCopied(srcFiles: string[], destFiles: string[]) {
  return forkJoin(srcFiles.map((value, i) => cpFile(value, destFiles[i])));
}
