#!/usr/bin/env node

/**
 * 智能生成PlatformBody及其所有相关类型的OpenAPI文档
 * 自动发现所有平台类型和依赖类型，无需手动维护
 * 支持interface继承(extends)和嵌套interface的完整解析
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

// 全局类型缓存，避免重复解析
const globalTypeCache = new Map();
// 继承关系映射，用于处理extends
const inheritanceMap = new Map();
// 所有已解析的类型定义
const allParsedTypes = new Map();

/**
 * 自动扫描并解析TypeScript文件，提取类型定义
 * @param {string} filePath - TypeScript文件路径
 * @returns {Object} 解析后的类型信息
 */
function parseTypeScriptFile(filePath) {
  // 检查缓存
  if (globalTypeCache.has(filePath)) {
    return globalTypeCache.get(filePath);
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  文件不存在: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const types = {};

  // 提取import语句，用于依赖追踪
  const imports = extractImports(content);

  // 提取interface定义（包括extends关系）
  const interfaceMatches = extractInterfaces(content);
  for (const match of interfaceMatches) {
    const { name, body, jsdoc, isEnum, extendsFrom } = match;

    if (!isEnum) {
      // 只处理接口，枚举将在字段级别内联处理
      const typeInfo = {
        type: 'interface',
        body: body,
        jsdoc: jsdoc,
        schema: null, // 延迟生成schema，等所有类型解析完成后再生成
        filePath: filePath,
        imports: imports,
        extendsFrom: extendsFrom, // 新增：继承信息
      };

      types[name] = typeInfo;
      allParsedTypes.set(name, typeInfo);

      // 记录继承关系
      if (extendsFrom) {
        inheritanceMap.set(name, extendsFrom);
        console.log(`📋 发现继承关系: ${name} extends ${extendsFrom}`);
      }
    }
  }

  // 提取type定义
  const typeMatches = extractTypes(content);
  for (const match of typeMatches) {
    const { name, definition, jsdoc } = match;
    const typeInfo = {
      type: 'type',
      definition: definition.trim(),
      jsdoc: jsdoc,
      schema: null, // 延迟生成
      filePath: filePath,
      imports: imports,
    };

    types[name] = typeInfo;
    allParsedTypes.set(name, typeInfo);
  }

  // 缓存结果
  globalTypeCache.set(filePath, types);
  return types;
}

/**
 * 提取import语句
 * @param {string} content - 文件内容
 * @returns {Object} import映射
 */
function extractImports(content) {
  const imports = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // 匹配 import { Type1, Type2 } from 'path'
    const namedImportMatch = line.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/);
    if (namedImportMatch) {
      const types = namedImportMatch[1].split(',').map((t) => t.trim());
      const importPath = namedImportMatch[2];

      for (const type of types) {
        imports[type] = importPath;
      }
    }

    // 匹配 import Type from 'path'
    const defaultImportMatch = line.match(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/);
    if (defaultImportMatch) {
      const type = defaultImportMatch[1];
      const importPath = defaultImportMatch[2];
      imports[type] = importPath;
    }
  }

  return imports;
}

/**
 * 解析import路径为实际文件路径
 * @param {string} importPath - import路径
 * @param {string} currentFilePath - 当前文件路径
 * @returns {string} 实际文件路径
 */
function resolveImportPath(importPath, currentFilePath) {
  const currentDir = path.dirname(currentFilePath);

  // 处理相对路径
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    let resolvedPath = path.resolve(currentDir, importPath);

    // 尝试添加.ts扩展名
    if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
      if (fs.existsSync(resolvedPath + '.ts')) {
        resolvedPath += '.ts';
      } else if (fs.existsSync(resolvedPath + '/index.ts')) {
        resolvedPath += '/index.ts';
      }
    }

    return resolvedPath;
  }

  // 处理@/路径别名
  if (importPath.startsWith('@/')) {
    const srcPath = importPath.replace('@/', 'src/');
    let resolvedPath = path.resolve(process.cwd(), srcPath);

    if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
      if (fs.existsSync(resolvedPath + '.ts')) {
        resolvedPath += '.ts';
      } else if (fs.existsSync(resolvedPath + '/index.ts')) {
        resolvedPath += '/index.ts';
      }
    }

    return resolvedPath;
  }

  return null;
}

/**
 * 递归解析类型依赖
 * @param {string} typeName - 类型名称
 * @param {Object} typeInfo - 类型信息
 * @param {Object} allTypes - 所有已解析的类型
 */
