;(function (root) {
  'use strict'
  const definitions = {
  "version": "2026-10-27",
  "environmentManagementTabs": [
    ["环境管理", "environments"],
    ["指纹管理", "fingerprints"],
    ["代理管理", "proxies"]
  ],
  "nav": [
    {
      "id": "overview",
      "title": "工作台",
      "icon": "grid",
      "group": "工作空间"
    },
    {
      "id": "environments",
      "title": "浏览器环境管理",
      "icon": "browser",
      "group": "核心资源"
    },
    {
      "id": "accounts",
      "title": "账号管理",
      "icon": "users"
    },
    {
      "id": "members",
      "title": "团队成员",
      "icon": "team",
      "group": "团队与服务"
    },
    {
      "id": "billing",
      "title": "订阅与用量",
      "icon": "card"
    },
    {
      "id": "settings",
      "title": "设置",
      "icon": "settings"
    }
  ],
  "pages": [
    {
      "id": "overview",
      "title": "工作台",
      "nav": "overview",
      "kind": "dashboard",
      "description": "从可复用指纹开始，管理独立环境、代理连接与平台账号。",
      "actions": [
        {
          "label": "新建环境",
          "target": "environment-create",
          "primary": true,
          "disabled": false
        }
      ],
      "tiles": [
        {
          "title": "创建可复用指纹",
          "text": "只管理浏览器指纹参数，保存后可跨设备使用。",
          "icon": "fingerprint",
          "target": "fingerprint-create"
        },
        {
          "title": "建立浏览器环境",
          "text": "选择指纹，设置名称、启动网址与代理。",
          "icon": "browser",
          "target": "environment-create"
        },
        {
          "title": "添加平台账号",
          "text": "选择系统支持的平台，在独立环境中完成授权。",
          "icon": "users",
          "target": "account-platforms"
        }
      ],
      "table": {
        "columns": [
          "环境名称",
          "指纹版本",
          "代理连接",
          "运行状态",
          "操作"
        ],
        "emptyTitle": "暂无最近使用的环境",
        "emptyText": "创建环境后，可在这里快速进入最近使用的业务。",
        "action": {
          "label": "新建环境",
          "target": "environment-create",
          "primary": true,
          "disabled": false
        }
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "fingerprints",
      "title": "指纹管理",
      "nav": "fingerprints",
      "kind": "list",
      "description": "指纹独立于代理和业务环境保存，可在团队内复用，并在其他设备使用。",
      "actions": [
        {
          "label": "创建指纹",
          "target": "fingerprint-create",
          "primary": true,
          "disabled": false
        }
      ],
      "filters": [
        "平台类型"
      ],
      "table": {
        "columns": [
          "指纹名称 / 版本",
          "浏览器 / 系统",
          "语言 / 时区",
          "引用环境",
          "更新时间",
          "操作"
        ],
        "emptyTitle": "还没有可复用的指纹",
        "emptyText": "创建并保存浏览器指纹，再在环境中引用。",
        "action": {
          "label": "创建指纹",
          "target": "fingerprint-create",
          "primary": true,
          "disabled": false
        }
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "fingerprint-create",
      "title": "创建指纹",
      "nav": "fingerprints",
      "kind": "form",
      "description": "已填入系统默认参数，可生成自洽组合；保存后存入团队指纹数据库。",
      "tabs": [
        [
          "基础参数",
          "fingerprint-create"
        ],
        [
          "图形与保护",
          "fingerprint-protection"
        ]
      ],
      "groups": [
        {
          "title": "浏览器身份",
          "fields": [
            {
              "label": "指纹名称 *",
              "type": "text",
              "placeholder": "输入便于识别的名称",
              "full": false,
              "profilePath": "name"
            },
            {
              "label": "平台类型 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "Windows",
                  "value": "Win32"
                },
                {
                  "label": "macOS",
                  "value": "MacIntel"
                },
                {
                  "label": "Linux",
                  "value": "Linux x86_64"
                }
              ],
              "profilePath": "hardware.platform"
            },
            {
              "label": "浏览器标识 *",
              "type": "text",
              "placeholder": "自动匹配内核的浏览器标识",
              "full": false,
              "profilePath": "browser.userAgent"
            },
            {
              "label": "内核主版本 *",
              "type": "text",
              "placeholder": "选择当前兼容的内核版本",
              "full": false,
              "profilePath": "browser.chromiumMajor",
              "readonly": true
            }
          ],
          "description": ""
        },
        {
          "title": "语言与时区",
          "fields": [
            {
              "label": "主要语言 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "简体中文",
                  "value": "zh-CN"
                },
                {
                  "label": "英语",
                  "value": "en-US"
                },
                {
                  "label": "日语",
                  "value": "ja-JP"
                }
              ],
              "profilePath": "locale.language"
            },
            {
              "label": "语言列表 *",
              "type": "text",
              "placeholder": "按优先级选择语言",
              "full": false,
              "profilePath": "locale.languages"
            },
            {
              "label": "时区 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "Asia/Shanghai",
                "Asia/Tokyo",
                "America/New_York",
                "Europe/London",
                "UTC"
              ],
              "help": "选择指纹自身的时区，不从代理自动写入。",
              "profilePath": "locale.timezone"
            },
            {
              "label": "请求语言",
              "type": "text",
              "profilePath": "browser.acceptLanguage",
              "placeholder": "按语言优先级生成"
            }
          ],
          "description": ""
        },
        {
          "title": "硬件与屏幕",
          "fields": [
            {
              "label": "处理器线程数 *",
              "type": "number",
              "placeholder": "填写线程数",
              "full": false,
              "profilePath": "hardware.hardwareConcurrency"
            },
            {
              "label": "设备内存 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                                {"label": "1 GB", "value": "1"},
                {"label": "2 GB", "value": "2"},
                {"label": "4 GB", "value": "4"},
                {"label": "8 GB", "value": "8"}
              ],
              "profilePath": "hardware.deviceMemory"
            },
            {
              "label": "屏幕宽度 *",
              "type": "number",
              "placeholder": "像素",
              "full": false,
              "profilePath": "screen.width"
            },
            {
              "label": "屏幕高度 *",
              "type": "number",
              "placeholder": "像素",
              "full": false,
              "profilePath": "screen.height"
            },
            {
              "label": "设备缩放比例 *",
              "type": "number",
              "placeholder": "填写缩放比例",
              "full": false,
              "profilePath": "screen.deviceScaleFactor"
            },
            {
              "label": "可用屏幕宽度",
              "type": "number",
              "profilePath": "screen.availWidth"
            },
            {
              "label": "可用屏幕高度",
              "type": "number",
              "profilePath": "screen.availHeight"
            }
          ],
          "description": "配置线程数、内存、屏幕与缩放比例。生成兼容参数后也可在此调整。",
          "collapsible": true
        }
      ],
      "summary": {
        "title": "指纹摘要",
        "rows": [
          [
            "平台类型",
            "Windows"
          ],
          [
            "内核版本",
            "138"
          ],
          [
            "主要语言",
            "zh-CN"
          ],
          [
            "时区",
            "Asia/Shanghai"
          ],
          [
            "存储位置",
            "服务端数据库"
          ]
        ],
        "text": "配置检查不替代设备兼容性检查。数据库保存成功后才进入指纹列表。"
      },
      "footer": [
        {
          "label": "返回列表",
          "target": "fingerprints",
          "primary": false,
          "disabled": false
        },
        {
          "label": "保存到指纹库",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "actions": [
        {
          "label": "生成自洽参数",
          "action": "generate-fingerprint"
        }
      ],
      "footerHint": "登录后保存到团队指纹库。"
    },
    {
      "id": "fingerprint-protection",
      "title": "图形与保护",
      "nav": "fingerprints",
      "kind": "form",
      "description": "与基础参数共用一份指纹草稿，按分类调整图形与保护设置。",
      "tabs": [
        [
          "基础参数",
          "fingerprint-create"
        ],
        [
          "图形与保护",
          "fingerprint-protection"
        ]
      ],
      "groups": [
        {
          "title": "图形标识",
          "fields": [
            {
              "label": "图形厂商 *",
              "type": "text",
              "placeholder": "填写真实兼容的厂商值",
              "full": false,
              "profilePath": "graphics.webglVendor"
            },
            {
              "label": "图形渲染器 *",
              "type": "text",
              "placeholder": "填写真实兼容的渲染器值",
              "full": false,
              "profilePath": "graphics.webglRenderer"
            }
          ],
          "description": ""
        },
        {
          "title": "稳定噪声",
          "fields": [
            {
              "label": "噪声种子 *",
              "type": "text",
              "placeholder": "由 SaaS 服务端生成，保存时确定",
              "readonly": true,
              "full": false,
              "profilePath": "noise.seed"
            },
            {
              "label": "画布保护",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "开启",
                  "value": "true"
                },
                {
                  "label": "关闭",
                  "value": "false"
                }
              ],
              "profilePath": "noise.canvas"
            },
            {
              "label": "音频保护",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "开启",
                  "value": "true"
                },
                {
                  "label": "关闭",
                  "value": "false"
                }
              ],
              "profilePath": "noise.audio"
            },
            {
              "label": "布局测量保护",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "开启",
                  "value": "true"
                },
                {
                  "label": "关闭",
                  "value": "false"
                }
              ],
              "profilePath": "noise.rects"
            }
          ],
          "description": ""
        },
        {
          "title": "模块开关",
          "fields": [
            {
              "label": "字体保护",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "开启",
                  "value": "true"
                },
                {
                  "label": "关闭",
                  "value": "false"
                }
              ],
              "profilePath": "modules.fonts"
            },
            {
              "label": "实时通信保护",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "开启",
                  "value": "true"
                },
                {
                  "label": "关闭",
                  "value": "false"
                }
              ],
              "profilePath": "modules.webrtc"
            },
            {
              "label": "用户代理提示",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {
                  "label": "开启",
                  "value": "true"
                },
                {
                  "label": "关闭",
                  "value": "false"
                }
              ],
              "profilePath": "modules.clientHints"
            },
            {
              "profilePath": "modules.screen",
              "label": "屏幕与硬件覆盖",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                {"label":"开启","value":"true"},
                {"label":"关闭","value":"false"}
              ]
            }
          ],
          "description": "按需调整能力开关，收起后保留已填写内容。",
          "collapsible": true
        }
      ],
      "summary": {
        "title": "跨设备使用",
        "rows": [
          [
            "参数来源",
            "系统默认配置"
          ],
          [
            "规则检查",
            "随修改校验"
          ],
          [
            "存储位置",
            "服务端数据库"
          ]
        ],
        "text": "参数可复用；目标设备必须通过内核、平台与能力兼容检查。"
      },
      "footer": [
        {
          "label": "上一步",
          "target": "fingerprint-create",
          "primary": false,
          "disabled": false
        },
        {
          "label": "保存到指纹库",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "请登录后完成保存。",
      "actions": [
        {
          "label": "生成自洽参数",
          "action": "generate-fingerprint"
        }
      ]
    },
    {
      "id": "fingerprint-detail",
      "title": "指纹详情",
      "nav": "fingerprints",
      "kind": "details",
      "description": "查看服务端保存的指纹参数、版本与引用关系。",
      "groups": [
        {
          "title": "指纹版本",
          "fields": [
            {
              "label": "指纹名称",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "版本",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "配置协议",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "更新时间",
              "type": "text",
              "placeholder": "",
              "full": false
            }
          ],
          "description": ""
        },
        {
          "title": "指纹参数",
          "fields": [
            {
              "label": "浏览器与系统",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "语言与时区",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "硬件与屏幕",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "图形与保护",
              "type": "text",
              "placeholder": "",
              "full": false
            }
          ],
          "description": ""
        }
      ],
      "summary": {
        "title": "环境引用",
        "rows": [
          [
            "引用环境",
            "—"
          ],
          [
            "当前版本",
            "—"
          ]
        ],
        "text": "新版本不会自动覆盖已创建环境的快照。"
      },
      "actions": [
        {
          "label": "返回指纹列表",
          "target": "fingerprints",
          "primary": false,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "fingerprint-compatibility",
      "title": "指纹兼容性检查",
      "nav": "fingerprints",
      "kind": "state",
      "description": "在其他设备使用指纹前，检查实际内核、平台和能力是否匹配。",
      "notice": {
        "title": "当前设备尚不能使用该指纹",
        "text": "请使用兼容设备，或创建适合当前设备的新指纹。已有指纹不会被自动修改。",
        "tone": "error"
      },
      "rows": [
        [
          "指纹目标平台",
          "—"
        ],
        [
          "当前设备平台",
          "—"
        ],
        [
          "所需内核能力",
          "—"
        ],
        [
          "检测结果",
          "—"
        ]
      ],
      "steps": [
        [
          "选择其他指纹",
          "使用已经通过当前设备检查的配置。"
        ],
        [
          "创建兼容指纹",
          "保留原指纹，并独立生成适合当前设备的新配置。"
        ]
      ],
      "actions": [
        {
          "label": "返回指纹列表",
          "target": "fingerprints",
          "primary": false,
          "disabled": false
        },
        {
          "label": "创建兼容指纹",
          "target": "fingerprint-create",
          "primary": true,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "environments",
      "title": "浏览器环境",
      "nav": "environments",
      "kind": "list",
      "description": "环境引用可复用指纹，独立保存会话，并设置名称、启动网址和代理。",
      "actions": [
        {
          "label": "新建环境",
          "target": "environment-create",
          "primary": true,
          "disabled": false
        }
      ],
      "filters": [
        "运行状态",
        "代理连接"
      ],
      "table": {
        "columns": [
          "环境名称",
          "指纹 / 版本",
          "代理连接",
          "运行状态",
          "更新时间",
          "操作"
        ],
        "emptyTitle": "还没有浏览器环境",
        "emptyText": "选择已有指纹即可快速建立环境；也可以从创建指纹开始。",
        "action": {
          "label": "新建环境",
          "target": "environment-create",
          "primary": true,
          "disabled": false
        }
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "environment-create",
      "title": "新建浏览器环境",
      "nav": "environments",
      "kind": "form",
      "description": "填写名称，选择已有指纹，按需设置网络即可创建。",
      "groups": [
        {
          "title": "基本信息",
          "fields": [
            {
              "label": "环境名称 *",
              "type": "text",
              "placeholder": "输入环境名称",
              "full": false
            },
            {
              "label": "启动网址",
              "type": "url",
              "placeholder": "https://",
              "full": false
            }
          ],
          "description": ""
        },
        {
          "title": "复用指纹",
          "fields": [
            {
              "label": "指纹 *",
              "type": "select",
              "placeholder": "",
              "full": true,
              "options": [
                "选择已保存的指纹"
              ],
              "help": "使用已保存版本；没有合适的配置时可新建指纹。"
            }
          ],
          "description": "使用已保存的指纹版本，无需重复配置参数。",
          "action": {
            "label": "新建指纹",
            "target": "fingerprint-create"
          }
        },
        {
          "title": "网络连接",
          "fields": [
            {
              "label": "连接方式 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "不使用代理",
                "选择已有代理"
              ],
              "help": "明确选择直连，或使用已检测的团队代理。"
            },
            {
              "label": "代理资源",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "请选择代理"
              ],
              "help": "选择后重新检测连通性和出口时区。"
            }
          ],
          "description": "",
          "action": {
            "label": "添加代理",
            "target": "proxy-create"
          }
        }
      ],
      "summary": {
        "title": "环境摘要",
        "rows": [
          [
            "环境名称",
            "未填写"
          ],
          [
            "已选指纹",
            "未选择"
          ],
          [
            "指纹兼容性",
            "等待检查"
          ],
          [
            "代理连接",
            "不使用代理"
          ],
          [
            "时区一致性",
            "等待检测"
          ]
        ],
        "text": "保存前校验配置；启动时再检查本机兼容性。"
      },
      "footer": [
        {
          "label": "返回环境列表",
          "target": "environments",
          "primary": false,
          "disabled": false
        },
        {
          "label": "创建环境",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "environment-detail",
      "title": "环境详情",
      "nav": "environments",
      "kind": "details",
      "description": "管理环境基础信息，查看锁定的指纹版本、代理和会话状态。",
      "groups": [
        {
          "title": "环境信息",
          "fields": [
            {
              "label": "环境名称",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "启动网址",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "数据位置",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "运行设备",
              "type": "text",
              "placeholder": "",
              "full": false
            }
          ],
          "description": ""
        },
        {
          "title": "资源引用",
          "fields": [
            {
              "label": "指纹与版本",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "代理资源",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "连接检测",
              "type": "text",
              "placeholder": "",
              "full": false
            },
            {
              "label": "时区一致性",
              "type": "text",
              "placeholder": "",
              "full": false
            }
          ],
          "description": ""
        }
      ],
      "summary": {
        "title": "会话隔离",
        "rows": [
          [
            "浏览数据",
            "按环境隔离"
          ],
          [
            "指纹版本",
            "创建时锁定"
          ]
        ],
        "text": "同一指纹可以被多个环境引用，环境登录数据不会因此共享。"
      },
      "actions": [
        {
          "label": "返回环境列表",
          "target": "environments",
          "primary": false,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "timezone-conflict",
      "title": "时区差异提示",
      "nav": "environments",
      "kind": "state",
      "description": "代理出口时区与已选指纹时区不一致，需要你选择处理方式。",
      "notice": {
        "title": "指纹与代理的时区不一致",
        "text": "直接继续会保留差异。系统不会修改指纹库中正在复用的配置。",
        "tone": "warning"
      },
      "rows": [
        [
          "已选指纹时区",
          "—"
        ],
        [
          "代理出口时区",
          "—"
        ],
        [
          "检测时间",
          "—"
        ]
      ],
      "steps": [
        [
          "选择匹配时区的指纹",
          "从指纹列表选择与代理出口一致的配置。"
        ],
        [
          "创建新的指纹",
          "基于当前参数创建独立指纹，并使用检测到的出口时区。"
        ],
        [
          "明确保留当前选择",
          "确认已知差异后继续；共享指纹保持原样。"
        ]
      ],
      "actions": [
        {
          "label": "重新选择指纹",
          "target": "environment-create",
          "primary": false,
          "disabled": false
        },
        {
          "label": "创建新指纹",
          "target": "fingerprint-create",
          "primary": true,
          "disabled": false
        }
      ],
      "acknowledge": "我已了解时区差异，保留当前指纹配置",
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "proxies",
      "title": "代理管理",
      "nav": "proxies",
      "kind": "list",
      "description": "添加代理时检查可用性和连通性，检测结果可供浏览器环境引用。",
      "actions": [
        {
          "label": "添加代理",
          "target": "proxy-create",
          "primary": true,
          "disabled": false
        }
      ],
      "filters": [
        "协议类型",
        "检测状态"
      ],
      "table": {
        "columns": [
          "代理名称",
          "协议 / 地址",
          "连通性",
          "出口时区",
          "引用环境",
          "操作"
        ],
        "emptyTitle": "尚未添加代理",
        "emptyText": "填写代理信息并通过实际连接检查后，即可在环境中选择。",
        "action": {
          "label": "添加代理",
          "target": "proxy-create",
          "primary": true,
          "disabled": false
        }
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "proxy-create",
      "title": "添加代理",
      "nav": "proxies",
      "kind": "form",
      "description": "填写连接信息，检测通过后才能保存。",
      "groups": [
        {
          "title": "连接信息",
          "fields": [
            {
              "label": "代理名称 *",
              "type": "text",
              "placeholder": "输入代理名称",
              "full": false
            },
            {
              "label": "协议 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "选择协议",
                "HTTP / HTTPS",
                "SOCKS5"
              ]
            },
            {
              "label": "服务器地址 *",
              "type": "text",
              "placeholder": "主机名或 IP 地址",
              "full": false
            },
            {
              "label": "端口 *",
              "type": "number",
              "placeholder": "端口号",
              "full": false
            }
          ],
          "description": ""
        },
        {
          "title": "认证信息",
          "fields": [
            {
              "label": "用户名",
              "type": "text",
              "placeholder": "如代理要求认证，请填写",
              "full": false
            },
            {
              "label": "密码",
              "type": "password",
              "placeholder": "代理密码",
              "full": false
            }
          ],
          "description": ""
        }
      ],
      "summary": {
        "title": "连接检测",
        "rows": [
          [
            "代理可用性",
            "未检测"
          ],
          [
            "实际连通性",
            "未检测"
          ],
          [
            "出口地址",
            "—"
          ],
          [
            "出口时区",
            "—"
          ]
        ],
        "text": "未检测或检测失败不能保存为可用代理。环境选择代理时会重新检测。"
      },
      "footer": [
        {
          "label": "取消",
          "closeDialog": true
        },
        {
          "label": "检测并保存",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "请登录后检测连接并保存。",
      "presentation": "modal",
      "modalParent": "proxies"
    },
    {
      "id": "proxy-failure",
      "title": "代理连接失败",
      "nav": "proxies",
      "kind": "state",
      "description": "保留已填写的信息，修复后重新执行连接检查。",
      "notice": {
        "title": "未能连接代理",
        "text": "请检查协议、地址、端口和认证信息。检测失败的代理不会被标记为可用。",
        "tone": "error"
      },
      "rows": [
        [
          "可用性检测",
          "未通过"
        ],
        [
          "连通性检测",
          "未通过"
        ],
        [
          "出口时区",
          "未获取"
        ]
      ],
      "steps": [
        [
          "核对连接信息",
          "确认协议、服务器地址与端口填写正确。"
        ],
        [
          "检查认证与服务状态",
          "确认代理账户有效，服务允许当前设备访问。"
        ]
      ],
      "actions": [
        {
          "label": "返回代理设置",
          "target": "proxy-create",
          "primary": true,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "accounts",
      "title": "账号管理",
      "nav": "accounts",
      "kind": "list",
      "description": "统一查看平台身份、授权状态与所属浏览器环境。",
      "actions": [
        {
          "label": "添加账号",
          "target": "account-platforms",
          "primary": true,
          "disabled": false
        }
      ],
      "filters": [
        "全部平台",
        "授权状态",
        "所属环境"
      ],
      "table": {
        "columns": [
          "账号信息",
          "授权状态",
          "所属环境",
          "最近校验",
          "操作"
        ],
        "emptyTitle": "尚未添加平台账号",
        "emptyText": "选择系统已支持的平台，在指定环境中登录并完成身份校验。",
        "action": {
          "label": "添加账号",
          "target": "account-platforms",
          "primary": true,
          "disabled": false
        }
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "account-platforms",
      "title": "添加账号",
      "nav": "accounts",
      "kind": "platforms",
      "description": "请选择需要授权的平台。",
      "platforms": [
        {
          "name": "微信公众号",
          "status": "暂不可用",
          "disabled": true,
          "key": "wechat",
          "icon": "assets/platforms/wechat.png"
        },
        {
          "name": "抖音",
          "status": "暂不可用",
          "disabled": true,
          "key": "douyin",
          "icon": "assets/platforms/douyin.png"
        },
        {
          "name": "新浪微博",
          "status": "暂不可用",
          "disabled": true,
          "key": "weibo",
          "icon": "assets/platforms/weibo.png"
        }
      ],
      "footnote": "当前没有开放授权的平台，请稍后再试。",
      "footerHint": "请登录后完成保存。",
      "presentation": "modal"
    },
    {
      "id": "account-authorize",
      "title": "授权平台账号",
      "nav": "accounts",
      "kind": "authorize",
      "description": "选择独立环境后登录平台，确认身份并保存授权。",
      "groups": [
        {
          "title": "选择授权环境",
          "fields": [
            {
              "label": "授权平台",
              "type": "display",
              "full": false
            },
            {
              "label": "浏览器环境 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "选择独立浏览器环境"
              ],
              "help": "仅显示当前团队有权限使用的环境。"
            }
          ],
          "description": "",
          "action": {
            "label": "新建环境",
            "target": "environment-create"
          }
        }
      ],
      "steps": [],
      "summary": {
        "title": "授权检查",
        "rows": [
          [
            "当前阶段",
            "准备授权"
          ],
          [
            "平台身份",
            "未读取"
          ],
          [
            "会话校验",
            "未执行"
          ],
          [
            "服务端保存",
            "未完成"
          ]
        ],
        "text": "关闭登录窗口不代表授权成功。请等待系统完成身份校验和保存。"
      },
      "footer": [
        {
          "label": "更换平台",
          "target": "account-platforms"
        },
        {
          "label": "打开平台登录",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "请先选择平台与浏览器环境。",
      "authorizationStage": 0,
      "notice": {
        "title": "先选择平台与浏览器环境",
        "text": "登录只在选定环境中进行。完成后须确认平台身份，并等待服务端保存。",
        "tone": "info"
      }
    },
    {
      "id": "account-reauthorize",
      "title": "更新账号授权",
      "nav": "accounts",
      "kind": "state",
      "description": "为已有平台账号恢复有效授权，保留账号标识与业务归属。",
      "notice": {
        "title": "账号需要重新授权",
        "text": "请登录原平台账号。重新授权完成后，系统会校验身份并更新会话。",
        "tone": "warning"
      },
      "rows": [
        [
          "平台",
          "—"
        ],
        [
          "原平台账号标识",
          "—"
        ],
        [
          "当前授权状态",
          "待重新授权"
        ]
      ],
      "steps": [
        [
          "登录原账号",
          "在该账号绑定的独立环境中完成平台验证。"
        ],
        [
          "确认身份一致",
          "新会话的账号标识必须与原记录一致。"
        ],
        [
          "更新并校验",
          "服务端保存成功后才更新有效状态。"
        ]
      ],
      "actions": [
        {
          "label": "返回账号列表",
          "target": "accounts",
          "primary": false,
          "disabled": false
        },
        {
          "label": "开始重新授权",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "account-mismatch",
      "title": "授权身份不一致",
      "nav": "accounts",
      "kind": "state",
      "description": "重新授权时登录了不同的平台账号，原账号记录保持不变。",
      "notice": {
        "title": "登录账号与待更新账号不一致",
        "text": "请切换回原平台账号，或通过添加账号流程建立新的账号记录。",
        "tone": "error"
      },
      "rows": [
        [
          "原账号标识",
          "—"
        ],
        [
          "本次识别标识",
          "—"
        ],
        [
          "原会话",
          "保留"
        ]
      ],
      "actions": [
        {
          "label": "重新授权",
          "target": "account-reauthorize",
          "primary": true,
          "disabled": false
        },
        {
          "label": "添加另一个账号",
          "target": "account-platforms",
          "primary": false,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "members",
      "title": "团队成员",
      "nav": "members",
      "kind": "list",
      "description": "查看当前团队成员，按角色和资源范围管理访问权限。",
      "actions": [
        {
          "label": "邀请成员",
          "target": "member-invite",
          "primary": true,
          "disabled": false
        }
      ],
      "filters": [
        "角色"
      ],
      "table": {
        "columns": [
          "成员",
          "角色",
          "资源范围",
          "成员状态",
          "邮箱",
          "操作"
        ],
        "emptyTitle": "尚无可显示的团队成员",
        "emptyText": "登录并进入团队后，可查看真实成员和管理权限。",
        "action": null
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "member-invite",
      "title": "邀请团队成员",
      "nav": "members",
      "kind": "form",
      "description": "创建七天内有效的邀请链接；成员加入后再分配资源权限。",
      "groups": [
        {
          "title": "成员信息",
          "fields": [
            {
              "label": "成员邮箱 *",
              "type": "email",
              "placeholder": "输入受邀成员邮箱",
              "full": false
            },
            {
              "label": "角色 *",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "选择角色",
                "管理员",
                "操作成员",
                "只读成员"
              ]
            }
          ],
          "description": ""
        }
      ],
      "summary": {
        "title": "授权规则",
        "rows": [
          [
            "默认范围",
            "不自动扩大"
          ],
          [
            "权限校验",
            "服务端执行"
          ]
        ],
        "text": "邀请者只能授予自己有权管理的资源。所有者的关键权限不可转授给普通成员。"
      },
      "footer": [
        {
          "label": "返回团队成员",
          "target": "members",
          "primary": false,
          "disabled": false
        },
        {
          "label": "创建邀请",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "链接只允许指定邮箱的账户使用。"
    },
    {
      "id": "member-permissions",
      "title": "成员权限",
      "nav": "members",
      "kind": "permissions",
      "description": "管理模块操作权限与资源范围，权限在服务端统一执行。",
      "permissionColumns": [
        "权限",
        "所有者",
        "管理员",
        "操作成员",
        "只读成员"
      ],
      "permissionRows": [
        [
          "查看授权资源",
          "允许",
          "允许",
          "按授权",
          "按授权"
        ],
        [
          "创建指纹与环境",
          "允许",
          "按授权",
          "按授权",
          "禁止"
        ],
        [
          "管理代理与账号",
          "允许",
          "按授权",
          "按授权",
          "禁止"
        ],
        [
          "管理团队成员",
          "允许",
          "按授权",
          "禁止",
          "禁止"
        ],
        [
          "订阅与付款",
          "允许",
          "按授权",
          "禁止",
          "禁止"
        ]
      ],
      "notice": {
        "title": "角色与资源范围同时生效",
        "text": "角色决定可执行的操作，资源范围决定可访问的对象。",
        "tone": "info"
      },
      "actions": [
        {
          "label": "返回团队成员",
          "target": "members",
          "primary": false,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "billing",
      "title": "订阅与用量",
      "nav": "billing",
      "kind": "billing",
      "description": "查看当前订阅权益、实际用量和订单，按需续费或变更套餐。",
      "tabs": [
        [
          "订阅与用量",
          "billing"
        ],
        [
          "选择套餐",
          "plans"
        ],
        [
          "付款",
          "payment"
        ]
      ],
      "rows": [
        [
          "当前订阅",
          "—"
        ],
        [
          "有效期",
          "—"
        ],
        [
          "指纹用量",
          "—"
        ],
        [
          "环境用量",
          "—"
        ],
        [
          "账号用量",
          "—"
        ],
        [
          "成员席位",
          "—"
        ]
      ],
      "notice": {
        "title": "订阅状态以团队记录为准",
        "text": "用量来自实际资源记录；支付通道配置并验收后才可购买套餐。",
        "tone": "info"
      },
      "table": {
        "columns": [
          "订单",
          "套餐",
          "金额",
          "付款方式",
          "状态"
        ],
        "emptyTitle": "暂无订单",
        "emptyText": "完成付款后，订单和权益记录会显示在这里。",
        "action": null
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "plans",
      "title": "选择套餐",
      "nav": "billing",
      "kind": "plans",
      "description": "选择适合当前团队的套餐；价格与权益以服务端报价为准。",
      "tabs": [
        [
          "订阅与用量",
          "billing"
        ],
        [
          "选择套餐",
          "plans"
        ],
        [
          "付款",
          "payment"
        ]
      ],
      "notice": {
        "title": "暂未获取到可购买套餐",
        "text": "请先登录，或稍后重新加载套餐。",
        "tone": "info"
      },
      "table": {
        "columns": [
          "套餐",
          "计费周期",
          "环境与指纹权益",
          "成员权益",
          "价格"
        ],
        "emptyTitle": "暂无可购买套餐",
        "emptyText": "套餐暂时无法加载，请稍后重试。",
        "action": null
      },
      "actions": [
        {
          "label": "返回订阅与用量",
          "target": "billing",
          "primary": false,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "payment",
      "title": "付款",
      "nav": "billing",
      "kind": "payment",
      "description": "选择付款方式，确认实际套餐和金额后获取支付码。",
      "tabs": [
        [
          "订阅与用量",
          "billing"
        ],
        [
          "选择套餐",
          "plans"
        ],
        [
          "付款",
          "payment"
        ]
      ],
      "rows": [
        [
          "套餐",
          "未选择"
        ],
        [
          "计费周期",
          "—"
        ],
        [
          "应付金额",
          "—"
        ]
      ],
      "methods": [
        "微信支付",
        "支付宝"
      ],
      "summary": {
        "title": "订单确认",
        "rows": [
          [
            "订单状态",
            "尚未创建"
          ],
          [
            "付款金额",
            "—"
          ],
          [
            "支付码",
            "尚未生成"
          ]
        ],
        "text": "扫码付款完成后，权益会在确认结果后更新。"
      },
      "footer": [
        {
          "label": "选择套餐",
          "target": "plans",
          "primary": false,
          "disabled": false
        },
        {
          "label": "获取支付码",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "选择套餐后获取支付码。"
    },
    {
      "id": "payment-pending",
      "title": "确认付款结果",
      "nav": "billing",
      "kind": "state",
      "description": "支付平台处理完成后，系统自动确认订单并更新订阅权益。",
      "notice": {
        "title": "正在确认付款结果",
        "text": "如已完成付款，请稍候。请勿重复创建订单或重复付款。",
        "tone": "info"
      },
      "rows": [
        [
          "订单号",
          "—"
        ],
        [
          "支付方式",
          "—"
        ],
        [
          "订单金额",
          "—"
        ],
        [
          "当前结果",
          "等待确认"
        ]
      ],
      "steps": [
        [
          "查询订单结果",
          "从业务服务端查询已核验的支付状态。"
        ],
        [
          "更新订阅权益",
          "仅在订单确认支付成功后开通。"
        ]
      ],
      "actions": [
        {
          "label": "返回订阅与用量",
          "target": "billing",
          "primary": false,
          "disabled": false
        }
      ],
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "settings",
      "title": "设置",
      "nav": "settings",
      "kind": "settings",
      "description": "管理团队的列表显示与界面动效。",
      "groups": [
        {
          "title": "个人与团队",
          "fields": [
            {
              "label": "个人资料",
              "type": "display",
              "placeholder": "",
              "full": false
            },
            {
              "label": "当前团队",
              "type": "display",
              "placeholder": "",
              "full": false
            },
            {
              "label": "登录设备",
              "type": "display",
              "placeholder": "",
              "full": false
            }
          ],
          "description": ""
        },
        {
          "title": "客户端与数据",
          "fields": [
            {
              "label": "本机数据位置",
              "type": "display",
              "placeholder": "",
              "full": false
            },
            {
              "label": "环境关闭前恢复点",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "跟随系统设置",
                "开启",
                "关闭"
              ]
            },
            {
              "label": "界面语言",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "简体中文"
              ]
            },
            {
              "label": "界面动效",
              "type": "select",
              "placeholder": "",
              "full": false,
              "options": [
                "跟随系统",
                "减少动效"
              ]
            }
          ],
          "description": ""
        },
        {
          "title": "版本与诊断",
          "fields": [
            {
              "label": "客户端版本",
              "type": "display",
              "placeholder": "",
              "full": false
            },
            {
              "label": "指纹内核版本",
              "type": "display",
              "placeholder": "",
              "full": false
            },
            {
              "label": "服务连接",
              "type": "display",
              "placeholder": "",
              "full": false
            },
            {
              "label": "诊断信息",
              "type": "display",
              "placeholder": "",
              "full": false
            }
          ],
          "description": ""
        }
      ],
      "summary": {
        "title": "数据边界",
        "rows": [
          [
            "指纹配置",
            "服务端保存"
          ],
          [
            "环境会话",
            "按环境隔离"
          ],
          [
            "支付密钥",
            "仅服务端持有"
          ]
        ],
        "text": "指纹和团队设置保存在服务端，浏览器登录会话按环境独立保存。"
      },
      "footerHint": "请登录后完成保存。"
    },
    {
      "id": "signin",
      "title": "登录工作空间",
      "nav": "overview",
      "kind": "signin",
      "description": "登录后使用团队指纹、浏览器环境与平台账号。",
      "groups": [
        {
          "title": "账户登录",
          "fields": [
            {
              "label": "邮箱 *",
              "type": "email",
              "placeholder": "输入账户邮箱",
              "full": true
            },
            {
              "label": "密码 *",
              "type": "password",
              "placeholder": "输入账户密码",
              "full": true
            }
          ],
          "description": ""
        }
      ],
      "footer": [
        {
          "label": "登录",
          "target": null,
          "primary": true,
          "disabled": true
        }
      ],
      "footerHint": "请使用工作空间账户登录。",
      "presentation": "modal",
      "modalParent": "overview"
    },
    {
      "id": "account-login",
      "title": "登录平台账号",
      "nav": "accounts",
      "kind": "authorize",
      "description": "在指定浏览器环境中完成平台验证，识别完成后继续确认身份。",
      "authorizationStage": 1,
      "notice": {
        "title": "等待平台返回登录结果",
        "text": "可切换到平台登录窗口完成验证。关闭窗口不会被视为授权成功。",
        "tone": "info"
      },
      "rows": [
        [
          "授权平台",
          "—"
        ],
        [
          "浏览器环境",
          "—"
        ],
        [
          "平台身份",
          "尚未读取"
        ]
      ],
      "summary": {
        "title": "授权检查",
        "rows": [
          [
            "当前阶段",
            "等待登录"
          ],
          [
            "身份识别",
            "等待平台返回"
          ],
          [
            "服务端保存",
            "尚未开始"
          ]
        ],
        "text": "请完成平台验证。登录后将读取账号身份，供你确认。"
      },
      "footer": [
        {
          "label": "返回环境选择",
          "target": "account-authorize"
        },
        {
          "label": "打开登录窗口",
          "disabled": true,
          "primary": true
        }
      ],
      "footerHint": "请在平台窗口完成扫码或登录。"
    },
    {
      "id": "account-confirm",
      "title": "确认授权身份",
      "nav": "accounts",
      "kind": "authorize",
      "description": "核对平台返回的账号身份，再将授权保存到团队。",
      "authorizationStage": 2,
      "groups": [
        {
          "title": "平台身份",
          "fields": [
            {
              "label": "平台",
              "type": "display"
            },
            {
              "label": "账号昵称",
              "type": "display"
            },
            {
              "label": "平台账号标识",
              "type": "display"
            },
            {
              "label": "所属环境",
              "type": "display"
            }
          ],
          "description": "身份由平台读取，不能手动填写或修改。"
        }
      ],
      "notice": {
        "title": "尚未收到平台身份",
        "text": "取得完整账号标识并通过会话校验后，才能确认保存。",
        "tone": "info"
      },
      "summary": {
        "title": "保存检查",
        "rows": [
          [
            "身份来源",
            "平台读取"
          ],
          [
            "会话校验",
            "等待执行"
          ],
          [
            "服务端保存",
            "尚未开始"
          ]
        ],
        "text": "请核对账号身份。更新授权时，须登录原账号。"
      },
      "footer": [
        {
          "label": "返回登录",
          "target": "account-login"
        },
        {
          "label": "确认并保存授权",
          "disabled": true,
          "primary": true
        }
      ],
      "footerHint": "平台身份与会话校验完成后可保存。"
    },
    {
      "id": "account-save-error",
      "title": "授权保存失败",
      "nav": "accounts",
      "kind": "authorize",
      "description": "保留本次授权上下文，恢复连接后重试服务端保存。",
      "authorizationStage": 3,
      "notice": {
        "title": "授权尚未保存到团队",
        "text": "请检查网络后重试。保存成功前，账号不会显示为授权有效，也不会重复创建记录。",
        "tone": "error"
      },
      "rows": [
        [
          "平台身份",
          "—"
        ],
        [
          "会话有效性",
          "重试前重新校验"
        ],
        [
          "服务端保存",
          "未完成"
        ]
      ],
      "summary": {
        "title": "恢复方式",
        "rows": [
          [
            "账号列表",
            "未标记成功"
          ],
          [
            "重新保存",
            "先检查登录状态"
          ],
          [
            "登录失效",
            "返回平台登录"
          ]
        ],
        "text": "重试不会重复添加账号。若登录已失效，请返回平台重新登录。"
      },
      "footer": [
        {
          "label": "返回账号列表",
          "target": "accounts"
        },
        {
          "label": "重试保存",
          "disabled": true,
          "primary": true
        }
      ],
      "footerHint": "请稍后重试，或返回账号列表。"
    }
  ]
}
  root.QijieProductDesign = definitions
})(window)
