'use strict'

const path = require('node:path')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const { spawn } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const { findExistingFfmpeg } = require('../media-hub/ffmpeg-provider')

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.mkv', '.webm', '.avi', '.flv', '.m4v'])
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])

class VideoCreator {
  /**
   * 自动生成爆款分镜脚本
   * @param {Object} options
   * @param {string} options.topic - 视频主题
   * @param {number} [options.targetDuration] - 预估总时长（秒），默认 15 秒
   */
  /**
   * 针对自媒体短视频的字幕智能断句与自动折行算法
   * 将长句子按标点符号与字数切分为 1~2 行短句，防止文字超出视频画面边界
   * @param {string} text - 原始字幕文案
   * @param {number} [maxCharsPerLine=13] - 单行最大汉字数
   * @returns {string} 带有标准换行符的精炼字幕
   */
  static formatSubtitleLines (text = '', maxCharsPerLine = 13) {
    if (!text || typeof text !== 'string') return ''
    const cleaned = text.replace(/[\r\n\t]+/g, ' ').replace(/['"\\:;]/g, '').trim()
    if (!cleaned) return ''

    if (cleaned.length <= maxCharsPerLine) {
      return cleaned
    }

    // 按中文和英文标点分割
    const tokens = cleaned.split(/([，。！？、,!?\s]+)/).filter(Boolean)
    const lines = []
    let currentLine = ''

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if ((currentLine + token).length <= maxCharsPerLine) {
        currentLine += token
      } else {
        if (currentLine) {
          lines.push(currentLine.trim())
          currentLine = ''
        }
        if (token.length <= maxCharsPerLine) {
          currentLine = token
        } else {
          for (let c = 0; c < token.length; c += maxCharsPerLine) {
            lines.push(token.slice(c, c + maxCharsPerLine))
          }
        }
      }
    }
    if (currentLine) lines.push(currentLine.trim())

    const validLines = lines.map(l => l.replace(/^[，。！？、,!?\s]+|[，。！？、,!?\s]+$/g, '')).filter(Boolean)
    // 自媒体短视频通常最多显示 2 行大字字幕
    return validLines.slice(0, 2).join('\n')
  }

  static generateStoryboard ({ topic, targetDuration = 15 }) {
    const safeTopic = (topic || '科技前沿探索').trim()

    const baseDurations = targetDuration === 30 ? [6, 10, 8, 6] : targetDuration === 60 ? [10, 20, 20, 10] : [4, 5, 4, 2]
    let accumulatedTime = 0
    const rawScenes = [
      {
        index: 1,
        title: '黄金前3秒钩子 (Hook)',
        voiceover: `关于【${safeTopic}】，90% 的自媒体人都做错了！`,
        visualPrompt: `醒目视觉冲击特写，大字标题呈现痛点`,
        durationSec: baseDurations[0]
      },
      {
        index: 2,
        title: '痛点剖析与反常识认知',
        voiceover: `盲目跟风不仅浪费时间，更会被算法判定为低质搬运，毫无流量。`,
        visualPrompt: `典型错误操作对比与数据下滑场景`,
        durationSec: baseDurations[1]
      },
      {
        index: 3,
        title: '高阶解法与实操拆解',
        voiceover: `记住这套高阶打法：利用精准素材重组，配合标准化生产闭环，快速破局！`,
        visualPrompt: `核心操作步骤展示，分步流程指引`,
        durationSec: baseDurations[2]
      },
      {
        index: 4,
        title: '行动引导与转化收尾',
        voiceover: `赶紧点赞收藏备用，在评论区留下你的问题，下期深度拆解！`,
        visualPrompt: `主页展示与关注引导动效卡片`,
        durationSec: baseDurations[3]
      }
    ]

    const scenes = rawScenes.map(s => {
      const sceneItem = {
        ...s,
        materialPath: '',
        startTime: accumulatedTime
      }
      accumulatedTime += s.durationSec
      return sceneItem
    })

    return {
      topic: safeTopic,
      targetDuration,
      scenes
    }
  }

  /**
   * 扫描并列出下载素材库与本地媒体素材
   * @param {Object} [options]
   * @param {string} [options.downloadDir] - 媒体嗅探下载目录
   * @param {string} [options.mediaDir] - 创作中心持久化媒体目录
   * @param {Array<string>} [options.extraDirs] - 额外扫描目录
   */
  static async listDownloadedMedia ({ downloadDir, mediaDir, extraDirs = [] } = {}) {
    const candidateDirs = [downloadDir, mediaDir, ...extraDirs].filter(Boolean)
    const list = []
    const seenPaths = new Set()

    for (const dir of candidateDirs) {
      if (!dir || typeof dir !== 'string') continue
      try {
        if (!fs.existsSync(dir)) continue
        const files = await fsp.readdir(dir)
        for (const file of files) {
          const fullPath = path.join(dir, file)
          if (seenPaths.has(fullPath)) continue

          try {
            const stat = await fsp.stat(fullPath)
            if (!stat.isFile()) continue

            const ext = path.extname(file).toLowerCase()
            const isVideo = VIDEO_EXTS.has(ext)
            const isImage = IMAGE_EXTS.has(ext)

            if (isVideo || isImage) {
              seenPaths.add(fullPath)
              list.push({
                id: `mat-${Buffer.from(fullPath).toString('base64url').slice(0, 16)}`,
                fileName: file,
                filePath: fullPath,
                type: isVideo ? 'video' : 'image',
                fileSize: stat.size,
                mtime: stat.mtimeMs,
                ext
              })
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    return list.sort((a, b) => b.mtime - a.mtime)
  }

  /**
   * 检测系统可用中文字体（用于 FFmpeg drawtext 滤镜）
   */
  static getAvailableSystemFont () {
    if (process.platform === 'win32') {
      const candidates = [
        'C:/Windows/Fonts/msyh.ttc',
        'C:/Windows/Fonts/msyhbd.ttc',
        'C:/Windows/Fonts/simhei.ttf',
        'C:/Windows/Fonts/arial.ttf'
      ]
      for (const p of candidates) {
        if (fs.existsSync(p)) return p
      }
    }
    return null
  }

  /**
   * 围绕 FFmpeg 和真实视频素材的高清视频渲染合成
   * @param {Object} options
   * @param {string} options.outputDir - 输出目录
   * @param {string} options.title - 视频标题
   * @param {Array<Object>} [options.scenes] - 分镜列表
   * @param {Array<string>} [options.materials] - 备选素材视频绝对路径列表
   * @param {number} [options.width] - 视频宽度（默认 1080）
   * @param {number} [options.height] - 视频高度（默认 1920，9:16 竖屏）
   * @param {boolean} [options.enableBlurBg] - 是否开启高斯模糊背景画幅填充（防止非 9:16 素材拉伸变形）
   * @param {boolean} [options.enableSubtitles] - 是否在画面上烙印分镜旁白大字字幕
   * @param {boolean} [options.antiDuplication] - 是否开启原创去重微调调色滤镜
   */
  static async renderVideo ({
    outputDir,
    title = '短视频成片',
    scenes = [],
    materials = [],
    width = 1080,
    height = 1920,
    enableBlurBg = true,
    enableSubtitles = true,
    antiDuplication = true
  }) {
    const ffmpegPath = findExistingFfmpeg()
    if (!ffmpegPath) {
      throw new Error('未检测到本地 FFmpeg 套件，无法执行视频渲染合成。请先执行 npm run prepare:ffmpeg')
    }

    await fsp.mkdir(outputDir, { recursive: true })
    const tempDir = path.join(outputDir, `.temp-${Date.now()}-${randomUUID().slice(0, 6)}`)
    await fsp.mkdir(tempDir, { recursive: true })

    const outFileName = `video-${Date.now()}-${randomUUID().slice(0, 6)}.mp4`
    const outputPath = path.join(outputDir, outFileName)

    // 若无分镜传入，根据默认规则生成四段分镜
    const activeScenes = scenes && scenes.length > 0 ? scenes : VideoCreator.generateStoryboard({ topic: title, targetDuration: 15 }).scenes

    // 过滤出存在的素材文件
    const validMaterials = (materials || []).filter(m => typeof m === 'string' && fs.existsSync(m))
    const fontPath = VideoCreator.getAvailableSystemFont()

    try {
      const renderedClips = []
      // 记录每个素材已切片消耗的累计时间，防止单素材切片时所有分镜重复从第0秒截取
      const materialOffsets = new Map()

      for (let i = 0; i < activeScenes.length; i++) {
        const scene = activeScenes[i]
        const clipDuration = Math.max(1, Number(scene.durationSec) || 3)
        const clipOutput = path.join(tempDir, `clip-${i}.mp4`)

        // 确定该分镜使用的素材：优先分镜自带 materialPath，若无则按顺序轮巡 validMaterials
        let targetMaterial = scene.materialPath && fs.existsSync(scene.materialPath) ? scene.materialPath : null
        if (!targetMaterial && validMaterials.length > 0) {
          targetMaterial = validMaterials[i % validMaterials.length]
        }

        const clipArgs = ['-y']

        if (targetMaterial) {
          // ====== A 方案：围绕真实下载素材展开的精准切片处理 ======
          // 智能计算时间戳：若分镜未指定或为0，自动根据该素材已截取时长顺延，保证每个分镜画面完全不同
          const currentOffset = materialOffsets.get(targetMaterial) || 0
          let startTime = 0
          if (scene.startTime !== undefined && Number(scene.startTime) > 0) {
            startTime = Number(scene.startTime)
          } else {
            startTime = currentOffset
          }
          materialOffsets.set(targetMaterial, startTime + clipDuration)

          // 工业级精准定位与切片参数：使用 -accurate_seek 并紧接 -ss -i -t，确保毫秒级切片生效且杜绝回跳第0秒
          clipArgs.push(
            '-accurate_seek',
            '-ss', String(startTime),
            '-i', targetMaterial,
            '-t', String(clipDuration)
          )

          // 构建复杂滤镜：画幅适配 + 高斯模糊填充 + 色彩微调 + 字幕
          let filterChain = ''
          if (enableBlurBg) {
            // 上下高斯模糊垫底，中间原比例清晰展示，完美适配 9:16 竖屏
            filterChain += `[0:v]split=2[fg][bg];`
            filterChain += `[bg]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=25:5[bg_blur];`
            filterChain += `[fg]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg_scaled];`
            filterChain += `[bg_blur][fg_scaled]overlay=(W-w)/2:(H-h)/2[base];`
          } else {
            filterChain += `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black[base];`
          }

          let lastLabel = 'base'

          // 去重微调色温与对比度
          if (antiDuplication) {
            filterChain += `[${lastLabel}]eq=contrast=1.03:saturation=1.06:brightness=0.01[graded];`
            lastLabel = 'graded'
          }

          // 字幕叠加（智能断句折行、动态自适应字号、textfile安全注入，彻底解决超出画面问题）
          const rawVoiceover = scene.voiceover || scene.title || ''
          const maxCharsPerLine = width >= 1400 ? 18 : 13
          const formattedSubtitle = VideoCreator.formatSubtitleLines(rawVoiceover, maxCharsPerLine)

          if (enableSubtitles && formattedSubtitle && fontPath) {
            // 将折行字幕写入临时 UTF-8 文件，避免特殊符号或引号破坏 filter 命令行语法
            const subFilePath = path.join(tempDir, `sub-${i}.txt`)
            await fsp.writeFile(subFilePath, formattedSubtitle, 'utf8')
            const escapedFont = fontPath.replace(/\\/g, '/').replace(/:/g, '\\:')
            const escapedSubFile = subFilePath.replace(/\\/g, '/').replace(/:/g, '\\:')

            // 根据最长行字符数动态计算安全字号，确保左右留出至少 12% 边距，绝不超出画面两端
            const maxLineLen = Math.max(...formattedSubtitle.split('\n').map(l => l.length))
            const fontSize = Math.min(46, Math.max(26, Math.floor((width * 0.82) / Math.max(maxLineLen, 10))))

            filterChain += `[${lastLabel}]drawtext=fontfile='${escapedFont}':textfile='${escapedSubFile}':fontsize=${fontSize}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=16:line_spacing=12:x=(w-text_w)/2:y=h-text_h-180[subtitled]`
            lastLabel = 'subtitled'
          } else {
            // 移除尾部多余的分号
            filterChain = filterChain.replace(/;$/, '')
          }

          clipArgs.push(
            '-filter_complex', filterChain,
            '-map', `[${lastLabel}]`,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-pix_fmt', 'yuv420p',
            '-r', '30'
          )

          // 音频处理：尝试直出原声或静音补充
          clipArgs.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100')
        } else {
          // ====== B 方案：兜底动态背景（优雅保证无素材时稳定秒级出片） ======
          const bgColors = ['0x111827', '0x1e1b4b', '0x0f172a', '0x172554']
          const color = bgColors[i % bgColors.length]
          clipArgs.push(
            '-f', 'lavfi',
            '-i', `color=c=${color}:s=${width}x${height}:d=${clipDuration}:r=30`,
            '-f', 'lavfi',
            '-i', `sine=frequency=440:duration=${clipDuration}`,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-shortest'
          )
        }

        clipArgs.push(clipOutput)

        // 执行单个片段生成
        await VideoCreator.execFfmpeg(ffmpegPath, clipArgs)
        if (fs.existsSync(clipOutput)) {
          renderedClips.push(clipOutput)
        }
      }

      if (renderedClips.length === 0) {
        throw new Error('分镜片段渲染生成失败，未能产出有效视频片段')
      }

      // ====== 2. 多片段合并（Concat Demuxer） ======
      if (renderedClips.length === 1) {
        await fsp.copyFile(renderedClips[0], outputPath)
      } else {
        const concatListFile = path.join(tempDir, 'concat.txt')
        const fileContent = renderedClips.map(clip => `file '${clip.replace(/\\/g, '/')}'`).join('\n')
        await fsp.writeFile(concatListFile, fileContent, 'utf8')

        const concatArgs = [
          '-y',
          '-f', 'concat',
          '-safe', '0',
          '-i', concatListFile,
          '-c', 'copy',
          outputPath
        ]

        await VideoCreator.execFfmpeg(ffmpegPath, concatArgs)
      }

      // 验证成片输出
      if (!fs.existsSync(outputPath)) {
        throw new Error('成片合并导出失败，最终文件未生成')
      }

      const stat = await fsp.stat(outputPath)
      const totalDuration = activeScenes.reduce((sum, s) => sum + (Number(s.durationSec) || 3), 0)

      return {
        ok: true,
        outputPath,
        fileName: outFileName,
        fileSize: stat.size,
        duration: totalDuration,
        width,
        height,
        sceneCount: activeScenes.length,
        usedMaterialCount: validMaterials.length
      }
    } finally {
      // 清理临时片段目录
      try {
        await fsp.rm(tempDir, { recursive: true, force: true })
      } catch (_) {}
    }
  }

  static execFfmpeg (ffmpegPath, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(ffmpegPath, args)
      let stderr = ''

      child.stderr.on('data', chunk => {
        stderr += chunk.toString()
      })

      child.on('error', err => {
        reject(new Error(`FFmpeg 执行进程异常: ${err.message}`))
      })

      child.on('close', code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg 退出失败 (代码 ${code}): ${stderr.slice(-350)}`))
        }
      })
    })
  }

  generateStoryboard (options) { return VideoCreator.generateStoryboard(options) }
  renderVideo (options) { return VideoCreator.renderVideo(options) }
  listDownloadedMedia (options) { return VideoCreator.listDownloadedMedia(options) }
}

module.exports = {
  VideoCreator
}
