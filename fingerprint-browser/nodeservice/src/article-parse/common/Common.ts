/**
 *
 */
export class Match {
  regexpexecArray: RegExpExecArray | null;

  constructor(_regexpexecArray: RegExpExecArray | null) {
    this.regexpexecArray = _regexpexecArray;
  }

  Value = (): string | undefined => {
    if (this.regexpexecArray?.length) {
      return this.regexpexecArray[0].toString();
    }
  };

  length(): number {
    return this.regexpexecArray?.length ?? 0;
  }
}

export class Regex {
  regex: RegExp | undefined | null;
  Match(content: string, regstr: string): Match {
    this.regex = new RegExp(regstr);
    const result = this.regex.exec(content);

    return new Match(result);
  }
  IsMatch(content: string): boolean {
    return this.regex?.test(content) ?? false;
  }
  public static replace(content: string, regstr: string, replaceValue: string): string {
    const reg = new RegExp(regstr, 'g');
    return content.replace(reg, replaceValue);
  }
  public static split(content: string, regstr: string) {
    const reg = new RegExp(regstr);
    return content.split(reg);
  }
  public static Match(content: string, regstr: string): Match {
    const reg = new RegExp(regstr);
    const result = reg.exec(content);
    return new Match(result);
  }
}

export class Task {
  public static async Delay(delay: number = 0): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve();
      }, delay);
    });
  }
}

export class Guid {
  public static NewGuid() {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
  }
}

export class Random {
  Next(start: number, end: number): number {
    return parseInt(String(Math.random() * (end - start) + 1));
  }
}
