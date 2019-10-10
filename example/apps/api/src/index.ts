import { readFileSync } from 'fs';

// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

import { lib2Logger } from '@lib2';
import { testingLogger } from '@testing/logger';
import { internalLogger } from './internal';
import { internal2Logger } from './int2/internal2';

const txtFile = readFileSync(`${__dirname}/text.txt`, 'utf-8');

console.log('');
console.log('##########################');
console.log('# -------- API --------- #');
console.log('##########################');
console.log('');

lib2Logger();

internalLogger();

internal2Logger();

testingLogger();

console.log(txtFile);

console.log(process.env.TEST);
