import DepotRecognitionWorker from 'comlink-loader?publicPath=./&name=assets/js/dr.[hash].worker.[ext]!@arkntools/depot-recognition/worker';
import NamespacedLocalStorage from '@/utils/NamespacedLocalStorage';
import { transfer } from 'comlink';

import order from '@/data/itemOrder.json';
import pkgUrl from 'file-loader?name=assets/pkg/item.[md5:hash:hex:8].[ext]!@/assets/pkg/item.zip';

new NamespacedLocalStorage('dr.pkg').clear();

const worker = new DepotRecognitionWorker();

export const setDebug = worker.setDebug;

let recognizer = null;

export const getRecognizer = async () => {
  if (recognizer) return recognizer;
  const pkg = await fetch(pkgUrl).then(r => r.arrayBuffer());
  recognizer = await new worker.DeportRecognizer(transfer({ order, pkg }, [pkg]));
  return recognizer;
};
