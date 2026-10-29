# 客户端更新与云端指纹

## 客户端自动更新

版本 0.1.1 开始支持 Windows x64 自动更新。启动十秒后检查，此后每六小时检查；发现更高版本后自动下载。只有清单 Ed25519 签名、环境、平台、有效期、文件大小与 SHA-256 全部通过才允许安装。设置页与浏览器菜单均提供检查和安装入口。安装前明确提示保存网页操作，客户端正常落盘退出；独立辅助进程等待退出并再次核对文件摘要，然后请求 Windows 安装权限。用户可以稍后安装，不强制关闭其他客户端，不关闭防护软件或绕过 UAC。

当前发布格式沿用项目 NSIS 安装包，不适用于直接调用仅支持其他安装格式的内置更新接口。便携运行时选择安装更新会进入系统安装目录；不在便携目录原位覆盖。macOS/Linux 目前显示不支持自动安装，不会下载或执行 Windows 安装包。

旧版本 0.1.0 没有更新器，首次需要手动安装 0.1.1；以后可走自动更新。

### 配置

`build-config.example.json` 的 dev/test/prod 各自包含：

- `appUrl`：固定 SaaS 页面地址。
- `updateUrl`：签名更新清单地址；留空默认使用 SaaS 的 `/api/client-updates/{环境}/win32/x64.json`。
- `updatePublicKey`：Ed25519 公钥 PEM 字符串，只包含公钥。
- `updatesEnabled`：是否开启更新。显式开启而缺少公钥时拒绝打包/启动，避免形成无法验证的更新链路。

打包仅写入当前环境配置。私钥不得写入客户端、更新公开目录或 Git。test/prod 必须使用 HTTPS；dev 允许本机 HTTP。变更签名公钥前需先发布兼容旧信任链的客户端，不支持直接用不匹配的新密钥替换清单。

### 发布步骤

在仓库根目录执行（实际路径自行配置）：

```powershell
node fingerprint-browser/scripts/publish-update.js --init-keys saas-server/data/update-signing/prod
```

将生成的 `update-public.pem` 内容填写到 prod 打包配置 `updatePublicKey`，私钥留在发布机器。提升 `fingerprint-browser/package.json` 版本并运行现有打包脚本，随后发布真实安装包：

```powershell
node fingerprint-browser/scripts/publish-update.js --key saas-server/data/update-signing/prod/update-private.pem --artifact dist/release/指纹浏览器-安装包.exe --output saas-server/data/client-updates --version 0.1.2 --channel prod --base-url https://部署地址
```

示例中的 0.1.2 是下一版本号，必须与实际安装包版本一致；此脚本不会替代打包。公开目录生成不可变文件名安装包及 `prod-win32-x64.json` 清单，清单默认有效三十天，需在过期前重新发布签名。服务端 `.env.prod` 的 `CLIENT_UPDATES_DIR` 指向该目录，相对路径按配置文件目录解析。目录只放清单和可公开的安装包。服务未配置目录或无对应清单时返回 204；无需用户登录即可检查更新，清单真实性由包内公钥校验。

## 云端指纹生成与加密

- SaaS 生成默认参数、随机硬件组合和最终噪声种子，客户端与网页不再调用本地随机生成算法。编辑页面仍显示用户有权限管理的参数；服务端再次校验参数自洽性，并忽略页面指定的最终运行种子。
- MySQL `fingerprint_versions.profile` 和环境指纹快照均保存 AES-256-GCM 密文；启动自动在事务中迁移旧明文格式，保留 ID、版本和原种子。
- 服务端密钥沿用数据目录 `encryption.key`，必须随数据库备份和保留，不能在升级时替换。密钥不匹配会阻止解密，不回退为明文。
- 环境启动为严格加密协议，不再返回明文 `profile`。客户端主进程每次生成临时 RSA 公钥及随机请求标识；服务端校验团队权限和代理后，以随机 AES-256-GCM 密钥加密配置，再以 RSA-OAEP-SHA256 包装 AES 密钥。密文绑定团队、环境、请求标识和六十秒时限。
- 私钥只在请求所属主进程内存中存在；解密与认证成功后交给现有内核适配入口，网页没有解密桥接。请求结果只能使用一次，跨请求、过期或篡改均拒绝。HTTPS 与已有登录、CSRF、团队权限仍然生效。
- 本机环境配置、快照、配置缓存和正常备份通过 Electron 安全存储保护，Windows 使用当前系统账户的安全能力。旧本机数据在读取后迁移；跨设备应从 SaaS 重新同步，不能直接复制受设备保护的缓存。
- 旧本地自动化创建入口同样调用服务端保存最终指纹。有多个团队时须提供 `workspaceId`；未登录或服务不可用时失败，不在本机生成替代结果。已下载的本机环境仍可按既有恢复入口打开。

## 验证入口与边界

`npm run test:client-security` 验证签名、摘要、时限、版本、权限和加密请求。服务端 `npm test` 使用独立 MySQL 验证版本锁定、权限和旧快照迁移。`test/cloud-fingerprint-runtime.js` 使用现有 Electron 运行时、独立 MySQL 和本机 SMTP 验证实际解密启动与系统安全缓存；需要给脚本传入输出 JSON 路径。

实际 UAC 确认、安装到受保护系统目录和安装后的重启需要 Windows 桌面安装验收；仅下载/验签测试不能宣称这一步已通过。新服务端不兼容旧客户端的明文启动协议，应先分发 0.1.1 客户端，再切换服务端并执行迁移。
