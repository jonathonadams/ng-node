// import { normalize } from 'path';
import { Observable } from 'rxjs';
import { mapTo, catchError, switchMap } from 'rxjs/operators';
import { tsc, copy, ServerBuildSchema, tspr } from '../utils/utils';
import treeKill from 'tree-kill';
import {
  BuilderOutput,
  createBuilder,
  BuilderContext,
} from '@angular-devkit/architect';

/* istanbul ignore next */
process.on('SIGINT', () => {
  treeKill(process.pid);
});

export default createBuilder(_buildApiBuilder);

function _buildApiBuilder(
  options: ServerBuildSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  context.reportStatus(`Executing custom builder...`);

  const {
    outputPath,
    src,
    tsConfig,
  }: {
    outputPath: string;
    src: string;
    tsConfig: string;
  } = options;

  const tsc$ = tsc(options, context);
  const copy$ = copy(src, outputPath);

  /**
   * As typescript does not currently rewrite path aliases, use package '@utz/tspr' in watch
   * mode to re-write all import aliases
   */
  const tspr$ = tspr(options, context);

  return tsc$.pipe(
    switchMap(() => copy$),
    switchMap(() => tspr$),
    mapTo({ success: true }),
    catchError((error) => {
      context.logger.error(error);
      context.reportStatus('Error: ' + error);
      return [{ success: false }];
    })
  );
}