function resolveDependencies(typeName, typeInfo, allTypes) {
  if (!typeInfo.imports) return;

  // 从类型定义中提取引用的类型
  const referencedTypes = extractReferencedTypes(typeInfo);

  // 如果有extends关系，也要解析基类
  if (typeInfo.extendsFrom && !referencedTypes.has(typeInfo.extendsFrom)) {
    referencedTypes.add(typeInfo.extendsFrom);
  }

  for (const refType of referencedTypes) {
    // 如果类型已存在，跳过
    if (allTypes[refType]) continue;

    // 查找类型的import路径
    const importPath = typeInfo.imports[refType];
    if (!importPath) continue;

    // 解析实际文件路径
    const actualPath = resolveImportPath(importPath, typeInfo.filePath);
    if (!actualPath || !fs.existsSync(actualPath)) {
      console.warn(`⚠️  无法解析依赖类型 ${refType} 的路径: ${importPath}`);
      continue;
    }

    // 解析依赖文件
    console.log(`🔍 解析依赖类型: ${refType} (来自 ${actualPath})`);
    const depTypes = parseTypeScriptFile(actualPath);

    // 合并到全局类型中
    Object.assign(allTypes, depTypes);

    // 递归解析新类型的依赖
    for (const [depTypeName, depTypeInfo] of Object.entries(depTypes)) {
      resolveDependencies(depTypeName, depTypeInfo, allTypes);
    }
  }
}

/**
 * 从类型定义中提取引用的类型名称
 * @param {Object} typeInfo - 类型信息
 * @returns {Set} 引用的类型名称集合
 */
function extractReferencedTypes(typeInfo) {
  const referencedTypes = new Set();
  let content = '';

  if (typeInfo.type === 'interface') {
    content = typeInfo.body;
  } else if (typeInfo.type === 'type') {
    content = typeInfo.definition;
  }

  // 匹配类型引用，如 VideoFormItem, ImageInfo[], ListItemInfo 等
  // 先匹配数组类型
  const arrayTypeRegex = /\b([A-Z][a-zA-Z0-9]*)\[\]/g;
  let arrayMatch;
  while ((arrayMatch = arrayTypeRegex.exec(content)) !== null) {
    const typeName = arrayMatch[1];
    if (!['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Promise', 'Record'].includes(typeName)) {
      referencedTypes.add(typeName);
    }
  }

  // 再匹配非数组类型
  const typeReferenceRegex = /\b([A-Z][a-zA-Z0-9]*)\b(?!\[\])/g;
  let match;
  while ((match = typeReferenceRegex.exec(content)) !== null) {
    const typeName = match[1];
    // 排除基本类型和常见的TypeScript类型
    if (!['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Promise', 'Record'].includes(typeName)) {
      referencedTypes.add(typeName);
    }
  }

  return referencedTypes;
}

/**
 * 提取interface定义（支持extends）
 * @param {string} content - 文件内容
 * @returns {Array} interface定义数组
 */
function extractInterfaces(content) {
  const interfaces = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 查找interface（支持export和本地非export，支持extends）
    let interfaceMatch = line.match(/export\s+interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/);
    const localInterfaceMatch = interfaceMatch ? null : line.match(/^\s*interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/);
    // 查找export enum（保持原有行为）
    const enumMatch = line.match(/export\s+enum\s+(\w+)\s*\{/);

    const effectiveInterfaceMatch = interfaceMatch || localInterfaceMatch;

    if (effectiveInterfaceMatch || enumMatch) {
      const name = effectiveInterfaceMatch ? effectiveInterfaceMatch[1] : enumMatch[1];
      const isEnum = !!enumMatch;
      const extendsFrom = effectiveInterfaceMatch ? effectiveInterfaceMatch[2] : null; // 新增：继承的基类

      // 向前查找JSDoc注释
      let jsdoc = '';
      let j = i - 1;
      let inJsdoc = false;

      while (j >= 0) {
        const prevLine = lines[j].trim();
        if (prevLine.endsWith('*/')) {
          inJsdoc = true;
          jsdoc = prevLine + '\n' + jsdoc;
        } else if (inJsdoc) {
          jsdoc = prevLine + '\n' + jsdoc;
          if (prevLine.startsWith('/**')) {
            break;
          }
        } else if (prevLine === '') {
          // 空行，继续查找
        } else {
          // 遇到其他内容，停止查找
          break;
        }
        j--;
      }

      // 提取interface主体
      let braceCount = 1;
      let bodyLines = [];
      let k = i + 1;

      while (k < lines.length && braceCount > 0) {
        const bodyLine = lines[k];
        bodyLines.push(bodyLine);

        for (const char of bodyLine) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        k++;
      }

      // 移除最后的 }
      if (bodyLines.length > 0) {
        const lastLine = bodyLines[bodyLines.length - 1];
        bodyLines[bodyLines.length - 1] = lastLine.replace(/\}$/ , '');
      }

      const body = bodyLines.join('\n');
      interfaces.push({ name, body, jsdoc, isEnum, extendsFrom }); // 新增extendsFrom
    }
  }

  return interfaces;
}

/**
 * 提取type定义
 * @param {string} content - 文件内容
 * @returns {Array} type定义数组
 */
