import {
  getXiaohongshushopArkB1,
  getXiaohongshushopArkB1Payload,
} from '@/media-platform/xiaohongshushop/xiaohongshushop-ark-sign';
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';

describe('小红书店铺签名', () => {
  /**
   * 参数生成链路：/api/sec/v1/sbtsource 下发指纹脚本地址 → 加载 3.5.4 指纹脚本 →
   * window.xhsFingerprintV3.getV18() 采集浏览器环境和页面行为 → 生成 x33～x84 明文 →
   * RC4 加密及自定义 Base64 编码 → 写入 localStorage.b1。
   *
   * 除 sdkVersion 是当前指纹脚本内的版本常量外，其余字段均由脚本在运行时生成；
   * 测试中的数值、空串和列表只是 cookie.txt 对应浏览器当次采集结果，不能直接用于其他环境。
   */
  const b1Options = {
    // 动态、环境相关，对应 x33；来源是 3.5.4 指纹 VM 的第一项独立环境探测结果，当前脚本未暴露更细的公开语义，本次 Chrome 样本为 0。
    environmentCheck1: 0,
    // 动态、环境相关，对应 x34；来源是 3.5.4 指纹 VM 的第二项独立环境探测结果，当前脚本未暴露更细的公开语义，本次 Chrome 样本为 0。
    environmentCheck2: 0,
    // 动态、环境相关，对应 x35；来源是 3.5.4 指纹 VM 的第三项独立环境探测结果，当前脚本未暴露更细的公开语义，本次 Chrome 样本为 0。
    environmentCheck3: 0,
    // 动态，对应 x36；直接读取 window.history.length，本次采集时当前标签页的历史记录长度为 6。
    historyLength: 6,
    // 动态、环境相关，对应 x37；指纹 VM 按固定顺序输出 24 项自动化和浏览器一致性探测，并使用“|”连接。差分已确认 navigator.webdriver、window.chrome、process/Electron、Cypress 等会改变其中的标志位。
    automationChecks: '0|0|0|0|0|0|0|0|0|1|0|0|1|0|0|0|0|1|1|0|0|0|0|0'.split('|'),
    // 动态、环境相关，对应 x38；指纹 VM 按固定顺序输出 39 项运行时能力探测，并使用“|”连接，来源包括浏览器构造器、DOM/Web API 及 Node/自动化对象是否存在；例如 Cypress 和 Buffer 差分会改变对应标志位。
    runtimeChecks: '0|0|1|0|1|0|0|0|0|0|1|0|1|0|1|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0'.split(
      '|',
    ),
    // 动态，对应 x39；实际来源是 localStorage.p1，而不是 DOM 页面状态。脚本生成指纹时维护该序号，本次样本写入 b1 的序号为 2。
    pageState: 2,
    // 当前脚本版本内固定，对应 x42；来源是 sbtsource 下发的指纹脚本内置版本号，脚本升级后会变化。
    sdkVersion: '3.5.4',
    // 动态、环境相关，对应 x43；来源是 Canvas 指纹采集函数。支持时写入采集结果，调用失败或能力不可用时写入具体原因，本次为 Canvas not supported。
    canvasFingerprint: 'Canvas not supported',
    // 动态，对应 x44；来源是生成本次指纹时的 Date.now() 毫秒时间戳，序列化到 b1 明文时转换为字符串。
    timestamp: 1785483345464,
    // 动态、页面环境相关，对应 x45；依次读取 window.__SEC_CAV__、__SEC_UD__、__SEC_BT__、__SEC_DP__、__SEC_ELECTRON__ 等安全组件或运行容器标记，再按“名称+值|”拼接。
    riskEnvironment: '__SEC_CAV__1-1-1-1-1|__SEC_UD__|__SEC_BT__|__SEC_DP__|__SEC_ELECTRON__|',
    // 动态，对应 x46；直接来源是 navigator.webdriver。真实 Chrome 为 false，差分设置为 true 后 x46 会同步变为 true。
    booleanEnvironmentCheck: false,
    // 动态、环境相关，对应 x48；来源是指纹 VM 的扩展环境探测结果。空串表示本次 Chrome 未采集到扩展信息，不是固定常量。
    extendedEnvironment: '',
    // 动态、环境相关，对应 x49；来源是指纹 VM 对目标对象列表及其类型的枚举摘要，格式固定为“{list:[...],type:...}”；本次没有枚举项。
    listTypeSummary: '{list:[],type:}',
    // 动态、运行时采样，对应 x50；来源是指纹 VM 的五项数值采样结果，使用英文逗号连接。采样不可用时可能为空，本次样本为五个采样值。
    renderSamples: [53, 117, 81, 64, 107],
    // 动态、环境相关，对应 x51；来源是指纹 VM 的第一组附加环境采集结果。空串表示本次未采集到，不是固定常量。
    additionalEnvironment1: '',
    // 动态、环境相关，对应 x52；来源是指纹 VM 的第二组附加环境采集结果。空串表示本次未采集到，不是固定常量。
    additionalEnvironment2: '',
    // 动态、页面相关，对应 x82；来源是指纹脚本初始化前后 window 全局属性名的差集，按“|”连接，因此会随页面模块、风控脚本和加载时序变化。
    globalVariableNames:
      '_AUuXfEG27Xa3x|CUSTOMER_SSO_LOGIN_GLOBAL_EMITTER|anti_hp_sign_config|__rap_app_id__|__rap_report__|__rap_last_sign_cost__|__rap_last_transform_cost__|__rap_hijack_installed__|_BHjFmfUMEtxhI|__setVerifyMsgBase64__|anti__hp__|__hp_creator_tab_state__|__SW_AB_GROUP__|MicroappMountContainer|spamTimer'.split(
        '|',
      ),
    // 动态、行为相关，对应 x84；来源是页面事件监听器和 Performance API 的累计摘要：mt.to 为 performance.timeOrigin，m/k/p/st 分别记录鼠标、键盘、页面及状态事件，ft 为事件间隔和页面时序统计。
    behaviorSummary:
      '{mt:{to:1785469849876.3},m:{mm:50,me:50,md:12,mu:12,c:14,cm:1},k:{},p:{ulr:0,ps:1,f:19,b:20,rs:14,sc:38},st:{h:0,f:0,kr:0},ft:{ae:2.5522282122866593,ak:9.264667912955618,cdr:0.07900719227043347,bf:{ar:2.2587064676616917,fr:4.9491306623209566},fi:934.2000000011176}}',
  };

  test('按固定顺序生成完整的 b1 明文', () => {
    expect(Object.keys(getXiaohongshushopArkB1Payload(b1Options))).toEqual([
      'x33',
      'x34',
      'x35',
      'x36',
      'x37',
      'x38',
      'x39',
      'x42',
      'x43',
      'x44',
      'x45',
      'x46',
      'x48',
      'x49',
      'x50',
      'x51',
      'x52',
      'x82',
      'x84',
    ]);
    expect(getXiaohongshushopArkB1Payload(b1Options).x44).toBe('1785483345464');
  });

  test('完整指纹字段生成的 b1 与浏览器样本一致', () => {
    const cookie = readFileSync(
      path.resolve(process.cwd(), 'test/media-platform/xiaohongshushop/cookie.txt'),
      'utf8',
    );
    const expectedB1 = cookie.match(/(?:^|;\s*)b1=([^;]+)/)?.[1];
    const b1=getXiaohongshushopArkB1(b1Options);
    console.log(b1,expectedB1);
    expect(expectedB1).toBeDefined();
    expect(b1).toBe(expectedB1);
  });

  test('没有行为采集结果时不写入可选字段', () => {
    const payload = getXiaohongshushopArkB1Payload({
      environmentCheck1: 0,
      environmentCheck2: 0,
      environmentCheck3: 0,
      historyLength: 1,
      automationChecks: [],
      runtimeChecks: [],
      pageState: 0,
      sdkVersion: '3.5.4',
      canvasFingerprint: 'Canvas not supported',
      timestamp: 1,
      riskEnvironment: '',
      booleanEnvironmentCheck: false,
      extendedEnvironment: '',
      listTypeSummary: '{list:[],type:}',
      renderSamples: [],
      additionalEnvironment1: '',
      additionalEnvironment2: '',
    });

    expect(payload).not.toHaveProperty('x82');
    expect(payload).not.toHaveProperty('x84');
  });
});
