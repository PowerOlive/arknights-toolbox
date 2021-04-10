const { readdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const SPEC_CONTENT = `import run from '../../index.jm';
run(__dirname);`;

const rp = rpath => resolve(__dirname, rpath);

readdirSync(rp('./cases')).forEach(name => {
  writeFileSync(rp(`./cases/${name}/index.spec.js`), SPEC_CONTENT);
});