function extractTypes(content) {
  const types = [];

  // 处理多行类型定义，包括跨越多行的export type
  // 首先将内容按行分割
  const lines = content.split('\n');

  // 标记是否在类型定义中
  let inTypeDefinition = false;
  let currentTypeName = '';
  let currentTypeDefinition = '';
  let currentJsdoc = '';
  let bracketCount = 0;

  // 存储最近的JSDoc注释
  let lastJsdoc = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 收集JSDoc注释
    if (line.startsWith('/**')) {
      lastJsdoc = line;
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().includes('*/')) {
        lastJsdoc += '\n' + lines[j];
        j++;
      }
      if (j < lines.length) {
        lastJsdoc += '\n' + lines[j].trim();
        i = j;
      }
      continue;
    }

    // 如果不在类型定义中，检查是否开始新的类型定义（支持可选export）
    if (!inTypeDefinition) {
      const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)\s*=\s*(.*)/);
      if (typeMatch) {
        inTypeDefinition = true;
        currentTypeName = typeMatch[1];
        currentTypeDefinition = typeMatch[2];
        currentJsdoc = lastJsdoc;
        lastJsdoc = ''; // 清除已使用的JSDoc

        // 计算括号数量，用于处理复杂类型
        bracketCount =
          (currentTypeDefinition.match(/{/g) || []).length - (currentTypeDefinition.match(/}/g) || []).length;

        // 如果当前行包含分号且括号已平衡，则类型定义已完成
        if (currentTypeDefinition.includes(';') && bracketCount === 0) {
          types.push({
            name: currentTypeName,
            definition: currentTypeDefinition.replace(/;$/, '').trim(),
            jsdoc: currentJsdoc,
          });
          inTypeDefinition = false;
          currentTypeName = '';
          currentTypeDefinition = '';
          currentJsdoc = '';
        }
      }
    } else {
      // 已在类型定义中，继续收集定义
      currentTypeDefinition += ' ' + line;

      // 更新括号计数
      bracketCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

      // 检查是否结束定义（有分号且括号已平衡）
      if (line.includes(';') && bracketCount === 0) {
        types.push({
          name: currentTypeName,
          definition: currentTypeDefinition.replace(/;$/, '').trim(),
          jsdoc: currentJsdoc,
        });
        inTypeDefinition = false;
        currentTypeName = '';
        currentTypeDefinition = '';
        currentJsdoc = '';
      }
    }
  }

  // 特别处理联合类型定义（支持可选export）
  const unionTypeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*([\w<>]+(?:\s*\|\s*[\w<>]+)+)\s*;/g;
  let unionMatch;
  while ((unionMatch = unionTypeRegex.exec(content)) !== null) {
    const name = unionMatch[1];
    const definition = unionMatch[2].trim();

    // 查找这个类型定义前的JSDoc注释
    const beforeMatch = content.substring(0, unionMatch.index).trim();
    const jsdocMatch = beforeMatch.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
    const jsdoc = jsdocMatch ? jsdocMatch[0] : '';

    // 检查是否已经添加过这个类型
    if (!types.some((t) => t.name === name)) {
      types.push({ name, definition, jsdoc });
    }
  }

  return types;
}

/**
 * 合并继承的属性（处理extends关系）
 * @param {string} typeName - 类型名称
 * @param {Object} typeInfo - 类型信息
 * @param {Object} allTypes - 所有类型
 * @returns {string} 合并后的interface body
 */
function mergeInheritedProperties(typeName, typeInfo, allTypes) {
  let mergedBody = typeInfo.body || '';

  // 如果有继承关系
  if (typeInfo.extendsFrom) {
    const baseType = allTypes[typeInfo.extendsFrom];
    if (baseType && baseType.type === 'interface') {
      console.log(`🔗 合并继承属性: ${typeName} extends ${typeInfo.extendsFrom}`);

      // 递归合并基类的属性
      const baseBody = mergeInheritedProperties(typeInfo.extendsFrom, baseType, allTypes);

      // 将基类属性添加到当前类型前面
      if (baseBody.trim()) {
        mergedBody = baseBody + '\n' + mergedBody;
      }
    } else {
      console.warn(`⚠️  无法找到基类: ${typeInfo.extendsFrom} for ${typeName}`);
    }
  }

  return mergedBody;
}

/**
 * 将interface转换为OpenAPI schema（支持继承）
 * @param {string} name - interface名称
 * @param {string} body - interface主体
 * @param {string} jsdoc - JSDoc注释
 * @param {string} fileContent - 文件内容
 * @param {Object} allTypes - 所有类型（用于处理继承）
 * @returns {Object} OpenAPI schema
 */
