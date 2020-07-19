import { Architect, BuilderOutput } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { logging, schema } from '@angular-devkit/core';
import { removeExampleOutDir, hasTxtFileBeenCopied } from '../utils/utils';
import { join } from 'path';

describe('Node Build Builder', () => {
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
      '@uqt/ng-node:build',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
      },
      { logger }
    ); // We pass the logger for checking later.

    run.output.subscribe(
      (out) => {
        output.push(out);
      },
      (error) => {},
      // Clean up on the completion
      async () => {
        // Stop the builder
        await run.stop();

        // Check all output from the
        output.forEach((builderOutput) => {
          expect(builderOutput.success).toBe(true);
        });

        done();
      }
    );
  });

  it('should copy non-TypeScript files to the output directory', async (done) => {
    const logger = new logging.Logger('');

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:build',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'example/apps/api/tsconfig.json',
      },
      { logger }
    ); // We pass the logger for checking later.

    run.output.subscribe(
      (out) => {},
      (error) => {},
      // Clean up on the completion
      async () => {
        // See if the text.txt has been copied (this is confirmed if the application runs anyway)
        const copied = await hasTxtFileBeenCopied();
        expect(copied).toBe(true);

        done();
      }
    );
  });

  it('should report unsuccessfully if an error is thrown', async (done) => {
    const logger = new logging.Logger('');
    const output: BuilderOutput[] = [];

    const run = await architect.scheduleBuilder(
      '@uqt/ng-node:build',
      {
        outputPath: 'example/out/apps/api',
        src: 'example/apps/api/src',
        tsConfig: 'some/wrong/file/path.json',
      },
      { logger }
    ); // We pass the logger for checking later.

    run.output.subscribe(
      (out) => {
        output.push(out);
      },
      (error) => {},
      // Clean up on the completion
      async () => {
        // Stop the builder
        await run.stop();

        // Check all output from the
        output.forEach((builderOutput) => {
          expect(builderOutput.success).toBe(false);
        });

        done();
      }
    );
  });
});
