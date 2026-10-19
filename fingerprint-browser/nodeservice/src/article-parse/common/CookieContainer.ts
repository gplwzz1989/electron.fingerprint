import { Regex } from './Common';

export class Cookie {
  constructor() {
    this.domain = '';
    this.name = '';
    this.expire = 0;
    this.value = '';
  }

  public name: string;

  public value: string;

  public domain: string;
  public expire: number;
}

export class CookieContainer {
  map: Map<string, string>;
  constructor(cookieStr?: string | object) {
    this.map = new Map<string, string>();
    if (cookieStr) this.AddCookie(cookieStr);
  }
  AddByHeaders(cookies: Array<string>) {
    if (cookies) {
      cookies.forEach((v, i) => {
        this.AddCookie(v?.split(';')[0]?.trim());
      });
    }
  }
  AddCookie(cookie: string | object) {
    if (!cookie) return;
    try {
      if (typeof cookie == 'string') {
        cookie = Regex.replace(cookie, '[\\u4E00-\\u9FFF]+', '12');
        if (cookie.includes('=') && !cookie.includes('{')) {
          const nameValueArray = cookie?.split(';');
          if (nameValueArray?.length > 0) {
            nameValueArray.forEach((v, i) => {
              const nameValue: string = v;
              if (nameValue.indexOf('=') > -1) {
                const name = nameValue.split('=')[0];
                const value = (cookie = Regex.replace(nameValue.substr(name.length + 1), '[\\u4E00-\\u9FFF]+', '12'));
                this.map.set(name?.trim(), value?.trim());
              }
            });
          }
        } else if (cookie.includes('[') && cookie.includes('{')) {
          const ckcs = JSON.parse(cookie);
          if (ckcs?.length > 0) {
            for (const cookieItem of ckcs) {
              if (!cookieItem.name || !cookieItem.value) continue;
              this.map.set(cookieItem.name, cookieItem.value);
            }
          }
        }
      } else if (typeof cookie == 'object') {
        const cookies = cookie as Array<any>;
        if (cookies?.length > 0) {
          for (const cookieItem of cookies) {
            if (!cookieItem.name || !cookieItem.value) {
              continue;
            }
            this.map.set(cookieItem.name, cookieItem.value);
          }
        }
      }
    } catch (e) {
      console.log('设置cookie失败:' + e);
    }
  }

  Add(name: string, value: string) {
    this.map.set(name?.trim(), value?.trim());
  }
  Remove(name: string) {
    this.map.delete(name?.trim());
  }

  toString(): string {
    let cookie = '';
    this.map.forEach((k, v) => {
      cookie += v + '=' + k + ';';
    });
    return cookie;
  }
}
