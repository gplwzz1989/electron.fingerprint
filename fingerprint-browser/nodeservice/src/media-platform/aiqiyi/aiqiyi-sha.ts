import fs from 'fs';
import crypto from 'crypto';
class ab {
  constructor() {}
  public a: number | undefined;
  public b: number | undefined;
}

class blockData {
  constructor() {
    this.fileReadStart = 0;
    this.fileReadEnd = 0;
  }
  public fileSize: number | undefined;
  public start: number | undefined;
  public end: number | undefined;
  public fileReadStart: number;
  public fileReadEnd: number;
}
export class IQiYiSha1 {
  hash = [1732584193, -271733879, -1732584194, 271733878, -1009589776];
  groups = [
    {
      floor: 0,
      upper: 41943039,
      num: 0,
      interval: 0,
      all: true,
    },
    {
      floor: 41943040,
      upper: 134217727,
      num: 0,
      interval: 0,
    },
    {
      floor: 134217728,
      upper: 536870911,
      num: 1,
      interval: 0,
    },
    {
      floor: 536870912,
      upper: 1073741823,
      num: 2,
      interval: 134217728,
    },
    {
      floor: 1073741824,
      upper: 2147483647,
      num: 3,
      interval: 268435456,
    },
  ];

  async GetSha1(filePath: string): Promise<string> {
    const fileHandle = await fs.promises.open(filePath, 'r');
    const blockSize = 1048576;
    const fileLength = fileHandle.stat.length;
    let readedNum = 0;
    let readNum = 0;
    let canReadLength = 0;
    const sampleSize = 20971520;
    const abData = this.GetABData(fileLength, sampleSize);
    canReadLength = abData.Key;
    const blockList = this.GetBlockData(abData.Value, fileLength, canReadLength, blockSize);

    let result = '';
    for (const item of blockList) {
      readNum = item.fileReadStart + item.fileReadEnd - item.fileReadStart;
      const partData = Buffer.alloc(readNum);
      await fileHandle.read(partData, 0, readNum, readedNum);
      readedNum = readedNum + readNum;
      const n = this.bytesToWords(partData);
      if (readNum < blockSize || readedNum >= canReadLength) {
        const o = 8 * canReadLength;
        const a = 8 * readNum;
        const u = Math.floor(o / 4294967296);
        const f = 4294967295 & o;
        n[a >>> 5] = n[a >>> 5] | (128 << (24 - (a % 32)));
        n[14 + (((a + 64) >>> 9) << 4)] = u;
        n[15 + (((a + 64) >>> 9) << 4)] = f;
        this.hash = this.sha1(n, this.hash);
        result = this.bytesToHex(this.wordsToBytes(this.hash));
        break;
      } else {
        this.hash = this.sha1(n, this.hash);
      }
    }
    return crypto
      .createHash('sha1')
      .update(Buffer.from(result + fileLength))
      .digest('hex');
  }
  sha1(r: number[], t: number[]): number[] {
    const n: Array<number> = [];
    let e = t[0];
    let o = t[1];
    let s = t[2];
    let a = t[3];
    let u = t[4];
    for (let f = 0; f < r.length; f += 16) {
      const h = e;
      const i = o;
      const l = s;
      const c = a;
      const g = u;
      for (let p = 0; p < 80; p++) {
        if (p < 16) {
          n[p] = 0 | r[f + p];
        } else {
          const y = n[p - 3] ^ n[p - 8] ^ n[p - 14] ^ n[p - 16];
          n[p] = (y << 1) | (y >>> 31);
        }
        const d =
          ((e << 5) | (e >>> 27)) +
          u +
          (n[p] >>> 0) +
          (p < 20
            ? 1518500249 + ((o & s) | (~o & a))
            : p < 40
            ? 1859775393 + (o ^ s ^ a)
            : p < 60
            ? ((o & s) | (o & a) | (s & a)) - 1894007588
            : (o ^ s ^ a) - 899497514);
        u = a;
        a = s;
        s = (o << 30) | (o >>> 2);
        o = e;
        e = d;
      }
      e = (e + h) | 0;
      o = (o + i) | 0;
      s = (s + l) | 0;
      a = (a + c) | 0;
      u = (u + g) | 0;
    }
    return [e, o, s, a, u];
  }

  GetABData(fileLength: number, sampleSize: number = 20971520): any {
    const e = fileLength;
    const t = sampleSize;
    const r = this.groups;
    const n: Array<{ a: number; b: number }> = [];
    let i = fileLength;
    let o: any = {};
    let s = 0;
    let u = 0;
    let l = 0;
    for (let a = 0; a < r.length; ++a) {
      if (e >= r[a].floor && e <= r[a].upper) {
        o = r[a];
        break;
      }
    }
    if (o?.all) {
      n.push({ a: 0, b: 0 });
    } else {
      n.push({ a: 0, b: t });
      if (o.num > 0) {
        s = e % 2 == 0 ? e / 2 : (e - 1) / 2;
        u = o.num % 2 == 0 ? (o.num / 2) * (t + o.interval) : ((o.num - 1) / 2) * (t + o.interval) + t / 2;
        l = s - u;
        for (let a = 0; a < o.num; ++a) {
          l += o.interval;
          n.push({ a: l, b: l + t });
          l = l + o.interval + t;
        }
      }
      n.push({ a: e - t, b: e });
      i = n.length * t;
    }
    const re = new Array<ab>();
    for (const item of n) {
      re.push(item as ab);
    }
    // return {i:re} ;
    return { Key: i, Value: re };
  }

  GetBlockData(
    abList: Array<ab>,
    fileLength: number,
    canReanLength: number,
    blockSize: number = 1048576,
  ): Array<blockData> {
    const e = fileLength;
    const t = blockSize;
    const i = canReanLength;
    const n = abList ?? [];
    const a = new Array<blockData>();
    let o = 0;
    let s = 0;
    let u = 0;
    for (o = 0; o < n.length; o++) {
      for (s = n[o].a ?? 0; s < (n && n[o] ? n[o].b ?? 0 : 1); s += t) {
        u = a.length;
        a.push({
          fileSize: i,
          start: u * t,
          end: i < (u + 1) * t ? i : (u + 1) * t,
          fileReadStart: s,
          fileReadEnd: e < s + t ? e : s + t,
        });
      }
    }
    return a;
  }
  public bytesToWords(r): any {
    const t: Array<number> = [];
    let e = 0;
    for (let n = 0; n < r.length; n++, e += 8) t[e >>> 5] |= (255 & r[n]) << (24 - (e % 32));
    return t;
  }
  public wordsToBytes(r): number[] {
    const t: Array<number> = [];
    for (let n = 0; n < 32 * r.length; n += 8) t.push((r[n >>> 5] >>> (24 - (n % 32))) & 255);
    return t;
  }
  public bytesToHex(r): any {
    const t: Array<string> = [];
    for (let n = 0; n < r.length; n++) t.push((r[n] >>> 4).toString(16)), t.push((15 & r[n]).toString(16));
    return t.join('');
  }
}
