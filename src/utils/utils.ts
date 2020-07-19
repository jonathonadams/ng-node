import { normalize } from 'path';
import { exec } from 'child_process';
import treeKill from 'tree-kill';
import cpFile from 'cp-file';
import { BuilderContext } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, forkJoin, EMPTY } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

// @ts-ignore
import glob from 'glob';

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
  return new Observable((observer) => {
    glob(pattern, (err: any, matches: string[]) => {
      if (err) {
        observer.error(err);
      }

      observer.next(matches);

      return {
        unsubscribe() {}, // no op
      };
    });
  });
}

export function nonTsFilePattern(rootDir: string): string {
  return `${rootDir}/**/*.!(*(*.)ts|*(*.)tsx)`;
}

export function outputFile(outPath: string, srcDir: string) {
  return function (srcFile: string) {
    return `${outPath}${srcFile.substr(srcDir.length, srcFile.length)}`;
  };
}

export function tsc(
  options: ServerBuildSchema,
  context: BuilderContext
): Observable<string> {
  return new Observable((observer) => {
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
      },
    };
  });
}

export function copy(srcDir: string, outputPath: string): Observable<string> {
  return of(srcDir).pipe(
    map((dir) => nonTsFilePattern(dir)),
    switchMap((dir) => globObservable(dir)),
    map((files) => [files, files.map(outputFile(outputPath, srcDir))]),
    switchMap(([srcFiles, destFiles]) =>
      // if there are no source files, return an observable of empty object so it completes
      srcFiles.length !== 0 ? filesCopied(srcFiles, destFiles) : EMPTY
    ),
    map(() => 'Non TS files copied into output directory'),
    take(1) // complete after first omit
  );
}

function filesCopied(srcFiles: string[], destFiles: string[]) {
  return forkJoin(srcFiles.map((value, i) => cpFile(value, destFiles[i])));
}
