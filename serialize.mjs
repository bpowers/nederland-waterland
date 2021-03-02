import { readFileSync, createWriteStream } from 'fs';

import { fromXmile } from '@system-dynamics/importer';

const args = process.argv.slice(2);
const inputFile = args[0];
let contents = readFileSync(args[0], 'utf-8');

let pb = await fromXmile(contents);

const outputFile = createWriteStream(args[1]);

outputFile.write(pb);
outputFile.end();
