const { readdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const SPEC_CONTENT = `import { parse } from 'path';
import start from '../../index.jm';
start(parse(__dirname).name);`;

const rp = rpath => resolve(__dirname, rpath);

readdirSync(rp('./cases')).forEach(name => {
  writeFileSync(rp(`./cases/${name}/index.spec.js`), SPEC_CONTENT);
});