function parseInterfaceToSchema(name, body, jsdoc, fileContent = '', allTypes = {}) {
  const schema = {
    type: 'object',
    title: name,
    description: extractDescription(jsdoc) || `${name}类型定义`,
    properties: {},
    required: [],
  };

  // 解析属性
  const propertyRegex = /\/\*\*([\s\S]*?)\*\/\s*(\w+)(\??):\s*([^;]+);/g;
  let match;

  while ((match = propertyRegex.exec(body)) !== null) {
    const [, propJsdoc, propName, optional, propType] = match;

    // 过滤掉注释代码中的JSDoc
    const cleanJsdoc = propJsdoc
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        // 过滤掉以 // 开头的注释行
        return !trimmed.startsWith('//');
      })
      .join('\n');

    schema.properties[propName] = parsePropertyType(propType.trim(), cleanJsdoc, fileContent, allTypes);

    if (!optional) {
      schema.required.push(propName);
    }
  }

  // 如果没有required属性，删除required字段
  if (schema.required.length === 0) {
    delete schema.required;
  }

  return schema;
}

/**
 * 将type定义转换为OpenAPI schema
 * @param {string} name - type名称
 * @param {string} definition - type定义
 * @param {string} jsdoc - JSDoc注释
 * @param {Object} allTypes - 所有类型定义（用于获取中文名称）
 * @returns {Object} OpenAPI schema
 */
function parseTypeToSchema(name, definition, jsdoc, allTypes = {}) {
  const description = extractDescription(jsdoc) || `${name}类型定义`;

  // 处理联合类型
  if (definition.includes('|')) {
    // 分割联合类型，处理可能的空格
    const types = definition
      .split('|')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    // 检查是否为字符串字面量联合类型
    if (types.every((t) => t.startsWith("'") && t.endsWith("'"))) {
      return {
        type: 'string',
        title: name,
        description: description,
        enum: types.map((t) => t.slice(1, -1)),
      };
    }

    // 处理类型引用的联合类型
    return {
      title: name,
      description: description,
      oneOf: types.map((type) => {
        // 处理可能的泛型
        const cleanType = type.replace(/<.*>/, '').trim();
        const chineseName = getChineseTypeName(cleanType, allTypes);

        // 使用allOf包装$ref以支持title，这是OpenAPI标准的推荐做法
        return {
          allOf: [{ $ref: `#/components/schemas/${cleanType}` }],
          title: chineseName,
          description: `${chineseName}平台表单`,
        };
      }),
    };
  }

  // 处理简单对象类型
  if (definition.startsWith('{') && definition.endsWith('}')) {
    return {
      type: 'object',
      title: name,
      description: description,
      properties: {}, // 简化处理
    };
  }

  // 处理数组类型
  if (definition.endsWith('[]')) {
    const itemType = definition.slice(0, -2).trim();
    if (/^[A-Z]/.test(itemType)) {
      return {
        type: 'array',
        title: name,
        description: description,
        items: {
          $ref: `#/components/schemas/${itemType}`,
        },
      };
    } else {
      return {
        type: 'array',
        title: name,
        description: description,
        items: {
          type: itemType === 'number' ? 'number' : itemType === 'boolean' ? 'boolean' : 'string',
        },
      };
    }
  }

  // 默认处理为字符串
  return {
    type: 'string',
    title: name,
    description: description,
  };
}

/**
 * 解析属性类型
 * @param {string} typeStr - 类型字符串
 * @param {string} jsdoc - JSDoc注释
 * @param {string} fileContent - 文件内容
 * @param {Object} allTypes - 所有类型定义（用于获取中文名称）
 * @returns {Object} 属性schema
 */
