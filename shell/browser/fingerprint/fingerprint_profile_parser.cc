// Copyright (c) 2026 GitHub, Inc.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

#include "shell/browser/fingerprint/fingerprint_profile_parser.h"

#include <initializer_list>
#include <string_view>
#include <utility>

namespace electron::fingerprint {
namespace {

void SetError(std::string* error_message, std::string message) {
  if (error_message)
    *error_message = std::move(message);
}

bool ValidateKeys(const base::Value::Dict& value,
                  std::string_view section,
                  std::initializer_list<std::string_view> allowed_keys,
                  std::string* error_message) {
  for (const auto& entry : value) {
    bool known_key = false;
    for (const auto allowed_key : allowed_keys) {
      if (entry.first == allowed_key) {
        known_key = true;
        break;
      }
    }
    if (!known_key) {
      SetError(error_message, "Fingerprint 配置包含不支持字段: " +
                                  std::string(section) + "." + entry.first);
      return false;
    }
  }
  return true;
}

const base::Value::Dict* FindDict(const base::Value::Dict& parent,
                                  std::string_view name,
                                  std::string* error_message) {
  const auto* value = parent.FindDict(name);
  if (!value)
    SetError(error_message, "Fingerprint 配置缺少对象: " + std::string(name));
  return value;
}

const std::string* FindString(const base::Value::Dict& parent,
                              std::string_view name,
                              std::string* error_message) {
  const auto* value = parent.FindString(name);
  if (!value || value->empty())
    SetError(error_message, "Fingerprint 配置缺少字符串: " + std::string(name));
  return value;
}

std::optional<bool> FindBool(const base::Value::Dict& parent,
                             std::string_view name,
                             std::string* error_message) {
  const auto value = parent.FindBool(name);
  if (!value)
    SetError(error_message, "Fingerprint 配置缺少布尔值: " + std::string(name));
  return value;
}

std::optional<int> FindInt(const base::Value::Dict& parent,
                           std::string_view name,
                           std::string* error_message) {
  const auto value = parent.FindInt(name);
  if (!value)
    SetError(error_message, "Fingerprint 配置缺少整数: " + std::string(name));
  return value;
}

std::optional<double> FindNumber(const base::Value::Dict& parent,
                                 std::string_view name,
                                 std::string* error_message) {
  const auto* value = parent.Find(name);
  if (!value || (!value->is_double() && !value->is_int())) {
    SetError(error_message, "Fingerprint 配置缺少数字: " + std::string(name));
    return std::nullopt;
  }
  return value->is_double() ? value->GetDouble() : value->GetInt();
}

bool ParseModules(const base::Value::Dict& value,
                  ModuleFlags* modules,
                  std::string* error_message) {
#define READ_MODULE(name, field)                         \
  do {                                                    \
    const auto result = FindBool(value, name, error_message); \
    if (!result)                                           \
      return false;                                       \
    modules->field = *result;                             \
  } while (false)
  READ_MODULE("ua", ua);
  READ_MODULE("clientHints", client_hints);
  READ_MODULE("locale", locale);
  READ_MODULE("timezone", timezone);
  READ_MODULE("navigator", navigator);
  READ_MODULE("screen", screen);
  READ_MODULE("webgl", webgl);
  READ_MODULE("canvas", canvas);
  READ_MODULE("audio", audio);
  READ_MODULE("fonts", fonts);
  READ_MODULE("webrtc", webrtc);
#undef READ_MODULE
  return true;
}

}  // namespace

// static
std::optional<FingerprintConfig> FingerprintProfileParser::Parse(
    const base::Value::Dict& profile,
    std::string* error_message) {
  if (!ValidateKeys(profile, "profile",
                    {"schemaVersion", "id", "enabled", "browser", "locale",
                     "hardware", "screen", "graphics", "noise", "modules"},
                    error_message)) {
    return std::nullopt;
  }

  FingerprintConfig config;

  const auto schema_version = FindInt(profile, "schemaVersion", error_message);
  if (!schema_version)
    return std::nullopt;
  if (*schema_version != 1) {
    SetError(error_message, "不支持的 Fingerprint Schema 版本");
    return std::nullopt;
  }
  config.schema_version = *schema_version;

  const auto* profile_id = FindString(profile, "id", error_message);
  const auto enabled = FindBool(profile, "enabled", error_message);
  if (!profile_id || !enabled)
    return std::nullopt;
  config.profile_id = *profile_id;
  config.enabled = *enabled;

  const auto* browser = FindDict(profile, "browser", error_message);
  const auto* locale = FindDict(profile, "locale", error_message);
  const auto* hardware = FindDict(profile, "hardware", error_message);
  const auto* screen = FindDict(profile, "screen", error_message);
  const auto* graphics = FindDict(profile, "graphics", error_message);
  const auto* noise = FindDict(profile, "noise", error_message);
  const auto* modules = FindDict(profile, "modules", error_message);
  if (!browser || !locale || !hardware || !screen || !graphics || !noise ||
      !modules) {
    return std::nullopt;
  }
  if (!ValidateKeys(*browser, "browser",
                    {"family", "chromiumMajor", "userAgent", "acceptLanguage"},
                    error_message) ||
      !ValidateKeys(*locale, "locale", {"language", "languages", "timezone"},
                    error_message) ||
      !ValidateKeys(*hardware, "hardware",
                    {"hardwareConcurrency", "deviceMemory", "platform"},
                    error_message) ||
      !ValidateKeys(*screen, "screen",
                    {"width", "height", "availWidth", "availHeight",
                     "deviceScaleFactor"},
                    error_message) ||
      !ValidateKeys(*graphics, "graphics", {"webglVendor", "webglRenderer"},
                    error_message) ||
      !ValidateKeys(*noise, "noise", {"seed", "canvas", "audio", "rects"},
                    error_message) ||
      !ValidateKeys(*modules, "modules",
                    {"ua", "clientHints", "locale", "timezone", "navigator",
                     "screen", "webgl", "canvas", "audio", "fonts", "webrtc"},
                    error_message)) {
    return std::nullopt;
  }

  const auto* family = FindString(*browser, "family", error_message);
  const auto chromium_major = FindInt(*browser, "chromiumMajor", error_message);
  const auto* accept_language =
      FindString(*browser, "acceptLanguage", error_message);
  if (!family || !chromium_major || !accept_language)
    return std::nullopt;
  if (*family != "Chrome") {
    SetError(error_message, "Fingerprint 浏览器类型必须为 Chrome");
    return std::nullopt;
  }
  if (*chromium_major != 138) {
    SetError(error_message, "Fingerprint 配置的 Chromium 主版本必须为 138");
    return std::nullopt;
  }
  config.browser.chromium_major = *chromium_major;
  config.browser.accept_language = *accept_language;
  if (const auto* user_agent = browser->FindString("userAgent"))
    config.browser.user_agent = *user_agent;

  const auto* language = FindString(*locale, "language", error_message);
  const auto* timezone = FindString(*locale, "timezone", error_message);
  const auto* languages = locale->FindList("languages");
  if (!language || !timezone || !languages || languages->empty())
    return std::nullopt;
  if (language->size() < 2) {
    SetError(error_message, "Fingerprint language 至少需要 2 个字符");
    return std::nullopt;
  }
  config.locale.language = *language;
  config.locale.timezone = *timezone;
  for (const auto& item : *languages) {
    if (!item.is_string() || item.GetString().size() < 2) {
      SetError(error_message,
               "Fingerprint languages 必须是长度至少为 2 的字符串数组");
      return std::nullopt;
    }
    config.locale.languages.push_back(item.GetString());
  }

  const auto hardware_concurrency =
      FindInt(*hardware, "hardwareConcurrency", error_message);
  const auto device_memory = FindInt(*hardware, "deviceMemory", error_message);
  const auto* platform = FindString(*hardware, "platform", error_message);
  if (!hardware_concurrency || !device_memory || !platform)
    return std::nullopt;
  if (*hardware_concurrency < 1 || *hardware_concurrency > 1024 ||
      *device_memory < 1 || *device_memory > 1024) {
    SetError(error_message, "Fingerprint 硬件参数范围无效");
    return std::nullopt;
  }
  config.hardware.hardware_concurrency = *hardware_concurrency;
  config.hardware.device_memory_gb = *device_memory;
  config.hardware.platform = *platform;
  if (config.hardware.platform != "Win32" &&
      config.hardware.platform != "MacIntel" &&
      config.hardware.platform != "Linux x86_64") {
    SetError(error_message,
             "Fingerprint 平台必须为 Win32、MacIntel 或 Linux x86_64");
    return std::nullopt;
  }

  const auto width = FindInt(*screen, "width", error_message);
  const auto height = FindInt(*screen, "height", error_message);
  const auto avail_width = FindInt(*screen, "availWidth", error_message);
  const auto avail_height = FindInt(*screen, "availHeight", error_message);
  const auto scale = FindNumber(*screen, "deviceScaleFactor", error_message);
  if (!width || !height || !avail_width || !avail_height || !scale)
    return std::nullopt;
  if (*width < 1 || *height < 1 || *avail_width < 1 || *avail_height < 1 ||
      *avail_width > *width || *avail_height > *height || *scale <= 0) {
    SetError(error_message, "Fingerprint 屏幕参数无效");
    return std::nullopt;
  }
  config.screen.width = *width;
  config.screen.height = *height;
  config.screen.avail_width = *avail_width;
  config.screen.avail_height = *avail_height;
  config.screen.device_scale_factor = *scale;

  const auto* webgl_vendor = FindString(*graphics, "webglVendor", error_message);
  const auto* webgl_renderer =
      FindString(*graphics, "webglRenderer", error_message);
  if (!webgl_vendor || !webgl_renderer)
    return std::nullopt;
  config.graphics.webgl_vendor = *webgl_vendor;
  config.graphics.webgl_renderer = *webgl_renderer;

  const auto* seed = FindString(*noise, "seed", error_message);
  const auto canvas = FindBool(*noise, "canvas", error_message);
  const auto audio = FindBool(*noise, "audio", error_message);
  const auto rects = FindBool(*noise, "rects", error_message);
  if (!seed || !canvas || !audio || !rects)
    return std::nullopt;
  config.noise.seed = *seed;
  config.noise.canvas = *canvas;
  config.noise.audio = *audio;
  config.noise.rects = *rects;

  if (!ParseModules(*modules, &config.modules, error_message))
    return std::nullopt;

  return config;
}

}  // namespace electron::fingerprint
