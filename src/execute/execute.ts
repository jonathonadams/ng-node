import { platform } from 'os';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { normalize } from 'path';
import { Observable } from 'rxjs';
import {
  tap,
  mapTo,
  catchError,
  switchMap,
  filter,
  concatMap,
} from 'rxjs/operators';
import treeKill from 'tree-kill';
import {
  BuilderOutput,
  createBuilder,
  BuilderContext,
} from '@angular-devkit/architect';
import { tsc, ServerExecuteSchema, copy, tspr } from '../utils/utils';

/* istanbul ignore next */
process.on('SIGINT', () => {
  treeKill(process.pid);
});

export default createBuilder(_executeApiBuilder);

function _executeApiBuilder(
  options: ServerExecuteSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  context.reportStatus(`Starting Node execute server...`);

  const tsc$ = tsc(options, context);
  const copy$ = copy(options.src, options.outputPath);

  // Report running each time it recompile
  const tscWatch$ = tscWatch(options, context).pipe(
    tap((data) => {
      if (data.includes('Starting')) {
        context.reportRunning();
      }
    }),
    // Only emit (and hence restart the server) once it is watching
    filter((data) => data.includes('Watching'))
  );
  /**
   * As typescript does not currently rewrite path aliases, use package '@uqt/ts-path-replace' in watch
   * mode to re-write all import aliases
   */
  const tspr$ = tspr(options, context);

  const node$ = node(options, context);

  return tsc$.pipe(
    switchMap(() => copy$),
    switchMap(() => tscWatch$),
    switchMap(() => tspr$),
    switchMap(() => node$),
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error);
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    })
  );
}

const spawnOptions: SpawnOptionsWithoutStdio = {
  stdio: 'pipe',
};

if (platform() === 'win32') {
  spawnOptions.shell = true;
}

export function tscWatch(
  options: ServerExecuteSchema,
  context: BuilderContext
): Observable<string> {
  return new Observable((observer) => {
    const command = `${normalize(
      context.workspaceRoot + '/node_modules/.bin/tsc'
    )}`;

    const cp = spawn(
      command,
      ['-b', options.tsConfig, '--watch'],
      spawnOptions
    );

    cp.stdout.on('data', (data) => {
      context.logger.info(data.toString());
      observer.next(data.toString());
    });

    /* istanbul ignore next */
    cp.stderr.on('data', (data) => {
      observer.error(data.toString());
    });

    cp.on('close', (code, signal) => {
      if (code === 0) {
        observer.complete();
      } else {
        observer.error({ code, signal });
      }
    });

    return {
      unsubscribe() {
        treeKill(cp.pid, 'SIGKILL');
      },
    };
  });
}

export function node(
  options: ServerExecuteSchema,
  context: BuilderContext
): Observable<string> {
  return new Observable<string>((observer) => {
    context.reportStatus(`Restarting Node application...`);

    const command = `${normalize(
      context.workspaceRoot + '/node_modules/.bin/cross-env'
    )}`;

    let args: string[];

    // If the envPath has not been set then don't use dotenv
    if (options.envPath) {
      args = [
        'NODE_ENV=dev',
        'node',
        '-r',
        'dotenv/config',
        `${options.outputPath}/${options.main}`,
        `dotenv_config_path=${options.envPath}`,
      ];
    } else {
      args = ['NODE_ENV=dev', 'node', `${options.outputPath}/${options.main}`];
    }

    const cp = spawn(command, args, spawnOptions);

    cp.stdout.on('data', (data) => {
      // DO not call on observer on next here, it wall report multiple success
      // for each chunk on the data stream
      context.logger.info(data.toString());
    });

    /* istanbul ignore next */
    cp.stderr.on('data', (data) => {
      // DO NOT call observer.error() here
      // stderr from the node process can just be deprecation warnings etc, don't want to stop the builder
      // It will cause the catchError to unsubscribe from all
      context.logger.error(data.toString());
    });

    cp.on('close', (code, signal) => {
      if (code === 0) {
        observer.next('Node application finished.');
        observer.complete();
      } else {
        observer.error({ code, signal });
      }
    });

    observer.next('Node application started');

    return {
      unsubscribe() {
        treeKill(cp.pid, 'SIGKILL');
      },
    };
  });
}
