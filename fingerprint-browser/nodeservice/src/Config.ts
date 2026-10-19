import path from 'path';
import fs from 'fs';
import { createLogger, logger } from '@/utils';
import { PushingScheduleService, StateQueryScheduleService } from './cloud/schedule-service';

export class PubConfig {
  /**
   * 日志文件路径
   */
  public static logPath: string = '';

  /**
   * 弃用，使用setUserDataPath
   * 设置日志路径
   * @param localLogPath
   */
  public static setLogPath(localLogPath: string): void {
    PubConfig.logPath = localLogPath;
    try {
      if (!fs.existsSync(PubConfig.logPath)) {
        fs.mkdirSync(PubConfig.logPath, { recursive: true });
      }
      fs.accessSync(PubConfig.logPath, fs.constants.W_OK);
      //能正常
      createLogger();
    } catch (e) {
      console.log(localLogPath, e);
    }
  }

  /**
   * 设置用户数据目录，设置这个目录后，会自动设置对应的日志目录和视频临时存储目录，不用单独设置日志和视频目录
   * 注意：需要确保目录是存在的
   * @param liteUserDataPath
   */
  public static setUserDataPath(liteUserDataPath: string): void {
    PubConfig.userYixiaoerDataDir = liteUserDataPath;
    PubConfig.setUserVideoDataDir();
    PubConfig.setLogPath(path.join(liteUserDataPath, 'logs'));
  }

  /**
   * 用户数据目录，可写
   */
  public static userYixiaoerDataDir: string = '';

  /**
   * 缓存视频的目录，会默认在用户数据目录后加video
   */
  public static userYixiaoerVideoTmpDir: string = '';

  /**
   * 数据上报的api的域名，https://yixiaoer.cn
   */
  public static API_URL = 'https://lj-test.yixiaoer.cn';

  /**
   * 用于数据上报api鉴权的token
   */
  public static API_Token = '';

  /**
   * 用于数据上报api的x-client 标识
   * cloud: 云端，desktop: 桌面端
   */
  public static xClient: 'cloud' | 'desktop' = 'cloud';

  public static OpenCallBackUrlPath = '/api/webhook/web';

  /**
   * HTTP请求默认超时时间，单位：毫秒
   */
  public static httpTimeout = 200000;

  /**
   * 初始化视频存储目录
   */
  public static setUserVideoDataDir() {
    try {
      if (PubConfig.userYixiaoerDataDir && !fs.existsSync(PubConfig.userYixiaoerDataDir)) {
        fs.mkdirSync(PubConfig.userYixiaoerDataDir, { recursive: true });
      }
      PubConfig.userYixiaoerVideoTmpDir = path.join(PubConfig.userYixiaoerDataDir, 'video');
      if (!fs.existsSync(PubConfig.userYixiaoerVideoTmpDir)) {
        fs.mkdirSync(PubConfig.userYixiaoerVideoTmpDir, { recursive: true });
      }
      return PubConfig.userYixiaoerVideoTmpDir;
    } catch (e) {
      const err = `获取用户数据目录失败${JSON.stringify(e)}`;
      logger.error(err);
      return err;
    }
  }

  /**
   * 删除历史文件
   * @param targetDirectory
   * @param days
   */
  public static deleteFilesOlderThanGivenDays(targetDirectory: string, days: number): void {
    const daysInMilliseconds = days * 3 * 60 * 60 * 1000;
    const now = new Date().getTime();

    try {
      if (!targetDirectory) {
        return;
      }
      const items = fs.readdirSync(targetDirectory);
      items.forEach((item) => {
        const itemPath = path.join(targetDirectory, item);
        try {
          const stats = fs.statSync(itemPath);
          if (stats.isFile()) {
            const creationTime = stats.birthtimeMs;
            const timeDifference = now - creationTime;
            if (timeDifference > daysInMilliseconds) {
              fs.unlinkSync(itemPath);
              console.log(`已删除文件: ${itemPath}`);
            }
          } else if (stats.isDirectory()) {
            // 递归调用删除子目录下的文件
            this.deleteFilesOlderThanGivenDays(itemPath, days);
          }
        } catch (error) {
          console.error(`处理项目 ${itemPath} 时出错:`, error);
        }
      });
    } catch (error) {
      console.error(`读取目录 ${targetDirectory} 时出错:`, error);
    }
  }

  /**
   * 查询类任务队列
   */
  public static stateQuerySchedulerService = new StateQueryScheduleService(10);

  /**
   * 发布任务队列
   */
  public static pushingSchedulerService = new PushingScheduleService(5, 1000 * 10 * 60);

  /**
   * 数据同步队列
   */
  public static dataSyncSchedulerService = new StateQueryScheduleService(10);
}
