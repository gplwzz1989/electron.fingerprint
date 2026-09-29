#!/usr/bin/env python3
"""从版本清单生成运行时 Manifest。"""

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="生成 FP Runtime Manifest")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    manifest = {
        "runtimeVersion": version["runtimeVersion"],
        "upstream": version["upstream"],
        "fingerprint": version["fingerprint"],
        "adapter": version["adapter"],
    }
    args.output.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"已生成 Manifest: {args.output}")


if __name__ == "__main__":
    main()
