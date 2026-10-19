import fs from 'fs';
import path from 'path';

class TestUtils {
  /**
   * 方便测试时读取 Cookie
   * @param {string} fileName 文件名
   * @param {string} filePath 文件路径，应传入 __dirname
   * @returns {string} 文件内容
   */
  readCookie(fileName: string, filePath: string): string {
    fileName = `${fileName}.cookie.json`;
    return fs.readFileSync(path.join(filePath, fileName), {
      encoding: 'utf8',
    });
  }
}

export default new TestUtils();