function parsePropertyType(typeStr, jsdoc = '', fileContent = '', allTypes = {}) {
  const description = extractDescription(jsdoc);
  const example = extractExample(jsdoc);

  // 优先使用JSDoc中的@type信息
  const jsdocType = extractJSDocType(jsdoc);
  const actualTypeStr = jsdocType || typeStr;

  let schema = {};

  // 处理数组类型，如 ImageInfo[]
  const arrayMatch = actualTypeStr.match(/^(\w+)\[\]$/);
  if (arrayMatch) {
    const itemType = arrayMatch[1];
    // 检查是否为引用类型（首字母大写）
    if (/^[A-Z]/.test(itemType)) {
      schema = {
        type: 'array',
        items: {
          $ref: `#/components/schemas/${itemType}`,
        },
      };
    } else {
      // 基本类型数组
      schema = {
        type: 'array',
        items: {
          type: itemType === 'number' ? 'number' : itemType === 'boolean' ? 'boolean' : 'string',
        },
      };
    }
  }
  // 处理泛型数组类型，如 Array<ImageInfo>
  else if (actualTypeStr.startsWith('Array<') && actualTypeStr.endsWith('>')) {
    const itemType = actualTypeStr.slice(6, -1).trim();
    if (/^[A-Z]/.test(itemType)) {
      schema = {
        type: 'array',
        items: {
          $ref: `#/components/schemas/${itemType}`,
        },
      };
    } else {
      schema = {
        type: 'array',
        items: {
          type: itemType === 'number' ? 'number' : itemType === 'boolean' ? 'boolean' : 'string',
        },
      };
    }
  }
  // 处理联合类型，如 string | number
  else if (actualTypeStr.includes('|')) {
    const types = actualTypeStr.split('|').map((t) => t.trim());

    // 检查是否为字符串字面量联合类型
    if (types.every((t) => t.startsWith("'") && t.endsWith("'"))) {
      schema = {
        type: 'string',
        enum: types.map((t) => t.slice(1, -1)),
      };
    } else {
      // 处理类型引用的联合类型
      const mappedTypes = types.map((type) => {
        if (/^[A-Z]/.test(type)) {
          const chineseName = getChineseTypeName(type, allTypes);
          return {
            allOf: [{ $ref: `#/components/schemas/${type}` }],
            title: chineseName,
          };
        } else {
          return {
            type:
              type === 'number'
                ? 'number'
                : type === 'boolean'
                  ? 'boolean'
                  : type === 'object' || type === 'Object'
                    ? 'object'
                    : type === 'unknown'
                      ? 'object' // unknown 当作 object 处理
                      : 'string',
          };
        }
      });

      // 去重：如果所有类型都相同，直接返回单个类型
      const uniqueTypes = mappedTypes.filter((type, index, arr) => {
        return arr.findIndex((t) => JSON.stringify(t) === JSON.stringify(type)) === index;
      });

      if (uniqueTypes.length === 1) {
        schema = uniqueTypes[0];
      } else {
        schema = { oneOf: uniqueTypes };
      }
    }
  }
  // 处理引用类型（首字母大写）
  else if (/^[A-Z]/.test(actualTypeStr)) {
    // 尝试解析枚举定义
    const enumValues = parseEnumValues(fileContent, actualTypeStr);

    if (enumValues.length > 0) {
      // 生成enum schema
      const enumType = enumValues[0].type; // 所有值应该是同一类型
      schema = {
        type: enumType,
        enum: enumValues.map((item) => item.value),
        description:
          description + '\n\n可选值：\n' + enumValues.map((item) => `- ${item.value}: ${item.key}`).join('\n'),
      };
    } else {
      // 不是枚举，使用引用
      // 如果字段有自己的描述，使用allOf来保留字段描述
      if (description && description.trim()) {
        schema = {
          allOf: [
            {
              $ref: `#/components/schemas/${actualTypeStr}`,
            },
          ],
          description: description,
        };
      } else {
        schema = {
          $ref: `#/components/schemas/${actualTypeStr}`,
        };
      }
    }
  }
  // 处理基本类型
  else {
    schema = {
      type:
        actualTypeStr === 'number'
          ? 'number'
          : actualTypeStr === 'boolean'
            ? 'boolean'
            : actualTypeStr === 'object' || actualTypeStr === 'Object'
              ? 'object'
              : 'string',
    };
  }

  // 添加描述
  if (description) {
    schema.description = description;
  }

  if (example) {
    schema.example = example;
  }

  return schema;
}

/**
 * 根据类型名称获取中文显示名称
 * @param {string} typeName - 类型名称
 * @param {Object} allTypes - 所有类型定义
 * @returns {string} 中文显示名称
 */
function getChineseTypeName(typeName, allTypes) {
  const typeInfo = allTypes[typeName];
  if (!typeInfo || !typeInfo.jsdoc) {
    return typeName;
  }

  // 从JSDoc中提取中文名称，通常是第一行非标签内容
  const lines = typeInfo.jsdoc
    .replace(/\/\*\*|\*\//g, '') // 移除 /** 和 */
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim()) // 移除每行开头的 *
    .filter((line) => line && !line.startsWith('@') && !line.startsWith('//'));

  if (lines.length > 0) {
    // 提取第一行作为中文名称
    let chineseName = lines[0];

    // 针对不同的模式进行提取
    // 1. "小红书平台表单" -> "小红书"
    // 2. "抖音平台视频表单" -> "抖音"
    // 3. "快手视频发布表单" -> "快手"
    if (chineseName.includes('平台')) {
      // 提取"平台"前面的部分
      const platformMatch = chineseName.match(/^(.+?)平台/);
      if (platformMatch) {
        chineseName = platformMatch[1];
      }
    } else {
      // 清理常见的后缀，保留核心平台名称
      chineseName = chineseName
        .replace(/视频发布表单.*$/, '') // 移除"视频发布表单"等
        .replace(/发布表单.*$/, '') // 移除"发布表单"等
        .replace(/表单.*$/, '') // 移除"表单"等
        .replace(/数据结构.*$/, '') // 移除"数据结构"等
        .replace(/的.*$/, '') // 移除"的xxx"
        .trim();
    }

    if (chineseName && chineseName !== typeName) {
      return chineseName;
    }
  }

  return typeName;
}

/**
 * 从JSDoc中提取完整的描述信息
 * @param {string} jsdoc - JSDoc内容
 * @returns {string} 格式化后的完整描述
 */
