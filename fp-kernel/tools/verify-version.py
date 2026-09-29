#!/usr/bin/env python3
"""验证 FP Runtime 版本清单。"""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "runtimeVersion": "37.2.6-fp.0.1.0",
    "electron": "37.2.6",
    "chromium": "138.0.7204.185",
    "kernel": "0.1.0",
    "profileSchema": 1,
}


def main() -> None:
    data = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    actual = {
        "runtimeVersion": data["runtimeVersion"],
        "electron": data["upstream"]["electron"],
        "chromium": data["upstream"]["chromium"],
        "kernel": data["fingerprint"]["kernel"],
        "profileSchema": data["fingerprint"]["profileSchema"],
    }
    if actual != EXPECTED:
        raise SystemExit(f"版本清单不匹配: {actual}")
    print("版本清单验证通过")


if __name__ == "__main__":
    main()
