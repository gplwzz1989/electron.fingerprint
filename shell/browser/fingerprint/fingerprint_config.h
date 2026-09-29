// Copyright (c) 2026 GitHub, Inc.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

#ifndef ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_CONFIG_H_
#define ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_CONFIG_H_

#include <string>
#include <vector>

#include "base/values.h"

namespace electron::fingerprint {

struct BrowserFingerprint {
  std::string user_agent;
  std::string accept_language;
  int chromium_major = 138;
};

struct LocaleFingerprint {
  std::string language;
  std::vector<std::string> languages;
  std::string timezone;
};

struct HardwareFingerprint {
  int hardware_concurrency = 0;
  int device_memory_gb = 0;
  std::string platform;
};

struct ScreenFingerprint {
  int width = 0;
  int height = 0;
  int avail_width = 0;
  int avail_height = 0;
  double device_scale_factor = 1.0;
};

struct GraphicsFingerprint {
  std::string webgl_vendor;
  std::string webgl_renderer;
};

struct NoiseFingerprint {
  std::string seed;
  bool canvas = false;
  bool audio = false;
  bool rects = false;
};

struct ModuleFlags {
  bool ua = false;
  bool client_hints = false;
  bool locale = false;
  bool timezone = false;
  bool navigator = false;
  bool screen = false;
  bool webgl = false;
  bool canvas = false;
  bool audio = false;
  bool fonts = false;
};

struct FingerprintConfig {
  int schema_version = 1;
  std::string profile_id;
  bool enabled = false;
  BrowserFingerprint browser;
  LocaleFingerprint locale;
  HardwareFingerprint hardware;
  ScreenFingerprint screen;
  GraphicsFingerprint graphics;
  NoiseFingerprint noise;
  ModuleFlags modules;

  base::Value::Dict ToValue() const;
};

}  // namespace electron::fingerprint

#endif  // ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_CONFIG_H_
