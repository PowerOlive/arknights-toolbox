import { readdirSync } from 'fs';
import { join } from 'path';
import { recognize } from '..';
import getUniversalResult from '../getUniversalResult';

jest.mock('../requirements');
jest.mock('../constant');

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

export default dir => {
  const resolve = path => join(dir, path);
  test('recognition', async () => {
    const imgName = readdirSync(dir).find(name => name.startsWith('image'));
    const { data } = await recognize(resolve(imgName));
    expect(getUniversalResult(data)).toEqual(require(resolve('result.json')));
  });
};
