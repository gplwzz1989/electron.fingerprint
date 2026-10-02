// Copyright (c) 2026 GitHub, Inc.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

#include "shell/browser/fingerprint/fingerprint_config.h"

#include <utility>

namespace electron::fingerprint {

base::Value::Dict FingerprintConfig::ToValue() const {
  base::Value::Dict browser_value;
  browser_value.Set("family", "Chrome");
  browser_value.Set("chromiumMajor", browser.chromium_major);
  browser_value.Set("userAgent", browser.user_agent.empty()
                                      ? base::Value()
                                      : base::Value(browser.user_agent));
  browser_value.Set("acceptLanguage", browser.accept_language);

  base::Value::List languages;
  for (const auto& language : locale.languages)
    languages.Append(language);

  base::Value::Dict locale_value;
  locale_value.Set("language", locale.language);
  locale_value.Set("languages", std::move(languages));
  locale_value.Set("timezone", locale.timezone);

  base::Value::Dict hardware_value;
  hardware_value.Set("hardwareConcurrency", hardware.hardware_concurrency);
  hardware_value.Set("deviceMemory", hardware.device_memory_gb);
  hardware_value.Set("platform", hardware.platform);

  base::Value::Dict screen_value;
  screen_value.Set("width", screen.width);
  screen_value.Set("height", screen.height);
  screen_value.Set("availWidth", screen.avail_width);
  screen_value.Set("availHeight", screen.avail_height);
  screen_value.Set("deviceScaleFactor", screen.device_scale_factor);

  base::Value::Dict graphics_value;
  graphics_value.Set("webglVendor", graphics.webgl_vendor);
  graphics_value.Set("webglRenderer", graphics.webgl_renderer);

  base::Value::Dict noise_value;
  noise_value.Set("seed", noise.seed);
  noise_value.Set("canvas", noise.canvas);
  noise_value.Set("audio", noise.audio);
  noise_value.Set("rects", noise.rects);

  base::Value::Dict modules_value;
  modules_value.Set("ua", modules.ua);
  modules_value.Set("clientHints", modules.client_hints);
  modules_value.Set("locale", modules.locale);
  modules_value.Set("timezone", modules.timezone);
  modules_value.Set("navigator", modules.navigator);
  modules_value.Set("screen", modules.screen);
  modules_value.Set("webgl", modules.webgl);
  modules_value.Set("canvas", modules.canvas);
  modules_value.Set("audio", modules.audio);
  modules_value.Set("fonts", modules.fonts);
  modules_value.Set("webrtc", modules.webrtc);
  if (modules.runtime_inspector.has_value()) {
    modules_value.Set("runtimeInspector", *modules.runtime_inspector);
  }

  base::Value::Dict value;
  value.Set("schemaVersion", schema_version);
  value.Set("id", profile_id);
  value.Set("enabled", enabled);
  value.Set("browser", std::move(browser_value));
  value.Set("locale", std::move(locale_value));
  value.Set("hardware", std::move(hardware_value));
  value.Set("screen", std::move(screen_value));
  value.Set("graphics", std::move(graphics_value));
  value.Set("noise", std::move(noise_value));
  value.Set("modules", std::move(modules_value));
  return value;
}

}  // namespace electron::fingerprint
