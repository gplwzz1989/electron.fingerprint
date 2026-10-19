import { Content } from './model/Content';
import { BaiJiaHao } from './platForms/BaiJiaHao';
import { BasePlatForm } from './platForms/BasePlatForm';
import { DaFengHao } from './platForms/DaFengHao';
import { DaYuHao } from './platForms/DaYuHao';
import { GongZhongHao } from './platForms/GongZhongHao';
import { JianShu } from './platForms/JianShu';
import { QiEHao } from './platForms/QiEHao';
import { QuTouTiao } from './platForms/QuTouTiao';
import { SoHuHao } from './platForms/SoHuHao';
import { TouTiaoHao } from './platForms/TouTiaoHao';
import { WangYiHao } from './platForms/WangYiHao';
import { YiDianHao } from './platForms/YiDianHao';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';

export class ParseHub {
  static WorkerContainer: Map<number, BasePlatForm> = new Map<number, BasePlatForm>();

  public static async ParseArticleContentByUrl(url: string, proxy?: KuaiDaiLiProxy): Promise<Content | null> {
    if (!url || !url.startsWith('http')) {
      return null;
    }
    const worker = this.GetWorker(url);
    if (worker == null) return null;
    else {
      if (proxy?.serverAdd) {
        worker.proxy = proxy;
        worker.getProxyAgent();
      }

      return worker.GetArticleContent(url);
    }
  }

  private static GetWorker(url: string): BasePlatForm | null | undefined {
    if (!url || !url.startsWith('http')) {
      return null;
    }
    const checkUrl = url.split('=')[0].split('?')[0].toLowerCase();
    if (checkUrl.includes('toutiao.com')) {
      if (this.WorkerContainer.has(1)) {
        return this.WorkerContainer.get(1);
      }
      const re = new TouTiaoHao();
      this.WorkerContainer.set(1, re);
      return re;
    } else if (checkUrl.includes('baidu.com')) {
      if (this.WorkerContainer.has(2)) return this.WorkerContainer.get(2);
      const re = new BaiJiaHao();
      this.WorkerContainer.set(2, re);
      return re;
    } else if (checkUrl.includes('uc.cn') || checkUrl.includes('uc.com')) {
      if (this.WorkerContainer.has(3)) return this.WorkerContainer.get(3);
      const re = new DaYuHao();
      this.WorkerContainer.set(3, re);
      return re;
    } else if (checkUrl.includes('news.qq.com') || checkUrl.includes('om.qq.com') || checkUrl.includes('mp.qq.com')) {
      if (this.WorkerContainer.has(4)) return this.WorkerContainer.get(4);
      const re = new QiEHao();
      this.WorkerContainer.set(4, re);
      return re;
    } else if (checkUrl.includes('1sapp.com')) {
      if (this.WorkerContainer.has(5)) return this.WorkerContainer.get(5);
      const re = new QuTouTiao();
      this.WorkerContainer.set(5, re);
      return re;
    } else if (checkUrl.includes('yidianzixun.com')) {
      if (this.WorkerContainer.has(6)) return this.WorkerContainer.get(6);
      const re = new YiDianHao();
      this.WorkerContainer.set(6, re);
      return re;
    } else if (checkUrl.includes('163.com')) {
      if (this.WorkerContainer.has(7)) return this.WorkerContainer.get(7);
      const re = new WangYiHao();
      this.WorkerContainer.set(7, re);
      return re;
    } else if (checkUrl.includes('ifeng.com')) {
      if (this.WorkerContainer.has(8)) return this.WorkerContainer.get(8);
      const re = new DaFengHao();
      this.WorkerContainer.set(8, re);
      return re;
    } else if (checkUrl.includes('sohu.com')) {
      if (this.WorkerContainer.has(9)) return this.WorkerContainer.get(9);
      const re = new SoHuHao();
      this.WorkerContainer.set(9, re);
      return re;
    } else if (checkUrl.includes('weixin.qq.com')) {
      if (this.WorkerContainer.has(10)) return this.WorkerContainer.get(10);
      const re = new GongZhongHao();
      this.WorkerContainer.set(10, re);
      return re;
    } else if (checkUrl.includes('jianshu.com')) {
      if (this.WorkerContainer.has(11)) return this.WorkerContainer.get(11);
      const re = new JianShu();
      this.WorkerContainer.set(11, re);
      return re;
    }
  }
}
