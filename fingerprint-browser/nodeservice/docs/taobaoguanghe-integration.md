# 淘宝光合视频 / 图文发布对接文档

版本：`1.0`  
平台编码：`TaoBaoGuangHe`  
发布类型：`video` / `dynamic`

本文只说明业务方接入淘宝光合视频、图文发布时需要传递的参数和调用方式。账号授权、图片/视频上传、分片处理和淘宝内部接口均由平台运行时统一处理，对接方不需要实现或传递。

## 1. 接入前提

- 淘宝光合账号已经完成授权，并且账号状态正常。
- 任务中的平台编码必须使用 `TaoBaoGuangHe`。
- 视频任务中的发布类型使用 `video`；图文任务使用 `dynamic`。如果历史 DTO 使用 `imageText`，运行时也会兼容并归一化为 `dynamic`。

## 2. 调用入口

本地任务：

```ts
Cloud.pushLocalPublishTask(taskSet, feedbackHandler)
```

服务端任务沿用现有统一任务接口，传入与本地任务相同的任务结构。淘宝光合是网页端爬虫接入，不新增开放平台专用入口。

## 3. 任务结构

### 3.1 平台账号

```json
{
  "id": "account-bind-id",
  "platformCode": "TaoBaoGuangHe",
  "platformUserId": "1977795714",
  "platformUserName": "淘宝账号昵称",
  "platformAvatar": ""
}
```

`platform[].id` 用于关联发布任务。

### 3.2 任务字段

```json
{
  "taskId": "task-001",
  "authorInfo": {
    "id": "account-bind-id",
    "platform": "TaoBaoGuangHe"
  },
  "publishData": {}
}
```

注意：`tasks[].authorInfo.id` 必须和对应账号的 `platform[].id` 保持一致。

## 4. `publishData` 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `video` | `VideoFormItem` | 是 | 视频文件，本地任务使用 `localPath`，远程任务使用 `url`，至少传一个 |
| `covers` | `ImageInfo[]` | 是 | 视频封面，至少传一张，使用第一张作为发布封面 |
| `title` | `string` | 否 | 光合页面顶部标题；运行时映射为淘宝官方请求的 `shortTitle`，最多 30 个字符 |
| `desc` | `string` | 否 | 光合页面下方视频描述；可不传，未传时保持为空；最多 1000 个字符；支持普通文本、HTML 段落/换行及描述中的 `<topic>` 话题标签，运行时转换为光合官方描述结构，不会原样提交标签 |
| `statement` | `object` | 否 | 光合页面“创作者声明”；未传时按官方默认项“内容无需标注”处理 |
| `prePubTime` | `number` | 否 | 定时发布时间，13 位毫秒时间戳；未传时立即发布，运行时同时提交到 `onlineTime` 和 `publishExtra.online_time` |
| `allow_download` | `boolean` | 否 | 是否允许下载；默认 `false`，运行时提交 `downloadEnable: "1"` 或 `"0"` |
| `tags` | `string[]` | 否 | 统一任务字段兼容项；运行时去重后最多取前 4 个，作为话题追加到描述末尾，不是光合官方独立正文标签 |
| `topics` | `ListItemInfo[]` | 否 | 历史任务或兼容调用传入的话题项；运行时仅使用话题名称追加到描述末尾，不要求前端传递官方 `topicId` |
| `shopping_cart` | `GoodsItemInfo[]` | 否 | 淘宝光合关联商品；建议使用商品查询接口返回的完整选项，最多 6 个 |

### 3.1 创作者声明

`statement.type` 使用淘宝光合官方编码，文案与页面保持一致：

| `statement.type` | 官方文案 | 说明 |
| ---: | --- | --- |
| `0` | 内容无需标注 | 默认值 |
| `1` | 含AI生成内容 |  |
| `2` | 含虚构演绎内容 |  |
| `4` | 内容为转载 | 可同时传 `forwardFrom` 作为转载来源链接 |
| `5` | 个人观点，仅供参考 |  |
| `6` | 内容含营销信息 |  |

未传 `statement`、或传入不支持的声明编码时，运行时按 `0`（内容无需标注）提交，不会因为声明值直接终止任务。`statement.type` 会同步提交到官方请求的 `publishExtra.text_type`；转载声明会提交 `contentSource.fromType: 4`，并在有来源链接时提交 `contentSource.forwardFrom`。

示例：

```json
{
  "statement": {
    "type": 1
  }
}
```

转载示例：

```json
{
  "statement": {
    "type": 4,
    "forwardFrom": "https://example.com/source"
  }
}
```

### 4.1 视频参数示例

本地视频：

```json
{
  "video": {
    "localPath": "C:\\publish\\demo.mp4",
    "duration": 12.5,
    "width": 720,
    "height": 1280,
    "size": 52428800
  }
}
```

远程视频：

```json
{
  "video": {
    "url": "https://example.com/demo.mp4"
  }
}
```

### 4.2 封面参数示例

