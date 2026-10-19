import * as fs from 'fs';
import * as path from 'path';

// 限定数据类型为 string 或 object
type StorageValue = string | { [key: string]: unknown };

interface StorageItem {
  value: StorageValue;
  expireAt?: number; // 可选过期时间
}

export class LocalStorage {
  private static instance: LocalStorage | null = null;
  private filePath: string;

  private constructor(fileName: string = 'localStorage.json') {
    this.filePath = path.join(__dirname, fileName);

    // 如果文件不存在，初始化为一个空对象
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}));
    }
  }

  // 单例模式，确保全局唯一
  public static getInstance(fileName?: string): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage(fileName);
    }
    return LocalStorage.instance;
  }

  private getStorage(): Record<string, StorageItem> {
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(data) as Record<string, StorageItem>;
  }

  private setStorage(data: Record<string, StorageItem>): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // 设置项，支持过期时间（以毫秒为单位）
  setItem(key: string, value: StorageValue, ttl?: number): void {
    // 检查 value 类型，确保只接受 string 或 object
    if (typeof value !== 'string' && typeof value !== 'object') {
      throw new Error('Value must be a string or an object.');
    }

    const storage = this.getStorage();
    const expireAt = ttl ? Date.now() + ttl : undefined;
    storage[key] = { value, expireAt };
    this.setStorage(storage);
  }

  // 获取项，自动处理过期数据
  getItem(key: string): StorageValue | null {
    const storage = this.getStorage();
    const item = storage[key];

    if (!item) return null;

    const { value, expireAt } = item;

    // 如果有过期时间且已过期
    if (expireAt && Date.now() > expireAt) {
      this.removeItem(key); // 自动删除过期数据
      return null;
    }

    return value;
  }

  // 删除项
  removeItem(key: string): void {
    const storage = this.getStorage();
    delete storage[key];
    this.setStorage(storage);
  }

  // 清空所有项
  clear(): void {
    this.setStorage({});
  }

  // 获取所有存储的键
  keys(): string[] {
    const storage = this.getStorage();
    return Object.keys(storage);
  }
}
