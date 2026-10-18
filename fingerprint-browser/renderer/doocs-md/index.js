'use strict'

const { DOOCS_THEMES } = require('./themes')
const { DoocsParser } = require('./parser')
const { DoocsInliner } = require('./inliner')
const { copyWechatHtmlToClipboard } = require('./clipboard')

module.exports = {
  DOOCS_THEMES,
  DoocsParser,
  DoocsInliner,
  copyWechatHtmlToClipboard
}