```json
{
  "covers": [
    {
      "pathOrUrl": "C:\\publish\\demo-cover.jpg",
      "width": 720,
      "height": 1280,
      "format": "jpg"
    }
  ]
}
```

### 4.3 商品关联

淘宝光合商品选择器对应两个网页端 MTop 接口：`listTabs` 返回“已购商品”、商品池和二级分类；`listItems` 在选择分类或输入关键词后返回具体商品。运行时会自动计算 MTop 请求签名，并在未传 `publishSession` 时通过 `session.generate` 获取当前会话；商品接口返回会话错误时会刷新会话并重试一次。

可以通过 `TaoBaoGuangHe` 入口查询：

```ts
const tabs = await TaoBaoGuangHe.getTaoBaoGuangHeGoodsTabs(cookie, {
  pageType: 'video',
});

const products = await TaoBaoGuangHe.getTaoBaoGuangHeGoodsList(cookie, '', '', {
  pageType: 'video',
  publishSession: tabs.publishSession,
  filterValue: '-1',
  secondLevelFilterValue: '-1',
});

const shopping_cart = products.dataList?.slice(0, 1) ?? [];
```

`dataList` 中的每个选项会映射官方返回的 `itemId`、`title`、`picUrl`、`price`、`shopTitle` 等字段，并保留完整 `raw`。发布时将所选选项放入 `publishData.shopping_cart`，运行时会把 `raw` 原样恢复到官方发布请求的 `items` 字段；最多关联 6 个商品。不要把抓包中的 Cookie、`sign` 或临时 `publishSession` 固定写入业务代码。

示例：

```json
{
  "shopping_cart": [
    {
      "yixiaoerId": "1026731553684",
      "yixiaoerName": "可挂式水槽沥水篮",
      "yixiaoerImageUrl": "https://gw2.alicdn.com/item-cover.jpg",
      "price": 3.9,
      "raw": {
        "itemId": 1026731553684,
        "title": "可挂式水槽沥水篮",
        "picUrl": "https://gw2.alicdn.com/item-cover.jpg",
        "price": "3.90"
      }
    }
  ]
}
```

### 4.4 兼容话题参数示例

淘宝光合不接入话题搜索能力。`tags`/`topics` 仅保留为统一任务的兼容字段：如果业务侧已经有话题名称或话题项，可以直接传入；运行时只会将话题名称追加到描述中，不会向淘宝光合发起话题搜索请求。

```json
{
  "topics": [
    {
      "yixiaoerId": "topic-123",
      "yixiaoerName": "好物分享"
    }
  ]
}
```

### 4.5 图文参数

图文任务的 `publishData` 使用下面的字段。图片先由运行时上传，官方发布请求中的图片会放在顶层 `pics` 数组。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `images` | `ImageInfo[]` | 是 | 图文图片，至少 1 张；`pathOrUrl` 支持本地路径或可访问的图片 URL |
| `prePubTime` | `number` | 否 | 定时发布时间，13 位毫秒时间戳；未传时立即发布，运行时同时提交到 `onlineTime` 和 `publishExtra.online_time` |
| `title` | `string` | 否 | 光合页面顶部标题；与 `desc` 至少传一个；运行时映射为淘宝官方请求的 `shortTitle`，最多 30 个字符 |
| `desc` | `string` | 否 | 光合页面正文描述；未传时保持为空；与 `title` 至少传一个；如传入至少 10 个字符、最多 1000 个字符；支持 HTML 和描述中的 `<topic>` 话题标签 |
| `tags` | `string[]` | 否 | 统一任务字段兼容项；运行时作为话题追加到描述末尾，不是独立的正文标签字段 |
| `topics` | `ListItemInfo[]` | 否 | 历史任务或兼容调用传入的话题项；运行时使用话题名称追加到描述末尾 |
| `statement` | `object` | 否 | 创作者声明；未传时按“内容无需标注”处理 |

对接时只传 `title` 和 `desc`：`title` 对应光合页面顶部标题，`desc` 对应页面下方描述。运行时会把 `title` 转换为淘宝官方请求的 `shortTitle`，把 `desc` 转换为官方描述结构。话题应放在描述内容中，运行时不会把 `<topic>` 原样提交到页面。

视频任务的 `title` 和 `desc` 均为非必填，`desc` 最多 1000 个字符；图文任务的 `title` 和 `desc` 至少填写一个，`desc` 如果传入，长度必须为 10～1000 个字符。未传视频 `desc` 时不会自动用 `title` 填充。

图文示例：

```json
{
  "images": [
    {
      "pathOrUrl": "C:\\publish\\photo-1.jpg",
      "width": 2752,
      "height": 1536,
      "format": "jpg"
    }
  ],
  "title": "页面顶部标题",
  "desc": "<p>这是正文描述</p><p><topic text=\"日常\">#日常</topic></p>",
  "statement": {
    "type": 0
  },
  "prePubTime": 1787241600000
}
```

## 5. 完整请求示例