function extractDescription(jsdoc) {
  if (!jsdoc) return '';

  // 清理JSDoc内容，按行分割
  const lines = jsdoc
    .replace(/\/\*\*|\*\//g, '') // 移除 /** 和 */
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, '').trim()) // 移除每行开头的 *
    .filter((line) => !line.startsWith('//')); // 只过滤注释行，保留空行

  let fieldName = '';
  let descriptionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过 @type、@example、@default 等标签
    if (
      line.startsWith('@type') ||
      line.startsWith('@example') ||
      line.startsWith('@default') ||
      line.includes('export')
    ) {
      continue;
    }

    // 处理 @description 标签
    if (line.startsWith('@description')) {
      const descText = line.replace('@description', '').trim();
      if (descText) {
        descriptionLines.push(descText);
      }
      // 继续处理后续行作为描述内容
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (nextLine.startsWith('@')) {
          break; // 遇到下一个标签，停止
        }
        if (nextLine.trim()) {
          descriptionLines.push(nextLine);
        } else {
          // 空行表示段落分隔，用特殊标记
          if (descriptionLines.length > 0 && descriptionLines[descriptionLines.length - 1] !== '<<SECTION_BREAK>>') {
            descriptionLines.push('<<SECTION_BREAK>>');
          }
        }
      }
      break;
    }

    // 如果没有@description标签，第一行非标签内容作为字段名称，后续作为描述
    if (!fieldName && !line.startsWith('@') && line.trim()) {
      fieldName = line;
    } else if (fieldName && !line.startsWith('@')) {
      if (line.trim()) {
        descriptionLines.push(line);
      } else {
        // 空行表示段落分隔，用特殊标记
        if (descriptionLines.length > 0 && descriptionLines[descriptionLines.length - 1] !== '<<SECTION_BREAK>>') {
          descriptionLines.push('<<SECTION_BREAK>>');
        }
      }
    }
  }

  // 构建最终的描述，将段落分隔符转换为双换行
  let description = descriptionLines
    .join('\n')
    .split('<<SECTION_BREAK>>')
    .map((section) => section.trim())
    .filter((section) => section)
    .join('\n\n');

  // 构建最终的描述
  if (fieldName && description) {
    return `${fieldName} - ${description}`;
  } else if (fieldName) {
    return fieldName;
  } else if (description) {
    return description;
  }

  return '';
}

/**
 * 从JSDoc中提取示例（保持向后兼容）
 * @param {string} jsdoc - JSDoc内容
 * @returns {string} 示例
 */
function extractExample(jsdoc) {
  const match = jsdoc.match(/@example\s+(.*?)(?=@\w+|$)/s);
  return match
    ? match[1]
      .trim()
      .replace(/\s*\*\s*/g, ' ')
      .replace(/"/g, '')
    : '';
}

/**
 * 从JSDoc注释中提取@type信息
 * @param {string} jsdoc - JSDoc内容
 * @returns {string|null} 类型字符串
 */
function extractJSDocType(jsdoc) {
  const typeMatch = jsdoc.match(/@type\s+\{([^}]+)\}/);
  return typeMatch ? typeMatch[1].trim() : null;
}

/**
 * 解析枚举定义并提取值
 * @param {string} content - 文件内容
 * @param {string} enumName - 枚举名称
 * @returns {Array} 枚举值数组
 */
