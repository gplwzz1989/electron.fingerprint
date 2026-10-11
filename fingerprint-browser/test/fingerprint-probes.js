async function collectFingerprintSignals () {
  async function readNavigator () {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: [...navigator.languages],
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      webdriver: navigator.webdriver,
      hints: navigator.userAgentData ? await navigator.userAgentData.getHighEntropyValues(['fullVersionList', 'uaFullVersion', 'platform', 'platformVersion', 'architecture', 'bitness']) : null
    }
  }
  async function digest (bytes) {
    const hash = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('')
  }
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#123456'
  context.font = '14px sans-serif'
  context.fillText('指纹隔离测试', 1, 20)
  const canvasHashes = []
  for (let index = 0; index < 10; index++) canvasHashes.push(await digest(context.getImageData(0, 0, canvas.width, canvas.height).data))
  const audioContext = new OfflineAudioContext(1, 64, 44100)
  const buffer = await audioContext.startRendering()
  const samples = Array.from(buffer.getChannelData(0))
  const copied = new Float32Array(64)
  buffer.copyFromChannel(copied, 0)
  const range = document.createRange().getBoundingClientRect()
  const workerUrl = URL.createObjectURL(new Blob([`onmessage = async () => { try { postMessage({ ok: true, value: await (${readNavigator.toString()})() }) } catch { postMessage({ ok: false }) } }`], { type: 'text/javascript' }))
  const worker = new Worker(workerUrl)
  let workerSignals
  try {
    workerSignals = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('工作线程读取超时。')), 5000)
      worker.onmessage = event => {
        clearTimeout(timer)
        if (event.data.ok) resolve(event.data.value)
        else reject(new Error('工作线程读取失败。'))
      }
      worker.onerror = () => { clearTimeout(timer); reject(new Error('工作线程加载失败。')) }
      worker.postMessage(null)
    })
  } finally {
    worker.terminate()
    URL.revokeObjectURL(workerUrl)
  }
  return {
    origin: location.origin,
    secureContext: isSecureContext,
    navigator: await readNavigator(),
    worker: workerSignals,
    headers: await (await fetch('/headers')).json(),
    intlLocale: Intl.DateTimeFormat().resolvedOptions().locale,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: { width: screen.width, height: screen.height, dpr: devicePixelRatio, cssWidth: matchMedia(`(device-width: ${screen.width}px)`).matches, cssHeight: matchMedia(`(device-height: ${screen.height}px)`).matches },
    canvas: { hashes: canvasHashes, stable: new Set(canvasHashes).size === 1 },
    audio: { sampleRate: buffer.sampleRate, length: buffer.length, duration: buffer.duration, min: Math.min(...samples), max: Math.max(...samples), silent: samples.every(value => value === 0), copyMatches: samples.every((value, index) => value === copied[index]) },
    emptyRange: { x: range.x, y: range.y, width: range.width, height: range.height }
  }
}

async function collectWebRTCProbe (stunUrl) {
  if (typeof RTCPeerConnection !== 'function') return { supported: false, completed: false }
  const peer = new RTCPeerConnection({ iceServers: [{ urls: stunUrl }] })
  const candidates = []
  let errors = 0
  try {
    peer.onicecandidate = event => { if (event.candidate) candidates.push(event.candidate.candidate) }
    peer.onicecandidateerror = () => { errors++ }
    peer.createDataChannel('隔离验证')
    await peer.setLocalDescription(await peer.createOffer())
    const completed = await new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 4000)
      const finish = () => {
        if (peer.iceGatheringState === 'complete') { clearTimeout(timer); resolve(true) }
      }
      peer.addEventListener('icegatheringstatechange', finish)
      finish()
    })
    return { supported: true, completed, candidates, errors }
  } finally {
    peer.close()
  }
}

async function collectStorageSignals (marker = null) {
  if (marker !== null) localStorage.setItem('fp-marker', marker)
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('fp-isolation', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('markers')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('无法打开测试数据库。'))
    request.onblocked = () => reject(new Error('测试数据库被其他连接占用。'))
  })
  let databaseMarker
  try {
    databaseMarker = await new Promise((resolve, reject) => {
      const transaction = database.transaction('markers', marker === null ? 'readonly' : 'readwrite')
      const store = transaction.objectStore('markers')
      if (marker !== null) store.put(marker, 'fp-marker')
      const request = store.get('fp-marker')
      transaction.oncomplete = () => resolve(request.result ?? null)
      transaction.onerror = transaction.onabort = () => reject(new Error('测试数据库读写失败。'))
    })
  } finally { database.close() }
  const cache = await caches.open('fp-isolation')
  const key = new URL('/fp-cache-marker', location.origin).href
  if (marker !== null) await cache.put(key, new Response(marker))
  const cached = await cache.match(key)
  return { localStorage: localStorage.getItem('fp-marker'), indexedDB: databaseMarker, cacheStorage: cached ? await cached.text() : null }
}

module.exports = { collectFingerprintSignals, collectWebRTCProbe, collectStorageSignals }