```json
{
  "publishType": "video",
  "callBackData": {
    "businessId": "demo-001"
  },
  "publishChannel": "local",
  "clientId": "desktop-client",
  "platform": [
    {
      "id": "account-bind-id",
      "platformCode": "TaoBaoGuangHe",
      "platformUserId": "1977795714",
      "platformUserName": "淘宝账号昵称",
      "platformAvatar": ""
    }
  ],
  "tasks": [
    {
      "taskId": "task-001",
      "authorInfo": {
        "id": "account-bind-id",
        "platform": "TaoBaoGuangHe"
      },
      "publishData": {
        "video": {
          "localPath": "C:\\publish\\demo.mp4",
          "duration": 12.5,
          "width": 720,
          "height": 1280
        },
        "covers": [
          {
            "pathOrUrl": "C:\\publish\\demo-cover.jpg",
            "width": 720,
            "height": 1280
          }
        ],
        "title": "光合视频标题",
        "desc": "这里是发布到淘宝光合下方大文本框的视频描述内容。<topic text=\"AI短剧\">#AI短剧</topic>",
        "statement": {
          "type": 0
        },
        "prePubTime": 1787241600000,
        "allow_download": true
      }
    }
  ]
}
```

图文任务只需将 `publishType` 改为 `dynamic`，并在 `publishData` 中传入图文字段：

```json
{
  "publishType": "dynamic",
  "publishChannel": "local",
  "platform": [
    {
      "id": "account-bind-id",
      "platformCode": "TaoBaoGuangHe",
      "platformUserId": "1977795714",
      "platformUserName": "淘宝账号昵称",
      "platformAvatar": ""
    }
  ],
  "tasks": [
    {
      "taskId": "task-image-text-001",
      "authorInfo": {
        "id": "account-bind-id",
        "platform": "TaoBaoGuangHe"
      },
      "publishData": {
        "images": [
          {
            "pathOrUrl": "C:\\publish\\photo-1.jpg",
            "width": 2752,
            "height": 1536
          }
        ],
        "title": "页面顶部标题",
        "desc": "<p>这是正文描述</p><p><topic text=\"日常\">#日常</topic></p>",
        "statement": {
          "type": 0
        },
        "prePubTime": 1787241600000
      }
    }
  ]
}
```

## 6. 回调

### 6.1 发布进度

```json
{
  "event": "publishProcess",
  "publishType": "video",
  "taskId": "task-001",
  "callBackData": {
    "businessId": "demo-001"
  },
  "stages": "upload",
  "stageStatus": "doing",
  "totalParts": 5,
  "uploadedParts": 3,
  "errorMessage": ""
}
```

阶段值：

| `stages` | `stageStatus` | 含义 |
| --- | --- | --- |
| `upload` | `doing` | 视频、封面或图文图片处理中 |
| `upload` | `fail` | 处理失败 |
| `push` | `doing` | 正在发布 |
| `push` | `fail` | 发布失败 |
| `push` | `success` | 发布成功 |
| `scheduled` | `success` | 定时发布中 |

### 6.2 发布结果

```json
{
  "code": 0,
  "msg": "发布成功",
  "taskId": "task-001",
  "publishId": "<淘宝光合作品 ID>"
}
```

定时发布受理成功时，`msg` 为 `定时发布中`，回调阶段为 `scheduled/success`；立即发布仍返回 `发布成功` 和 `push/success`。

### 6.3 发布状态

淘宝光合当前没有单独的作品状态查询接口。运行时收到立即发布接口的成功结果后，会直接回传最终成功状态；收到定时发布成功结果后，会根据任务中的未来 `prePubTime` 回传定时发布状态。

因此，对接方处理 `6.2` 的发布结果回调即可；不要因为没有状态查询接口而将任务标记为失败。

## 7. 对接方不需要传递的字段

以下字段由运行时自动处理，对接方不要放到业务请求中：

```text
淘宝 Cookie
sign
_m_h5_tk
_m_h5_tk_enc
uploadId
fileId
OSS 分片地址
```

## 8. 常见错误

| 错误 | 处理建议 |
| --- | --- |
| `444 不支持的平台` | 检查平台编码是否为 `TaoBaoGuangHe`，并确认运行时包已支持该平台 |
| `444 淘宝光合暂只支持视频和图文发布` | 检查 `publishType` 是否为 `video` 或 `dynamic` |
| `172002 视频文件不存在` | 检查 `video.localPath` 是否存在，或确认 `video.url` 可以访问 |
| 上传或发布失败 | 保留 `taskId`、错误消息和 `traceId`，提交给平台运行时排查 |

## 9. Schema

Apifox 导入：

```text
schemas/platform-body-complete-openapi.json
```

导入后，在“视频”或“图文”联合类型中选择“淘宝光合”，即可看到以下字段：

```text
视频：video、covers、title、desc、statement、prePubTime、allow_download、tags、topics
图文：images、title、desc、statement、tags、topics
```

联调顺序：

1. 确认淘宝光合账号已经授权。
2. 使用一条小视频和一张封面提交视频任务。
3. 使用一张小图片提交图文任务，确认图片上传进度和最终 `publishId`。
4. 再测试多图、视频定时发布和失败场景。