function parseEnumValues(content, enumName) {
  // 确保enumName是一个简单的标识符，不包含特殊字符
  if (!enumName || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(enumName)) {
    return [];
  }

  try {
    const enumRegex = new RegExp(`export\\s+enum\\s+${enumName}\\s*\\{([^}]+)\\}`, 's');
    const match = content.match(enumRegex);

    if (!match) {
      return [];
    }

    const enumBody = match[1];
    const values = [];

    // 解析枚举项，支持两种格式：
    // 1. 带引号的：'自制' = 1, '转载' = 2
    // 2. 不带引号的：public = 0, private = 1

    // 先尝试匹配带引号的枚举项
    const quotedItemRegex = /['"`]([^'"`]+)['"`]\s*=\s*([^,\n]+)/g;
    let itemMatch;

    while ((itemMatch = quotedItemRegex.exec(enumBody)) !== null) {
      const key = itemMatch[1].trim();
      const value = itemMatch[2].trim();

      // 判断值的类型
      const numValue = Number(value);
      const actualValue = !isNaN(numValue) ? numValue : value.replace(/['"]/g, '');

      values.push({
        key: key,
        value: actualValue,
        type: !isNaN(numValue) ? 'number' : 'string',
      });
    }

    // 如果没有找到带引号的枚举项，尝试匹配不带引号的枚举项
    if (values.length === 0) {
      const unquotedItemRegex = /(\w+)\s*=\s*([^,\n]+)/g;
      let unquotedMatch;

      while ((unquotedMatch = unquotedItemRegex.exec(enumBody)) !== null) {
        const key = unquotedMatch[1].trim();
        const value = unquotedMatch[2].trim();

        // 判断值的类型
        const numValue = Number(value);
        const actualValue = !isNaN(numValue) ? numValue : value.replace(/['"]/g, '');

        values.push({
          key: key,
          value: actualValue,
          type: !isNaN(numValue) ? 'number' : 'string',
        });
      }
    }

    return values;
  } catch (error) {
    console.warn(`⚠️  解析枚举 ${enumName} 时出错:`, error.message);
    return [];
  }
}

/**
 * 自动发现所有平台类型文件
 * @param {string} baseDir - 基础目录
 * @returns {Array} 文件路径数组
 */
function discoverPlatformFiles(baseDir) {
  const files = [];

  // 添加公共文件
  const commonFile = path.join(baseDir, 'common.ts');
  if (fs.existsSync(commonFile)) {
    files.push(commonFile);
  }

  // 扫描video目录
  const videoDir = path.join(baseDir, 'video');
  if (fs.existsSync(videoDir)) {
    const videoFiles = fs
      .readdirSync(videoDir)
      .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
      .map((file) => path.join(videoDir, file));
    files.push(...videoFiles);

    // 添加index.ts（包含联合类型定义）
    const indexFile = path.join(videoDir, 'index.ts');
    if (fs.existsSync(indexFile)) {
      files.push(indexFile);
    }
  }

  return files;
}

/**
 * 递归发现目录下所有TypeScript文件
 * @param {string} dir - 目录路径
 * @param {Array} files - 文件数组（用于递归）
 * @returns {Array} 文件路径数组
 */
function discoverTypeScriptFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 递归搜索子目录
      discoverTypeScriptFiles(fullPath, files);
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      // 添加TypeScript文件（排除声明文件）
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 自动发现所有相关文件
 * @param {string} baseDir - 基础目录
 * @returns {Array} 文件路径数组
 */
function discoverAllRelevantFiles(baseDir) {
  const files = [];

  // 递归发现所有TypeScript文件（严格限定在输入目录内）
  const allTsFiles = discoverTypeScriptFiles(baseDir);
  files.push(...allTsFiles);

  // 不再无条件注入其他公共依赖文件，依赖通过 import 解析
  return files;
}

/**
 * 生成所有类型的schema（处理继承关系）
 * @param {Object} allTypes - 所有类型定义
 * @returns {Object} 生成的schemas
 */
function generateAllSchemas(allTypes) {
  const schemas = {};

  console.log('\n🔧 开始生成所有类型的schema...');

  // 第一步：为所有interface合并继承属性
  for (const [typeName, typeInfo] of Object.entries(allTypes)) {
    if (typeInfo.type === 'interface') {
      const mergedBody = mergeInheritedProperties(typeName, typeInfo, allTypes);
      typeInfo.mergedBody = mergedBody;
    }
  }

  // 第二步：生成所有类型的schema
  for (const [typeName, typeInfo] of Object.entries(allTypes)) {
    try {
      if (typeInfo.type === 'interface') {
        // 使用合并后的body生成schema
        const bodyToUse = typeInfo.mergedBody || typeInfo.body;
        const fileContent = fs.existsSync(typeInfo.filePath) ? fs.readFileSync(typeInfo.filePath, 'utf8') : '';
        schemas[typeName] = parseInterfaceToSchema(typeName, bodyToUse, typeInfo.jsdoc, fileContent, allTypes);
      } else if (typeInfo.type === 'type') {
        schemas[typeName] = parseTypeToSchema(typeName, typeInfo.definition, typeInfo.jsdoc, allTypes);
      }

      // 优化schema的title为中文名称
      if (schemas[typeName]) {
        const chineseName = getChineseTypeName(typeName, allTypes);
        if (chineseName !== typeName) {
          schemas[typeName].title = chineseName;
          // 同时优化description，如果原description太简单的话
          if (schemas[typeName].description === `${typeName}类型定义` || !schemas[typeName].description) {
            schemas[typeName].description = `${chineseName}的数据结构定义`;
          }
        }
      }

      console.log(`✅ 生成schema: ${typeName}`);
    } catch (error) {
      console.error(`❌ 生成${typeName}的schema时出错:`, error.message);
      // 创建一个基本的fallback schema
      schemas[typeName] = {
        type: 'object',
        title: typeName,
        description: `${typeName}类型定义（解析出错）`,
        properties: {},
      };
    }
  }

  return schemas;
}

/**
 * 主函数
 * @param {string} inputDir - 输入目录路径，默认为 './src/platform-body'
 * @param {string} outputName - 输出文件名（不含扩展名），默认为 'platform-body-complete-openapi'
 */
async function main(inputDir = './src/platform-body', outputName = 'platform-body-complete-openapi') {
  try {
    // 从路径中提取目录名作为文档标题
    const dirName = path.basename(inputDir);
    const capitalizedDirName = dirName.charAt(0).toUpperCase() + dirName.slice(1);

    console.log(`🚀 智能生成${capitalizedDirName}完整OpenAPI文档（支持继承和嵌套类型）...`);

    const baseDir = inputDir;
    const initialFiles = discoverAllRelevantFiles(baseDir);

    console.log(`📁 发现 ${initialFiles.length} 个初始TypeScript文件:`);
    initialFiles.forEach((file) => console.log(`  - ${file}`));

    // 清空全局状态
    globalTypeCache.clear();
    inheritanceMap.clear();
    allParsedTypes.clear();

    // 解析所有初始文件
    const allTypes = {};
    for (const file of initialFiles) {
      console.log(`📝 解析文件: ${file}`);
      const types = parseTypeScriptFile(file);
      Object.assign(allTypes, types);

      // 调试：显示从每个文件解析到的类型
      const typeNames = Object.keys(types);
      if (typeNames.length > 0) {
        console.log(`  ✅ 发现类型: ${typeNames.join(', ')}`);
      }
    }

    // 递归解析所有依赖
    console.log('\n🔍 开始解析类型依赖...');
    const typeNames = Object.keys(allTypes);
    for (const typeName of typeNames) {
      const typeInfo = allTypes[typeName];
      resolveDependencies(typeName, typeInfo, allTypes);
    }

    // 显示继承关系统计
    console.log(`\n📊 继承关系统计: 发现 ${inheritanceMap.size} 个继承关系`);
    for (const [child, parent] of inheritanceMap.entries()) {
      console.log(`  - ${child} extends ${parent}`);
    }

    // 检查是否包含PlatformBody
    if (!allTypes['PlatformBody']) {
      console.warn('⚠️  警告: PlatformBody类型未找到，请检查类型定义');
    } else {
      console.log('✅ PlatformBody类型已找到');
    }

    // 生成所有schemas（处理继承关系）
    const schemas = generateAllSchemas(allTypes);

    // 生成OpenAPI文档
    const openApiDoc = {
      openapi: '3.0.0',
      info: {
        title: `${capitalizedDirName} API`,
        version: '1.0.0',
        description: `${capitalizedDirName}及其所有相关类型的完整OpenAPI 3.0定义，包含所有依赖类型和继承关系，自动生成`,
      },
      components: {
        schemas: schemas,
      },
    };

    // 确保输出目录存在
    const outputDir = './schemas';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入文件
    const outputPath = path.join(outputDir, `${outputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(openApiDoc, null, 2), 'utf8');

    console.log(`\n✅ 完整OpenAPI文档已生成: ${outputPath}`);
    console.log(`📊 共生成 ${Object.keys(schemas).length} 个类型定义`);

    // 检查关键类型
    const keyTypes = ['PlatformBody', 'VideoPlatformBody', 'DynamicPlatformBody', 'ArticlePlatformBody'];
    const missingTypes = keyTypes.filter((type) => !schemas[type]);
    if (missingTypes.length > 0) {
      console.warn(`⚠️  缺失关键类型: ${missingTypes.join(', ')}`);
    } else {
      console.log('✅ 所有关键类型已包含');
    }

    // 显示一些继承类型的示例
    console.log('\n🔍 继承类型示例:');
    for (const [typeName, schema] of Object.entries(schemas)) {
      if (inheritanceMap.has(typeName)) {
        const baseType = inheritanceMap.get(typeName);
        const propertyCount = schema.properties ? Object.keys(schema.properties).length : 0;
        console.log(`  - ${typeName} (extends ${baseType}): ${propertyCount} 个属性`);
      }
    }

    console.log('\n🎯 Apifox导入说明:');
    console.log('1. 打开Apifox，进入"数据模型"页面');
    console.log('2. 点击"导入"按钮，选择"OpenAPI"');
    console.log('3. 上传 platform-body-complete-openapi.json 文件');
    console.log('4. 现在支持完整的继承关系和嵌套类型解析！');
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  // 解析命令行参数
  const args = process.argv.slice(2);

  // 显示帮助信息
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📖 使用说明：

node scripts/generate-complete-openapi.js [inputDir] [outputName]

参数：
  inputDir    输入目录路径（默认：./src/platform-body）
  outputName  输出文件名，不含扩展名（默认：platform-body-complete-openapi）

示例：
  # 使用默认参数
  node scripts/generate-complete-openapi.js
  
  # 指定输入目录
  node scripts/generate-complete-openapi.js ./src/media-platform
  
  # 指定输入目录和输出文件名
  node scripts/generate-complete-openapi.js ./src/media-platform media-platform-api
  
  # 生成其他模块的文档
  node scripts/generate-complete-openapi.js ./src/service service-api
    `);
    process.exit(0);
  }

  // 解析参数
  const inputDir = args[0] || './src/platform-body';
  const outputName =
    args[1] ||
    (inputDir === './src/platform-body'
      ? 'platform-body-complete-openapi'
      : `${path.basename(inputDir)}-complete-openapi`);

  console.log(`📋 输入目录: ${inputDir}`);
  console.log(`📄 输出文件: ${outputName}.json\n`);

  main(inputDir, outputName);
}

module.exports = { main, parseTypeScriptFile, discoverPlatformFiles };
