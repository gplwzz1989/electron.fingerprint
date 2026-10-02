const { app, BrowserWindow, session } = require('electron');
const fs = require('node:fs');

const targetUrl = process.env.FP_TEST_URL || 'https://browserleaks.com/client-hints';
const resultFile = process.env.FP_RESULT_FILE || `${__dirname}/fingerprint-result.json`;

const profile = {
  schemaVersion: 1,
  id: 'live-browserleaks-profile',
  enabled: true,
  browser: {
    family: 'Chrome',
    chromiumMajor: 138,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    acceptLanguage: 'zh-CN,zh;q=0.9'
  },
  locale: { language: 'zh-CN', languages: ['zh-CN', 'zh'], timezone: 'Asia/Shanghai' },
  hardware: { hardwareConcurrency: 8, deviceMemory: 8, platform: 'Win32' },
  screen: { width: 1440, height: 900, availWidth: 1440, availHeight: 860, deviceScaleFactor: 1.25 },
  graphics: { webglVendor: 'Google Inc. (Intel)', webglRenderer: 'ANGLE (Intel, fingerprint)' },
  noise: { seed: process.env.FP_SEED || 'live-browserleaks-seed', canvas: true, audio: true, rects: true },
  modules: {
    ua: true,
    clientHints: true,
    locale: true,
    timezone: true,
    navigator: true,
    screen: true,
    webgl: true,
    canvas: true,
    audio: true,
    fonts: true,
    webrtc: true
  }
};

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

async function collectPageSignals(webContents) {
  return webContents.executeJavaScript(`(async () => {
    const readPixels = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const gl = canvas.getContext('webgl');
      if (!gl) return null;
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      gl.clearColor(0.2, 0.4, 0.6, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const pixels = new Uint8Array(16);
      gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return {
        vendor: extension ? gl.getParameter(extension.UNMASKED_VENDOR_WEBGL) : null,
        renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null,
        pixels: Array.from(pixels)
      };
    };
    const canvasSignals = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 60;
      const context = canvas.getContext('2d');
      context.font = '16px Arial';
      context.fillText('fingerprint-live-test', 4, 28);
      return {
        dataUrl: canvas.toDataURL(),
        textWidth: context.measureText('fingerprint-live-test').width
      };
    };
    const rect = () => {
      const element = document.createElement('span');
      element.textContent = 'fingerprint-live-test';
      element.style.cssText = 'position:absolute;left:17px;top:23px;font:16px Arial';
      document.body.appendChild(element);
      const source = element.getBoundingClientRect();
      const value = {
        x: source.x,
        y: source.y,
        width: source.width,
        height: source.height,
        top: source.top,
        right: source.right,
        bottom: source.bottom,
        left: source.left
      };
      element.remove();
      return value;
    };
    const audio = async () => {
      if (!window.OfflineAudioContext) return null;
      const context = new OfflineAudioContext(1, 512, 44100);
      const oscillator = context.createOscillator();
      oscillator.frequency.value = 440;
      oscillator.connect(context.destination);
      oscillator.start();
      const buffer = await context.startRendering();
      const samples = Array.from(buffer.getChannelData(0));
      return {
        first: samples.slice(0, 16),
        sum: samples.reduce((total, sample) => total + sample, 0),
        samples
      };
    };
    const worker = await new Promise((resolve) => {
      const source = 'postMessage({ ua: navigator.userAgent, platform: navigator.platform, language: navigator.language })';
      const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
      const instance = new Worker(url);
      instance.onmessage = (event) => { resolve(event.data); instance.terminate(); URL.revokeObjectURL(url); };
      setTimeout(() => { resolve(null); instance.terminate(); URL.revokeObjectURL(url); }, 2000);
    });
    const peerConnection = new RTCPeerConnection({ iceServers: [] });
    const candidates = [];
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) candidates.push(event.candidate.candidate);
    };
    peerConnection.createDataChannel('fingerprint-live-test');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    peerConnection.close();
    const highEntropy = navigator.userAgentData
      ? await navigator.userAgentData.getHighEntropyValues(['uaFullVersion', 'platformVersion', 'architecture', 'bitness'])
      : null;
    const fonts = ['Arial', 'Times New Roman', 'Consolas', 'SimSun'].map((family) => ({
      family,
      width: document.fonts && document.fonts.check('16px ' + family)
    }));
    const pick = (id) => document.getElementById(id)?.textContent?.trim() || null;
    return {
      page: { title: document.title, url: location.href },
      website: {
        userAgent: pick('user-agent'),
        brands: pick('brands'),
        platform: pick('platform'),
        uaFullVersion: pick('uaFullVersion'),
        requestUserAgent: pick('http-user-agent'),
        requestClientHints: pick('http-sec-ch-ua')
      },
      navigator: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        webdriver: navigator.webdriver,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userAgentData: navigator.userAgentData ? {
          brands: navigator.userAgentData.brands,
          platform: navigator.userAgentData.platform,
          highEntropy
        } : null
      },
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      webgl: readPixels(),
      canvas: canvasSignals(),
      rect: rect(),
      audio: await audio(),
      fonts,
      worker,
      serviceWorker: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
      webrtc: candidates
    };
  })()`);
}

async function main() {
  await app.whenReady();
  const ses = session.fromPartition(`fingerprint-live-${Date.now()}`);
  ses.setFingerprintConfig(profile);
  const headers = [];
  ses.webRequest.onBeforeSendHeaders({ urls: [`${targetUrl}*`] }, (details, callback) => {
    headers.push({ url: details.url, requestHeaders: details.requestHeaders });
    callback({ requestHeaders: details.requestHeaders });
  });
  const window = new BrowserWindow({ show: false, webPreferences: { session: ses } });
  try {
    await window.loadURL(targetUrl);
    await wait(3000);
    const result = await collectPageSignals(window.webContents);
    result.headers = headers.filter((item) => item.url === targetUrl || item.url.startsWith(`${targetUrl}?`));
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`FP_RESULT_FILE=${resultFile}`);
    console.log(`FP_RESULT=${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`FP_TEST_ERROR=${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    window.destroy();
    app.quit();
  }
}

main();
