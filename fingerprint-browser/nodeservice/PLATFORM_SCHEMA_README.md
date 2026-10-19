# PlatformBody OpenAPI Schema 生成器

## 🎯 功能

自动生成PlatformBody及其所有相关类型的完整OpenAPI 3.0文档，**包括所有依赖类型**，支持直接导入Apifox。

## 🚀 使用方法

### 生成OpenAPI文档

```bash
npm run generate:platform-schema
```

### 导入到Apifox

1. 打开Apifox，进入"数据模型"页面
2. 点击"导入"按钮，选择"OpenAPI"
3. 上传 `schemas/platform-body-complete-openapi.json` 文件
4. 确认导入，所有类型将自动创建

## ✨ 新特性：自动依赖解析

### 🔍 智能依赖发现
脚本现在能够：
- **自动追踪类型依赖**：解析interface和type中引用的外部类型
- **递归解析依赖**：自动发现并解析依赖类型的依赖
- **路径别名支持**：正确解析`@/`路径别名和相对路径
- **避免重复解析**：使用缓存机制提高性能

### 📂 扩展扫描范围
除了核心的`src/platform-body/`目录，还会自动扫描：
- `src/media-platform/baseModel.ts` - 基础模型类型
- `src/media-platform/index.ts` - 媒体平台类型
- `src/platform-body/common.ts` - 公共表单类型
- 以及所有被引用的依赖文件

### 🔗 完整类型覆盖
现在生成的文档包含：
- 所有平台表单接口
- 所有依赖的基础类型（如`ListItemInfo`、`ImageInfo`等）
- 所有公共表单类型（如`VideoFormItem`、`ImageFormItem`等）
- 所有联合类型和枚举类型

## 📊 生成内容

### 平台表单类型
- 所有视频平台表单接口（抖音、快手、小红书等）
- 所有动态/图文平台表单接口（抖音图文、快手图文、小红书图文等）
- 所有文章平台表单接口（头条号文章、知乎文章、百家号文章等）

### 依赖类型
- `ListItemInfo` - 列表项基础接口
- `ImageInfo` - 图片信息接口
- `VideoFormItem` - 视频表单项
- `ImageFormItem` - 图片表单项
- `DouYinLocationData` - 抖音位置数据
- 以及其他所有被引用的类型

### 联合类型
- `PlatformBody` - 所有平台联合类型（包含视频、动态、文章）
- `VideoPlatformBody` - 视频平台联合类型（16个视频平台）
- `DynamicPlatformBody` - 动态/图文平台联合类型（5个图文平台）
- `ArticlePlatformBody` - 文章平台联合类型（10个文章平台）

## 🔧 自动发现机制

### 文件发现
1. 扫描`src/platform-body/`目录下的所有TypeScript文件
2. 扫描常见依赖文件路径
3. 通过import语句追踪额外的依赖文件

### 类型解析
1. 解析`export interface`和`export type`定义
2. 提取JSDoc注释中的描述、约束条件和示例
3. 分析类型定义中的类型引用
4. 递归解析所有依赖类型

### 依赖追踪
1. 解析import语句，建立类型到文件的映射
2. 从类型定义中提取引用的类型名称
3. 根据import映射找到类型定义文件
4. 递归解析依赖文件中的类型

## 🔄 添加新平台

当需要添加新平台时：

1. 在相应目录创建新的`.ts`文件
2. 定义interface并添加JSDoc注释
3. 在联合类型中添加新平台类型
4. 运行`npm run generate:platform-schema`

**脚本会自动发现新文件和所有依赖，无需修改生成脚本！**

## 📁 文件结构

```
src/
├── platform-body/
│   ├── common.ts                    # 公共类型定义
│   └── video/
│       ├── index.ts                # 联合类型定义
│       ├── douyin.ts               # 抖音平台
│       ├── kuaishou.ts             # 快手平台
│       └── ...                     # 其他平台
├── media-platform/
│   ├── baseModel.ts                # 基础模型类型
│   └── index.ts                    # 媒体平台类型
└── ...

schemas/
└── platform-body-complete-openapi.json  # 生成的OpenAPI文档

scripts/
└── generate-complete-openapi.js         # 生成脚本
```

## 📝 JSDoc格式

### Interface注释
```typescript
/**
 * 平台名称平台表单
 * @description 详细的平台描述信息
 */
export interface PlatformVideoPlatformBody {
  // ...
}
```

### 属性注释
```typescript
/**
 * 属性描述
 * @constraints 约束条件说明
 * @example "示例值"
 */
propertyName: string;
```

## ✨ 特性

- ✅ **零维护成本** - 新增类型和依赖自动发现
- ✅ **完整类型覆盖** - 包含所有平台和依赖类型
- ✅ **智能依赖解析** - 自动追踪和解析类型依赖
- ✅ **路径别名支持** - 正确处理@/路径别名
- ✅ **OpenAPI 3.0标准** - 完全兼容Apifox导入
- ✅ **丰富元信息** - 自动提取JSDoc信息
- ✅ **联合类型支持** - 正确生成oneOf结构
- ✅ **缓存机制** - 避免重复解析，提高性能
- ✅ **可扩展性** - 支持未来新增内容类型

## 🎯 输出文件

生成的`schemas/platform-body-complete-openapi.json`包含：
- 标准的OpenAPI 3.0格式
- 完整的类型定义和属性
- 所有依赖类型的完整定义
- 类型间的正确引用关系
- 详细的描述和约束信息
- 可直接导入Apifox的格式
- 无引用错误的完整文档

## 🔍 依赖解析示例

当解析`DouYinVideoPlatformBody`时，脚本会自动：

1. 发现`VideoFormItem`引用 → 解析`src/platform-body/common.ts`
2. 发现`ImageInfo`引用 → 解析`src/media-platform/baseModel.ts`
3. 发现`DouYinLocationData`引用 → 在同文件中解析
4. 发现`ListItemInfo`引用 → 通过import追踪到`src/media-platform/baseModel.ts`
5. 递归解析所有依赖类型的依赖

最终生成包含所有相关类型的完整OpenAPI文档。

## 🔄 最新更新

### 修复数组类型引用
- ✅ **正确处理数组类型** - 修复了`ImageInfo[]`等数组类型的引用问题
- ✅ **符合OpenAPI规范** - 使用`type: array`和`items.$ref`结构替代直接引用数组
- ✅ **完整依赖追踪** - 正确识别并解析数组元素类型的依赖

### 示例：数组类型处理

修复前（不符合OpenAPI规范）:
```json
{
  "$ref": "#/components/schemas/ImageInfo[]"
}
```

修复后（符合OpenAPI规范）:
```json
{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/ImageInfo"
  }
}
```

这确保了所有数组类型引用都能在Apifox等工具中正确解析和显示。



