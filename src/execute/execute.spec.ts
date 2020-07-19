import { Architect, BuilderOutput } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { logging, schema } from '@angular-devkit/core';
import { take } from 'rxjs/operators';
import { removeExampleOutDir, hasTxtFileBeenCopied } from '../utils/utils';
import { join } from 'path';

// XXX -> deceleration mismatch wiht rxjs operators

describe('Node Execute Builder', () => {
  let architect: Architect;
  let architectHost: TestingArchitectHost;

  beforeAll(async () => {
    await removeExampleOutDir();
  });

  beforeEach(async () => {
    const registry = new schema.CoreSchemaRegistry();
    registry.addPostTransform(schema.transforms.addUndefinedDefaults);

    // Arguments to TestingArchitectHost are workspace and current directories.
    // Since we don't use those, both are the same in this case.
    architectHost = new TestingArchitectHost(process.cwd(), process.cwd());
    architect = new Architect(architectHost, registry);

    // This will either take a Node package name, or a path to the directory
    // for the package.json file.
    await architectHost.addBuilderFromPackage(join(__dirname, '../..'));
  });

  it('should compile the application', async (done) => {
    const logger = new logging.Logger('');
    const output: BuilderOutput[] = [];

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:execute',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
        main: 'index.js',
        envPath: 'example/apps/api/.env',
      },
      { logger }
    );

    // XXX
    // @ts-ignore
    run.output.pipe(take(2)).subscribe({
      next: (out: BuilderOutput) => {
        output.push(out);
      },
      complete: async () => {
        // Clean up on the completion
        // Stop the builder
        await run.stop();

        // Check all output from the
        output.forEach((builderOutput) => {
          expect(builderOutput.success).toBe(true);
        });

        done();
      },
    });
  });

  it('should copy non-TypeScript files to the output directory', async (done) => {
    const logger = new logging.Logger('');

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:execute',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
        main: 'index.js',
        envPath: 'example/apps/api/.env',
      },
      { logger }
    );

    // XXX
    // @ts-ignore
    run.output.pipe(take(2)).subscribe({
      // Clean up on the completion
      complete: async () => {
        // Stop the builder
        await run.stop();

        // See if the text.txt has been copied (this is confirmed if the application runs anyway)
        const copied = await hasTxtFileBeenCopied();
        expect(copied).toBe(true);

        done();
      },
    });
  });

  it('should run the application', async (done) => {
    const logger = new logging.Logger('');
    const logs: string[] = [];

    logger.subscribe((ev) => logs.push(ev.message));

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:execute',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
        main: 'index.js',
        envPath: 'example/apps/api/.env',
      },
      { logger }
    ); // We pass the logger for checking later.

    // XXX
    // @ts-ignore
    run.output.pipe(take(2)).subscribe({
      // Clean up on the completion
      complete: async () => {
        // Stop the builder
        await run.stop();

        // Check the log file
        const logFile = logs.toString();
        expect(logFile).toContain('Logging from Lib 1');
        done();
      },
    });
  });

  it('should pull in the environment variables from the .env file', async (done) => {
    const logger = new logging.Logger('');
    const logs: string[] = [];

    logger.subscribe((ev) => logs.push(ev.message));

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:execute',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
        main: 'index.js',
        envPath: 'example/apps/api/.env',
      },
      { logger }
    );

    // XXX
    // @ts-ignore
    run.output.pipe(take(2)).subscribe({
      // Clean up on the completion
      complete: async () => {
        // Stop the builder
        await run.stop();

        // Check the log file
        const logFile = logs.toString();
        expect(logFile).toContain('SOME TEST ENVIRONMENT VARIABLE');
        done();
      },
    });
  });

  it('should not pull in the environment variables if no file path is provided', async (done) => {
    const logger = new logging.Logger('');
    const logs: string[] = [];

    logger.subscribe((ev) => logs.push(ev.message));

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:execute',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
        main: 'index.js',
      },
      { logger }
    ); // We pass the logger for checking later.

    // XXX
    // @ts-ignore
    run.output.pipe(take(2)).subscribe({
      // Clean up on the completion
      complete: async () => {
        // Stop the builder
        await run.stop();

        // Check the log file
        const logFile = logs.toString();
        expect(logFile).not.toContain('SOME TEST ENVIRONMENT VARIABLE');
        done();
      },
    });
  });

  it('should report unsuccessfully if an error is thrown', async (done) => {
    const logger = new logging.Logger('');
    const output: BuilderOutput[] = [];

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:execute',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'some/wrong/file/path.json',
        main: 'index.js',
      },
      { logger }
    ); // We pass the logger for checking later.

    // XXX
    // @ts-ignore
    run.output.pipe(take(2)).subscribe({
      next: (out: BuilderOutput) => {
        output.push(out);
      },
      // Clean up on the completion
      complete: async () => {
        // Stop the builder
        await run.stop();

        // Check all output from the
        output.forEach((builderOutput) => {
          expect(builderOutput.success).toBe(false);
        });

        done();
      },
    });
  });
});
