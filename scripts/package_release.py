#!/usr/bin/env python3
"""
Package Groxy AI release bundle and compute SHA256SUMS.txt for GitHub Release distribution.
"""

import hashlib
import json
import shutil
import subprocess
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


def validate_read_only_inspection_alias():
    """Ensure the release carries a distinct alias for CLI read-only grants."""
    config_path = REPO_ROOT / "grab.data.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    connections = config.get("connections", {})
    commerce = connections.get("commerce")
    inspection = connections.get("commerce_inspect")
    if not isinstance(commerce, dict) or not isinstance(inspection, dict):
        raise ValueError("grab.data.json must declare commerce and commerce_inspect aliases")
    if commerce != inspection:
        raise ValueError("commerce_inspect must resolve to the same connection definition as commerce")


def collect_release_files():
    validate_read_only_inspection_alias()
    include_dirs = ["src", "views", "public", "assets", "playbook", "deploy", ".agents"]
    include_files = ["grab.platform.json", "grab.data.json", "scripts/migrate_commerce.grab", "README.md", "CHANGELOG.md", "GROXY-EXPERT.md", "LICENSE"]
    files = []
    tracked = set(
        subprocess.check_output(
            ["git", "ls-files", "--cached"], cwd=REPO_ROOT, text=True
        ).splitlines()
    )
    new_v120_modules = {
        "assets/batch-campaign.js",
        "assets/brand-dna.js",
        "public/groxy/batch-campaign.js",
        "public/groxy/brand-dna.js",
    }
    new_v130_modules = {
        "public/groxy/email-flows.js",
        "assets/email-flows.js",
        "tests/unit_email_flows.test.js",
    }
    new_v140_modules = {
        "grab.data.json",
        "assets/commerce-engines.js",
        "public/groxy/commerce-engines.js",
        "tests/unit_commerce_engines.test.js",
        "scripts/migrate_commerce.grab",
    }
    new_v150_modules = {
        "assets/db-consultant.js",
        "public/groxy/db-consultant.js",
        "tests/unit_db_consultant.test.js",
    }
    new_v160_modules = {
        "playbook/design-craft.v1.json",
        "assets/section-copilot.js",
        "public/groxy/section-copilot.js",
        "tests/unit_section_copilot.test.js",
    }
    new_v170_modules = {
        "playbook/genres/urban-fiction.v1.json",
        "playbook/genres/thriller.v1.json",
        "playbook/genres/romance.v1.json",
        "playbook/genres/sci-fi-fantasy.v1.json",
        "playbook/genres/self-help-reentry.v1.json",
        "playbook/genres/true-crime.v1.json",
        ".agents/skills/genre-research/SKILL.md",
        "assets/author-studio.js",
        "public/groxy/author-studio.js",
        "tests/unit_author_studio.test.js",
    }
    new_v180_modules = {
        "playbook/knowledge/seo-rules.v1.json",
        "playbook/knowledge/schema-org-reference.v1.json",
        "playbook/knowledge/wcag-patterns.v1.json",
        "playbook/knowledge/conversion-copywriting.v1.json",
        "playbook/knowledge/correctional-publishing.v1.json",
        "playbook/market/bestseller-radar.v1.json",
        "assets/research-radar.js",
        "public/groxy/research-radar.js",
        "tests/unit_research_radar.test.js",
    }

    for fname in include_files:
        p = REPO_ROOT / fname
        if p.exists() and p.is_file() and (fname in tracked or fname in new_v140_modules or fname in new_v150_modules or fname in new_v160_modules or fname in new_v170_modules or fname in new_v180_modules):
            files.append(p)

    for dname in include_dirs:
        dpath = REPO_ROOT / dname
        if not dpath.exists():
            continue
        for item in sorted(dpath.rglob("*")):
            rel = item.relative_to(REPO_ROOT).as_posix()
            if (
                item.is_file()
                and "__pycache__" not in item.parts
                and (rel in tracked or rel in new_v120_modules or rel in new_v130_modules or rel in new_v140_modules or rel in new_v150_modules or rel in new_v160_modules or rel in new_v170_modules or rel in new_v180_modules)
            ):
                files.append(item)

    return files


def main():
    version = sys.argv[1] if len(sys.argv) > 1 else "1.0.0"
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
