# @uqt/ng-node

Angular CLI Builder for building and executing node applications.

## Why this package

With the stable release of Angular CLI Builders API (angular v8), the Angular CLI can be extended to run custom build targets.

It is common in monorepo design have both frontend and backend applications in the same repository, sharing common code. Most builders tend to use WebPack to build server applications as well as not catering for other non JavaScrip files (i.e. `.graphql` schema files).

Check out [Nrwl](https://nrwl.io/) for more info on monorepos and the amazing tools they provide to support them

## Angular CLI Builders

Two builders are provided with this package. A `build` and `execute` builder.

The `build` builder will:

1. Compile your TypeScript code
2. Re-write and replace the TypeScrip alias paths (`@some/alias`) to relative paths(`../../some/relative/paths`) using [@uqt/ts-path-replace](https://github.com/unquenchablethyrst/ts-paths-replace)
3. Copy all non TypeScript (.ts) files from the project `rooDir` to the `outDir`
4. The builder will exit once steps 1 - 3 complete.

The `execute` builder will:

1. Compile your TypeScript code
2. Re-write and replace the TypeScrip alias paths (`@some/alias`) to relative paths(`../../some/relative/paths`) using [@uqt/ts-path-replace](https://github.com/unquenchablethyrst/ts-paths-replace)
3. Copy all non TypeScript (.ts) files from the project `rooDir` to the `outDir`
4. Run your application
5. Watch for changes in the source files and repeat the steps 1 - 4 on each change

## Installation

```bash
npm install --save-dev @uqt/ng-node
```

## Usage

To use the custom builders, configure your `angular.json` like such.

```JavaScript
// angular.json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  ...
  "projects":{
    ...
    "<PROJECT_NAME>": {
      ...
      "architect": {
        "build": {
          "builder": "@uqt/ng-node:build", // Use the 'build' target when building
          "options": {
            "tsConfig": "apps/servers/api/tsconfig.app.json"
            "outputPath": "dist/api",
            "src": "apps/servers/api/src",
          }
        },
        "serve": {
          "builder": "@uqt/ng-node:execute", // Use the 'execute' target when serving as the serve builder
          "options": {
            "tsConfig": "apps/servers/api/tsconfig.app.json",
            "outputPath": "dist/api",
            "src": "apps/servers/api/src",
            "main": "main.js",
            "envPath": "apps/servers/api/.env" // Optional path to environment variables
          }
        }
      }
    }
  }
}
```

Then run the commands with the Angular CLI as you normally would.

```bash
# Build once can complete
ng build <PROJECT_NAME>

# Build, run the application and watch for changes in the output and recompile
ng serve <PROJECT_NAME>
```

## API Documentation

**Options** \<Object\>

| Option         | Builder         | Description                                                                |
| -------------- | --------------- | -------------------------------------------------------------------------- |
| **tsConfig**   | Build / Execute | Path to the json config file to process **Required**                       |
| **outputPath** | Build / Execute | Path to the output directory of the project **Required**                   |
| **src**        | Build / Execute | Path to the src directory of the project **Required**                      |
| **main**       | Execute         | The main entry point to the application (the file to execute) **Required** |
| **envPath**    | Execute         | Optional path to an environment variable file **Optional**                 |

## Example

For an example of using these builders in a code sharing monorepo that includes a frontend written in Angular and a backend written in [Koa](https://koajs.com/) that includes [GraphQL](https://graphql.org/), please see [zero-to-production.dev](https://zero-to-production.dev)

## Versioning

The package follows [semver](https://semver.org/) versioning and releases are automated by [semantic release](https://www.npmjs.com/package/semantic-release)

## Contributing

Contributions and PR's are welcome!

### Commit Message Guidelines

https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit
