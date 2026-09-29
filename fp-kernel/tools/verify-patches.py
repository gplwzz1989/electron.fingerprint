#!/usr/bin/env python3
"""验证 Electron Chromium Patch System 的基础文件存在。"""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    required = [ROOT / "patches" / "chromium" / ".patches", ROOT / "fp-kernel" / "docs" / "PATCH_REGISTRY.md"]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise SystemExit(f"补丁基础文件缺失: {', '.join(missing)}")
    print("补丁基础文件验证通过")


if __name__ == "__main__":
    main()
