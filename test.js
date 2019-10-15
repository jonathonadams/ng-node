const {  spawn} = require('child_process');
const { normalize} = require('path');

const options = {
    outputPath: 'example/out/apps/api',
    src: 'example/apps/api/src',
    tsConfig: 'example/apps/api/tsconfig.json',
    main: 'index.js',
    envPath: 'example/apps/api/.env'
}
let a =process.cwd() + '/node_modules/.bin/cross-env'
console.log(a)
const command = `${normalize(
    a
  )}`;


  console.log(command)
    args = ['cross-env', 'NODE_ENV=dev', 'node', `${options.outputPath}/${options.main}`];
 

  const cp = spawn('npx', args, {
    stdio: 'pipe',
    shell: true
  });

  cp.stdout.on('data', data => {
    console.log(data.toString())
  });

  cp.on('error', console.error);
  

  /* istanbul ignore next */
  cp.stderr.on('data', data => {
    // DO NOT call observer.error() here
    // stderr from the node process can just be deprecation warnings etc, don't want to stop the builder
    // It will cause the catchError to unsubscribe from all
    console.log(data.toString())
  });
