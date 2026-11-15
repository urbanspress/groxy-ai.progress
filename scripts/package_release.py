#!/usr/bin/env python3
"""
Package Groxy AI release bundle and compute SHA256SUMS.txt for GitHub Release distribution.
"""

import hashlib
import shutil
import sys
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        while chunk := fh.read(65536):
            h.update(chunk)
    return h.hexdigest()


def collect_release_files():
    include_dirs = ["src", "views", "public", "assets", "playbook"]
    include_files = ["grab.platform.json", "README.md", "CHANGELOG.md", "GROXY-EXPERT.md", "LICENSE"]
    files = []

    for fname in include_files:
        p = REPO_ROOT / fname
        if p.exists() and p.is_file():
            files.append(p)

    for dname in include_dirs:
        dpath = REPO_ROOT / dname
        if not dpath.exists():
            continue
        for item in sorted(dpath.rglob("*")):
            if item.is_file() and "__pycache__" not in item.parts:
                files.append(item)

    return files


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else "0.1.0"
    version_tag = version.lstrip("v")

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    bundle_name = f"groxy-ai-v{version_tag}-bundle.zip"
    bundle_path = DIST_DIR / bundle_name

    files = collect_release_files()
    with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for file_path in files:
            rel = file_path.relative_to(REPO_ROOT).as_posix()
            zf.write(file_path, arcname=f"groxy-ai-v{version_tag}/{rel}")

    checksum_targets = [bundle_path]
    pdf_path = REPO_ROOT / "docs" / "releases" / "pdf" / f"Groxy-AI-v{version_tag}-Guide.pdf"
    if pdf_path.exists():
        dist_pdf = DIST_DIR / pdf_path.name
        shutil.copyfile(pdf_path, dist_pdf)
        checksum_targets.append(dist_pdf)

    sums_lines = [f"{sha256_file(p)}  {p.name}" for p in checksum_targets]
    sums_path = DIST_DIR / "SHA256SUMS.txt"
    sums_path.write_text("\n".join(sums_lines) + "\n", encoding="utf-8")

    print(f"Packaged {bundle_path} ({len(files)} files, {bundle_path.stat().st_size} bytes)")
    print(f"Wrote {sums_path}:")
    for line in sums_lines:
        print(f"  {line}")


if __name__ == "__main__":
    main()
