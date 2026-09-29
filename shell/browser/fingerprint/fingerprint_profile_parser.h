// Copyright (c) 2026 GitHub, Inc.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

#ifndef ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_PROFILE_PARSER_H_
#define ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_PROFILE_PARSER_H_

#include <optional>
#include <string>

#include "shell/browser/fingerprint/fingerprint_config.h"

namespace electron::fingerprint {

class FingerprintProfileParser {
 public:
  static std::optional<FingerprintConfig> Parse(
      const base::Value::Dict& profile,
      std::string* error_message);
};

}  // namespace electron::fingerprint

#endif  // ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_PROFILE_PARSER_H_
