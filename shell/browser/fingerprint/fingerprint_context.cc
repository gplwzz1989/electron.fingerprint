// Copyright (c) 2026 GitHub, Inc.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file.

#include "shell/browser/fingerprint/fingerprint_context.h"

#include <utility>

namespace electron::fingerprint {

void FingerprintContext::SetConfig(FingerprintConfig config) {
  config_ = std::move(config);
  ++revision_;
}

const FingerprintConfig* FingerprintContext::GetConfig() const {
  return config_ ? &*config_ : nullptr;
}

void FingerprintContext::ClearConfig() {
  config_.reset();
  ++revision_;
}

void FingerprintContext::MarkRendererCreated() {
  renderer_created_ = true;
}

bool FingerprintContext::IsEnabled() const {
  return config_ && config_->enabled;
}

}  // namespace electron::fingerprint
