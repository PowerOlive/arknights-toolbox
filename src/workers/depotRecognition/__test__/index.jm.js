import { readdirSync } from 'fs';
import { resolve } from 'path';
import { recognize } from '..';
import getUniversalResult from '../getUniversalResult';

jest.mock('../requirements');
jest.mock('../constant');

const rp = rpath => resolve(__dirname, rpath);

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

export default name => {
  test(`Depot recognition - ${name}`, async () => {
    const imgName = readdirSync(rp(`./cases/${name}`)).find(name => name.startsWith('image'));
    const { data } = await recognize(rp(`./cases/${name}/${imgName}`));
    expect(getUniversalResult(data)).toEqual(require(rp(`./cases/${name}/result.json`)));
  });
};
