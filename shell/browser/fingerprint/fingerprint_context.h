// Copyright (c) 2026 GitHub, Inc.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

#ifndef ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_CONTEXT_H_
#define ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_CONTEXT_H_

#include <cstdint>
#include <optional>

#include "shell/browser/fingerprint/fingerprint_config.h"

namespace electron::fingerprint {

class FingerprintContext {
 public:
  FingerprintContext() = default;
  FingerprintContext(const FingerprintContext&) = delete;
  FingerprintContext& operator=(const FingerprintContext&) = delete;

  void SetConfig(FingerprintConfig config);
  const FingerprintConfig* GetConfig() const;
  void ClearConfig();
  void MarkRendererCreated();
  bool CanModify() const { return !renderer_created_; }
  bool IsEnabled() const;
  uint64_t revision() const { return revision_; }

 private:
  std::optional<FingerprintConfig> config_;
  uint64_t revision_ = 0;
  bool renderer_created_ = false;
};

}  // namespace electron::fingerprint

#endif  // ELECTRON_SHELL_BROWSER_FINGERPRINT_FINGERPRINT_CONTEXT_H_
