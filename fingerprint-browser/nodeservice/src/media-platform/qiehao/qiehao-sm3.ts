import fs from 'fs';

export class QiehaoSm3 {
  constructor() {}
  n = [1937774191, 1226093241, 388252375, -628488704, -1452330820, 372324522, -477237683, -1325724082];
  public async GetSM3String(filePath: string): Promise<string> {
    let fileHandle: fs.promises.FileHandle | null = null;
    fileHandle = await fs.promises.open(filePath, 'r');
    const fileStat = await fs.promises.stat(filePath);
    let r = 0,
      i = 0;
    const blockSize = 5242880;
    r = Math.ceil(fileStat.size / blockSize);
    let readedNum = 0;
    const readNum = 0;
    let f;

    while (readedNum < fileStat.size) {
      if (blockSize + readedNum > fileStat.size) {
        const buffer = Buffer.alloc(fileStat.size);
        f = await fileHandle.read(buffer, 0, fileStat.size, 0);
      } else {
        let buffer = Buffer.alloc(blockSize);
        let canReadNum = blockSize;
        if (readedNum + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readedNum;
          buffer = Buffer.alloc(canReadNum);
        }
        f = await fileHandle.read(buffer, 0, canReadNum, readedNum);
      }
      i++;
      readedNum += readNum;
      if (i < r) {
        const d: Array<number> = []; //1310720
        for (let p = 0; p < 41943040; ) {
          d[p >> 5] = d[p >> 5] | ((255 & f[p >> 3]) << (24 - (p % 32)));
          p += 8;
        }
        this.u(d, 0, 0, this.n, i, r);
      } else {
        const h = readNum;
        const v: Array<number> = [];
        const m = 8 * h;
        for (let y = 0; y < m; ) {
          v[y >> 5] = v[y >> 5] | ((255 & f[y >> 3]) << (24 - (y % 32)));
          y += 8;
        }
        return this.u(v, fileStat.size, h, this.n, i, r);
      }
    }
    return '';
  }
  r(e: Array<number>): string {
    const t = e.length;
    const re: Array<string> = [];
    for (let n = 0; n < t; n++) {
      const str = '0000000' + (e[n] >>> 0).toString(16);
      re[n] = str.substring(-8);
    }

    return re.join('');
  }
  i(e: number): number {
    return e ^ ((e << 9) | (e >>> 23)) ^ ((e << 17) | (e >>> 15));
  }
  o(e: number): number {
    return e ^ ((e << 15) | (e >>> 17)) ^ ((e << 23) | (e >>> 9));
  }
  a(e: number, t: number, n: number, r: number): number {
    return r < 16 ? e ^ t ^ n : (e & t) | (e & n) | (t & n);
  }
  s(e: number, t: number, n: number, r: number): number {
    return r < 16 ? e ^ t ^ n : (e & t) | (~e & n);
  }
  u(e: Array<number>, t: number, n: number, u: Array<number>, c: number, l: number): string {
    let f = 0;
    if (c != l) f = 81920;
    else {
      e[n >> 2] = e[n >> 2] | (128 << (24 - (n % 4) * 8));
      f = 1 + ((n + 8) >> 6);
      const d = 16 * f;
      for (let p = 1 + (n >> 2); p < d; p++) e[p] = 0;
      e[d - 1] = 8 * t;
    }
    let v = 0,
      y = 0,
      m = 0,
      g = 0,
      b = 0,
      S = 0,
      x = 0,
      w = 0,
      T = 0,
      k = 0,
      C = 0,
      _ = 0,
      A = 0;
    for (let h = 0; h < f; ) {
      const j: Array<number> = [];
      const I: Array<number> = [];
      for (let E = 0; E < 68; E++)
        j[E] =
          E < 16
            ? 0 | e[16 * h + E]
            : this.o(j[E - 16] ^ j[E - 9] ^ ((j[E - 3] << 15) | (j[E - 3] >>> 17))) ^
              ((j[E - 13] << 7) | (j[E - 13] >>> 25)) ^
              j[E - 6];
      for (let E = 0; E < 64; E++) I[E] = j[E] ^ j[E + 4];
      v = 0 | u[0];
      y = 0 | u[1];
      m = 0 | u[2];
      g = 0 | u[3];
      b = 0 | u[4];
      S = 0 | u[5];
      x = 0 | u[6];
      w = 0 | u[7];
      for (let E = 0; E < 64; E++) {
        A = E < 16 ? 2043430169 : 2055708042;
        T =
          ((((v << 12) | (v >>> 20)) + b + ((A << E) | (A >>> (32 - E)))) << 7) |
          ((((v << 12) | (v >>> 20)) + b + ((A << E) | (A >>> (32 - E)))) >>> 25);
        k = T ^ ((v << 12) | (v >>> 20));
        C = (this.a(v, y, m, E) + g + k + I[E]) | 0;
        _ = (this.s(b, S, x, E) + w + T + j[E]) | 0;
        g = m;
        m = (y << 9) | (y >>> 23);
        y = v;
        v = C;
        w = x;
        x = (S << 19) | (S >>> 13);
        S = b;
        b = this.i(_);
      }

      u[0] = u[0] ^ v;
      u[1] = u[1] ^ y;
      u[2] = u[2] ^ m;
      u[3] = u[3] ^ g;
      u[4] = u[4] ^ b;
      u[5] = u[5] ^ S;
      u[6] = u[6] ^ x;
      u[7] = u[7] ^ w;
      h++;
    }
    if (c == l) {
      return this.r(u);
    }
    return '';
  }
}
