import { describe, it } from 'vitest';
import { XinLangWeiBoWorker } from '../../../src/cloud/task/platform/xinlangweoboworker';
import { EventEmitter } from 'events';
import { Task } from '../../../src/utils';

describe.runIf(true)('查询定时发布剩余次数', () => {
  it('查询定时发布剩余次数', async () => {
    const cookie =
      'SCF=AuXY3pxfC-nkqOyoH3FwTXXi53Cuvb8FaLbC1-_FqNJAw5ypFwTPLn-A1cVatNKXA3hW2tkHbI61JDJs4RO22xg.; SUB=_2A25ETn07DeRhGeVH4lEZ9CbJyTuIHXVnIvDzrDV8PUNbmtAbLWbRkW9NTwkTtHNuCwjrzHizjt9h4ZDsBM4IwZZ6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WW5d.w50HDTNFlDY93.dzJL5JpX5KzhUgL.Foe41KeRShnfeoM2dJLoIEBLxKqLBoBL12zLxK-L1KeLBK-LxKBLBonL12BLxKqL1K-LBKzt; ALF=02_1769052779; _s_tentry=-; Apache=4839957086641.273.1766974339604; SINAGLOBAL=4839957086641.273.1766974339604; ULV=1766974339659:1:1:1:4839957086641.273.1766974339604:; BAYEUX_BROWSER=c9499f3vjzus3mzlmjqiwff313rd';

    const worker = new XinLangWeiBoWorker(cookie, undefined, undefined, 'weibo.com');
    await worker.createMsgService({ platformAuthorId: '' }, new EventEmitter());
    await Task.Delay(500000);
  });
});

describe.runIf(true)('微博发送私信', () => {
  it('发送私信', async () => {
    const cookie =
      'SCF=AuXY3pxfC-nkqOyoH3FwTXXi53Cuvb8FaLbC1-_FqNJAw5ypFwTPLn-A1cVatNKXA3hW2tkHbI61JDJs4RO22xg.; SUB=_2A25ETn07DeRhGeVH4lEZ9CbJyTuIHXVnIvDzrDV8PUNbmtAbLWbRkW9NTwkTtHNuCwjrzHizjt9h4ZDsBM4IwZZ6; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WW5d.w50HDTNFlDY93.dzJL5JpX5KzhUgL.Foe41KeRShnfeoM2dJLoIEBLxKqLBoBL12zLxK-L1KeLBK-LxKBLBonL12BLxKqL1K-LBKzt; ALF=02_1769052779; _s_tentry=-; Apache=4839957086641.273.1766974339604; SINAGLOBAL=4839957086641.273.1766974339604; ULV=1766974339659:1:1:1:4839957086641.273.1766974339604:; BAYEUX_BROWSER=c9499f3vjzus3mzlmjqiwff313rd';

    const worker = new XinLangWeiBoWorker(cookie, undefined, undefined, 'weibo.com');
    const re=await worker.SendMessage({ sessionId:'7915358347',text:'我终于快完了' });
    console.log(re);
  });
});