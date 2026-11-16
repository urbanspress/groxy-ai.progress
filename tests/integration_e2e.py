#!/usr/bin/env python3
"""
Groxy AI v1.2.0 — Full Cross-Layer End-to-End Verification Suite.

Runs 3 non-negotiable gates:
  Gate 1: Static analysis (grab check), non-destructive canonical formatting (grab format byte-for-byte),
          .grab.html compile probe, deploy/ --read-only manifest verification, and zero wrapper-<div> / zero-innerHTML source verification.
  Gate 2: Node unit & DOM accessibility suite (node --test tests/unit_*.test.js).
  Gate 3: Live cross-layer integration spinning up:
            - Core GRAB v1.1.0 `grab mcp` stdio JSON-RPC 2.0 server
            - GrabLab CMS v1.0.1 (isolated temp copy)
            - Grex Theme Builder v1.0.0 (isolated temp copy)
            - Groxy AI v1.2.0 (src/groxy.grab)
"""

import http.cookiejar
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def find_grab_binary() -> str:
    env_bin = os.environ.get("GRAB_BIN")
    if env_bin and Path(env_bin).exists():
        return env_bin
    on_path = shutil.which("grab")
    if on_path:
        return on_path
    candidates = [
        Path(r"C:\Development\GRAB\dist\grab-windows-amd64.exe"),
        Path(r"C:\Development\GRAB\grab.exe"),
        Path("/usr/local/bin/grab"),
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    raise FileNotFoundError("Could not locate GRAB v1.1.0 binary (set GRAB_BIN or install grab).")


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def run_cmd(cmd, cwd=None, check=True):
    proc = subprocess.run(
        cmd,
        cwd=str(cwd or REPO_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if check and proc.returncode != 0:
        raise AssertionError(
            f"Command failed ({proc.returncode}): {' '.join(cmd)}\n"
            f"STDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        )
    return proc


def http_request(url, method="GET", headers=None, json_body=None, opener=None):
    hdrs = dict(headers or {})
    data = None
    if json_body is not None:
        data = json.dumps(json_body).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        resp = opener.open(req, timeout=10) if opener else urllib.request.urlopen(req, timeout=10)
        body = resp.read().decode("utf-8", errors="replace")
        return resp.status, {k.lower(): v for k, v in resp.headers.items()}, body
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        return err.code, {k.lower(): v for k, v in err.headers.items()}, body


def wait_for_health(base_url, proc, label, timeout_s=20.0, log_path=None):
    deadline = time.time() + timeout_s
    last_err = None
    while time.time() < deadline:
        if proc.poll() is not None:
            log_text = ""
            if log_path and Path(log_path).exists():
                log_text = Path(log_path).read_text(encoding="utf-8", errors="replace")
            raise AssertionError(
                f"{label} exited prematurely with code {proc.returncode}.\nLOG:\n{log_text}"
            )
        try:
            status, _, body = http_request(f"{base_url}/_health")
            if status == 200:
                return json.loads(body)
        except Exception as exc:
            last_err = exc
        time.sleep(0.25)
    raise AssertionError(f"Timed out waiting for {label} /_health: {last_err}")


def copy_clean_dir(src_dir: Path, dst_dir: Path):
    ignore = shutil.ignore_patterns("storage", ".git", "node_modules", "__pycache__", "dist")
    shutil.copytree(src_dir, dst_dir, ignore=ignore, dirs_exist_ok=True)
    (dst_dir / "storage").mkdir(parents=True, exist_ok=True)


def terminate_process(proc):
    if proc is None or proc.poll() is not None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)


def gate_1_static_and_format(grab_bin: str):
    print("[Gate 1] Running grab check, non-destructive grab format, .grab.html probe & zero-<div> checks...")
    groxy_grab = REPO_ROOT / "src" / "groxy.grab"
    run_cmd([grab_bin, "check", "--platform-config", "grab.platform.json", "src/groxy.grab"])

    # Non-destructive canonical format verification
    fmt_proc = subprocess.run(
        [grab_bin, "format", "src/groxy.grab"],
        cwd=str(REPO_ROOT),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert fmt_proc.returncode == 0, f"grab format failed: {fmt_proc.stderr.decode('utf-8', 'replace')}"
    disk_bytes = groxy_grab.read_bytes()
    assert fmt_proc.stdout == disk_bytes, (
        f"src/groxy.grab differs from canonical `grab format` output "
        f"(disk={len(disk_bytes)} bytes, formatted={len(fmt_proc.stdout)} bytes). Run `grab format --write src/groxy.grab`."
    )

    # Probe views/dashboard.grab.html compilation directly through GRAB template validator
    probe_dir = Path(tempfile.mkdtemp(prefix="groxy_html_probe_"))
    try:
        probe_view = probe_dir / "dashboard.grab.html"
        shutil.copyfile(REPO_ROOT / "views" / "dashboard.grab.html", probe_view)
        probe_grab = probe_dir / "probe.grab"
        probe_grab.write_text(
            'use server\n'
            'set csrf_token to "tok"\n'
            'set groxy_css_url to "/static/groxy/groxy.css"\n'
            'set dashboard_js_url to "/static/groxy/dashboard.js"\n'
            'route "GET" "/probe"\n'
            '  give back server.html using "dashboard.grab.html", '
            'record {csrf_token: csrf_token, groxy_css_url: groxy_css_url, dashboard_js_url: dashboard_js_url}\n'
            'end\n',
            encoding="utf-8",
        )
        run_cmd([grab_bin, "check", "probe.grab", "dashboard.grab.html"], cwd=probe_dir)
    finally:
        shutil.rmtree(probe_dir, ignore_errors=True)

    # Zero wrapper-<div> & zero-innerHTML verification across source templates & assets
    view_html = (REPO_ROOT / "views" / "dashboard.grab.html").read_text(encoding="utf-8")
    assert re.search(r"<div\b", view_html, re.IGNORECASE) is None, "views/dashboard.grab.html must contain zero <div> elements"
    assert "{csrf_token}" in view_html, "views/dashboard.grab.html missing {csrf_token}"

    for js_file in [
        REPO_ROOT / "public" / "groxy" / "playbook.js",
        REPO_ROOT / "public" / "groxy" / "auditor.js",
        REPO_ROOT / "public" / "groxy" / "booster.js",
        REPO_ROOT / "public" / "groxy" / "generator.js",
        REPO_ROOT / "public" / "groxy" / "site-context.js",
        REPO_ROOT / "public" / "groxy" / "mcp-client.js",
        REPO_ROOT / "public" / "groxy" / "dashboard.js",
        REPO_ROOT / "public" / "groxy" / "vision-clone.js",
    ]:
        src = js_file.read_text(encoding="utf-8")
        code_only = re.sub(r"/\*[\s\S]*?\*/|//.*", "", src)
        assert ".innerHTML" not in code_only, f"{js_file.name} must never reference .innerHTML"
        assert not re.search(r"\beval\s*\(", code_only), f"{js_file.name} must never call eval()"

    # Hardened --read-only container deployment verification
    compose_path = REPO_ROOT / "deploy" / "docker-compose.yml"
    deploy_readme_path = REPO_ROOT / "deploy" / "README.md"
    assert compose_path.exists(), "deploy/docker-compose.yml missing"
    assert deploy_readme_path.exists(), "deploy/README.md missing"
    compose_text = compose_path.read_text(encoding="utf-8")
    deploy_readme_text = deploy_readme_path.read_text(encoding="utf-8")
    assert "read_only: true" in compose_text
    assert "no-new-privileges:true" in compose_text
    assert "cap_drop:" in compose_text and "ALL" in compose_text
    assert "/tmp:rw,noexec,nosuid" in compose_text
    assert "../storage:/app/storage:rw" in compose_text
    assert "../cache:/app/cache:rw" in compose_text
    assert not re.search(r"\b(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)\b", compose_text + "\n" + deploy_readme_text)

    print("  [PASS] Gate 1 complete.")


def gate_2_node_tests():
    print("[Gate 2] Running Node unit & DOM tests (node --test)...")
    run_cmd([
        "node",
        "--test",
        "tests/unit_playbook.test.js",
        "tests/unit_auditor.test.js",
        "tests/unit_booster.test.js",
        "tests/unit_generator.test.js",
        "tests/unit_site_intelligence.test.js",
        "tests/unit_enrichment.test.js",
        "tests/unit_mcp_client.test.js",
        "tests/unit_ui_dom.test.js",
        "tests/unit_vision_clone.test.js",
        "tests/unit_brand_dna_batch.test.js",
        "tests/unit_v100_production_audit.test.js",
    ])
    print("  [PASS] Gate 2 complete (all unit & DOM tests passed).")


def gate_3a_grab_mcp_stdio(grab_bin: str):
    print("[Gate 3A] Verifying GRAB v1.1.0 `grab mcp` stdio JSON-RPC 2.0 bridge...")
    requests = [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "groxy-e2e", "version": "0.1.0"},
            },
        },
        {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "grab_check",
                "arguments": {"file": "src/groxy.grab", "platform_config": "grab.platform.json"},
            },
        },
        {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {"name": "grab_inspect_routes", "arguments": {"file": "src/groxy.grab"}},
        },
        {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {"name": "grab_check", "arguments": {"file": ".env"}},
        },
    ]
    payload = "\n".join(json.dumps(r) for r in requests) + "\n"
    proc = subprocess.run(
        [grab_bin, "mcp", "--workspace", str(REPO_ROOT), "--platform-config", "grab.platform.json"],
        input=payload,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        timeout=15,
    )
    assert proc.returncode == 0, f"grab mcp exited {proc.returncode}: {proc.stderr}"
    responses = {}
    for line in proc.stdout.strip().splitlines():
        obj = json.loads(line)
        responses[obj["id"]] = obj

    tools = {t["name"] for t in responses[2]["result"]["tools"]}
    expected = {"grab_check", "grab_format", "grab_inspect_routes", "grab_inspect_schema", "grab_scaffold"}
    assert expected.issubset(tools), f"Missing grab mcp tools: {expected - tools}"

    check_res = responses[3]["result"]
    assert not check_res.get("isError"), f"grab_check failed via MCP: {check_res}"

    routes_res = responses[4]["result"]
    routes_raw = json.dumps(routes_res)
    for required_route in [
        "/_health",
        "/_ready",
        "/groxy",
        "/api/groxy/playbook",
        "/api/groxy/audit",
        "/api/groxy/mcp/inspect",
        "/api/groxy/prepublish-review",
        "/api/groxy/boost",
        "/api/groxy/boost/approve",
        "/api/groxy/style-packs",
        "/api/groxy/generate-layout",
        "/api/groxy/generate-layout/apply",
        "/api/groxy/vision-clone",
        "/api/groxy/vision-clone/apply",
        "/api/groxy/site-context/sync",
        "/api/groxy/site-context.md",
        "/api/groxy/links/analyze",
        "/api/groxy/schema/generate",
        "/api/groxy/media/enrich-alt",
        "/api/groxy/media/enrich-alt/approve",
        "/api/groxy/watch/run",
        "/api/groxy/watch/digest",
        "/api/groxy/site-dna/export",
    ]:
        assert required_route in routes_raw, f"Route {required_route} missing from grab_inspect_routes output"

    env_res = responses[5]["result"]
    env_raw = json.dumps(responses[5])
    assert env_res.get("isError") or "GRAB-E401" in env_raw or "denied" in env_raw.lower(), (
        f"Expected GRAB-E401 refusal reading .env via grab mcp, got: {responses[5]}"
    )
    print("  [PASS] Gate 3A complete (grab mcp initialize, tools/list, grab_check, routes, GRAB-E401).")


def gate_3b_live_cross_layer(grab_bin: str):
    print("[Gate 3B] Starting live GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0 + Groxy AI v1.2.0...")
    cms_src = Path(os.environ.get("GRABLAB_CMS_DIR", r"C:\Development\grablab-cms"))
    builder_src = Path(os.environ.get("GREX_BUILDER_DIR", r"C:\Development\grex-builder"))
    if not (cms_src / "src" / "app.grab").exists():
        raise FileNotFoundError(f"GrabLab CMS repo not found at {cms_src}")
    if not (builder_src / "src" / "studio.grab").exists():
        raise FileNotFoundError(f"Grex Theme Builder repo not found at {builder_src}")

    cms_port = find_free_port()
    builder_port = find_free_port()
    groxy_port = find_free_port()
    cms_url = f"http://127.0.0.1:{cms_port}"
    builder_url = f"http://127.0.0.1:{builder_port}"
    groxy_url = f"http://127.0.0.1:{groxy_port}"

    procs = []
    log_files = []
    tmp_root = Path(tempfile.mkdtemp(prefix="groxy_e2e_"))
    try:
        cms_tmp = tmp_root / "grablab-cms"
        builder_tmp = tmp_root / "grex-builder"
        groxy_tmp = tmp_root / "groxy-ai"
        copy_clean_dir(cms_src, cms_tmp)
        copy_clean_dir(builder_src, builder_tmp)
        copy_clean_dir(REPO_ROOT, groxy_tmp)

        # 1. Migrate & seed ephemeral GrabLab CMS v1.0.1
        cms_env = os.environ.copy()
        cms_env["GRABLAB_MASTER_KEY"] = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        cms_env["GRABLAB_UPLOAD_DIR"] = str(cms_tmp / "storage" / "uploads")
        cms_env["GRABLAB_MAX_UPLOAD_BYTES"] = "5242880"
        (cms_tmp / "storage" / "uploads").mkdir(parents=True, exist_ok=True)

        for mig in [
            "migrations/001_schema.grab",
            "migrations/002_auth_schema.grab",
            "migrations/003_v04_schema.grab",
            "migrations/seed.grab",
        ]:
            if mig.endswith("seed.grab"):
                run_cmd([grab_bin, "run", "--db-config", "grab.data.json", "--allow-db", "main:read-write", "--allow-read", ".", mig], cwd=cms_tmp)
            else:
                run_cmd([grab_bin, "migrate", "--db-config", "grab.data.json", "--allow-db", "main:migrate", mig], cwd=cms_tmp)

        cms_log = tmp_root / "cms.log"
        cms_fh = open(cms_log, "wb+")
        log_files.append(cms_fh)
        cms_proc = subprocess.Popen(
            [
                grab_bin,
                "serve",
                "--addr",
                f"127.0.0.1:{cms_port}",
                "--allow-scripts",
                "--db-config",
                "grab.data.json",
                "--allow-db",
                "main:read-write",
                "--platform-config",
                "grab.platform.json",
                "--allow-cache",
                "cms:read-write",
                "--allow-cache",
                "cms:limit",
                "--static",
                "public",
                "--allow-read",
                ".",
                "--allow-write",
                "storage",
                "--allow-env",
                "GRABLAB_MASTER_KEY,GRABLAB_UPLOAD_DIR,GRABLAB_MAX_UPLOAD_BYTES",
                "src/app.grab",
            ],
            cwd=str(cms_tmp),
            env=cms_env,
            stdout=cms_fh,
            stderr=subprocess.STDOUT,
        )
        procs.append(cms_proc)
        wait_for_health(cms_url, cms_proc, "GrabLab CMS v1.0.1", log_path=cms_log)

        # 2. Migrate & start ephemeral Grex Theme Builder v1.0.0
        for mig in ["migrations/001_studio_schema.grab", "migrations/002_revisions_schema.grab"]:
            run_cmd([grab_bin, "migrate", "--db-config", "grab.data.json", "--allow-db", "main:migrate", mig], cwd=builder_tmp)

        builder_log = tmp_root / "builder.log"
        builder_fh = open(builder_log, "wb+")
        log_files.append(builder_fh)
        builder_proc = subprocess.Popen(
            [
                grab_bin,
                "serve",
                "--addr",
                f"127.0.0.1:{builder_port}",
                "--allow-scripts",
                "--db-config",
                "grab.data.json",
                "--allow-db",
                "main:read-write",
                "--platform-config",
                "grab.platform.json",
                "--allow-cache",
                "studio:read-write",
                "--static",
                "public",
                "--allow-read",
                ".",
                "src/studio.grab",
            ],
            cwd=str(builder_tmp),
            stdout=builder_fh,
            stderr=subprocess.STDOUT,
        )
        procs.append(builder_proc)
        wait_for_health(builder_url, builder_proc, "Grex Theme Builder v1.0.0", log_path=builder_log)

        # 3. Start Groxy AI v1.2.0 from an isolated copy so its storage writes
        #    never modify the developer's working tree.
        groxy_log = tmp_root / "groxy.log"
        groxy_fh = open(groxy_log, "wb+")
        log_files.append(groxy_fh)
        groxy_proc = subprocess.Popen(
            [
                grab_bin,
                "serve",
                "--addr",
                f"127.0.0.1:{groxy_port}",
                "--allow-scripts",
                "--platform-config",
                "grab.platform.json",
                "--allow-cache",
                "groxy:read-write",
                "--static",
                "public",
                "--allow-read",
                ".",
                "--allow-write",
                "storage",
                "--allow-net",
                f"127.0.0.1:{cms_port},127.0.0.1:{builder_port}",
                "src/groxy.grab",
            ],
            cwd=str(groxy_tmp),
            stdout=groxy_fh,
            stderr=subprocess.STDOUT,
        )
        procs.append(groxy_proc)
        health_json = wait_for_health(groxy_url, groxy_proc, "Groxy AI v1.2.0", log_path=groxy_log)
        assert health_json.get("status") == "ok", (
            f"Unexpected /_health payload from Groxy AI: {health_json}"
        )

        # Verify /_ready & static assets & /groxy HTML & /api/groxy/playbook
        st, _, body = http_request(f"{groxy_url}/_ready")
        assert st == 200
        ready_json = json.loads(body)
        assert ready_json.get("status") == "ready", (
            f"Unexpected /_ready payload: {ready_json}"
        )

        st, _, html = http_request(f"{groxy_url}/groxy")
        assert st == 200
        assert re.search(r"<div\b", html, re.IGNORECASE) is None, "/groxy HTML must have zero <div> elements"
        assert '<meta name="groxy-version" content="1.2.0">' in html, "Missing groxy-version 1.2.0 meta tag"
        m = re.search(r'<meta\s+name="groxy-csrf"\s+content="([^"]+)"', html)
        assert m, "Missing groxy-csrf meta tag in /groxy HTML"
        groxy_csrf = m.group(1)

        for asset_path in [
            "/static/groxy/groxy.css",
            "/static/groxy/dashboard.js",
            "/static/groxy/vision-clone.js",
            "/static/groxy/brand-dna.js",
            "/static/groxy/batch-campaign.js",
            "/static/groxy/booster.js",
            "/static/groxy/generator.js",
            "/static/groxy/grex.js",
        ]:
            st, _, _ = http_request(f"{groxy_url}{asset_path}")
            assert st == 200, f"Expected 200 for {asset_path}, got {st}"

        st, _, pb_body = http_request(f"{groxy_url}/api/groxy/playbook")
        assert st == 200
        pb = json.loads(pb_body)
        assert len(pb.get("rules", [])) == 22
        assert pb.get("playbook_version") == "1.0.0"
        assert pb.get("service_version") == "1.2.0"

        # Verify CSRF enforcement on all POST routes
        for post_path in [
            "/api/groxy/audit",
            "/api/groxy/mcp/inspect",
            "/api/groxy/prepublish-review",
            "/api/groxy/boost",
            "/api/groxy/boost/approve",
            "/api/groxy/generate-layout",
            "/api/groxy/generate-layout/apply",
            "/api/groxy/vision-clone",
            "/api/groxy/vision-clone/apply",
            "/api/groxy/brand-dna/wizard",
            "/api/groxy/batch-create",
            "/api/groxy/batch-create/apply",
        ]:
            st_no_csrf, _, _ = http_request(f"{groxy_url}{post_path}", method="POST", json_body={"entry": {}})
            assert st_no_csrf == 403, f"Expected 403 without CSRF on {post_path}, got {st_no_csrf}"

        # Setup GrabLab CMS admin user & mint bearer MCP token
        cms_cj = http.cookiejar.CookieJar()
        cms_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cms_cj))
        st_setup, _, setup_body = http_request(
            f"{cms_url}/api/auth/setup",
            method="POST",
            json_body={
                "email": "admin@example.com",
                "display_name": "Urban Press Admin",
                "password": "GroxyE2EPassword123!",
            },
            opener=cms_opener,
        )
        assert st_setup == 201, f"GrabLab setup failed ({st_setup}): {setup_body}"
        cms_csrf = json.loads(setup_body)["csrf_token"]

        st_tok, _, tok_body = http_request(
            f"{cms_url}/api/auth/mcp-token",
            method="POST",
            headers={"X-CSRF-Token": cms_csrf},
            json_body={},
            opener=cms_opener,
        )
        assert st_tok == 201, f"GrabLab mcp-token mint failed ({st_tok}): {tok_body}"
        cms_token = json.loads(tok_body)["token"]

        # Verify Groxy AI live /api/groxy/mcp/inspect across GrabLab CMS & Grex Theme Builder
        st_insp, _, insp_body = http_request(
            f"{groxy_url}/api/groxy/mcp/inspect",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"cms_url": cms_url, "builder_url": builder_url, "cms_token": cms_token},
        )
        assert st_insp == 200, f"/api/groxy/mcp/inspect failed ({st_insp}): {insp_body}"
        insp = json.loads(insp_body)
        assert insp["ok"] is True
        assert insp["version"] == "1.2.0"
        assert insp["grablab_cms"]["connected"] is True
        assert insp["grablab_cms"]["elements_count"] == 20
        assert "create_entry_draft" in insp["grablab_cms"]["tools"]
        assert insp["grex_builder"]["connected"] is True
        assert insp["grex_builder"]["tokens_loaded"] > 0

        # Screenshot-to-Grex v1.1.0: verify bounds, contrast repair, target binding, and replay protection.
        png = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
            0, 0, 5, 160, 0, 0, 3, 132,
        ])
        vision_base = {
            "screenshot_hex": png.hex(),
            "mime_type": "image/png",
            "slot": "main",
            "blueprint_hint": "full_landing_page",
            "style_pack_hint": "obsidian-tech",
            "focus_keyword": "visual theme studio",
            "topic_title": "Visual Theme Studio for High Velocity Teams",
            "vision_provider": "deterministic",
            "extracted_palette": {
                "light": {"bg": "#ffffff", "surface": "#f8fafc", "text": "#94a3b8", "muted": "#64748b", "primary": "#2563eb", "on_primary": "#ffffff"},
                "dark": {"bg": "#09090b", "surface": "#18181b", "text": "#27272a", "muted": "#3f3f46", "primary": "#60a5fa", "on_primary": "#09090b"},
            },
        }
        st_vbad, _, vbad_body = http_request(
            f"{groxy_url}/api/groxy/vision-clone", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={**vision_base, "screenshot_hex": "3c7376673e3c2f7376673e", "mime_type": "image/png"},
        )
        assert st_vbad == 422 and json.loads(vbad_body)["error_code"] == "GROXY-VISION-E001"
        st_vfloat, _, vfloat_body = http_request(
            f"{groxy_url}/api/groxy/vision-clone", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={**vision_base, "pricing_tiers": [{"name": "Studio", "price": 49.99}]},
        )
        assert st_vfloat == 422 and json.loads(vfloat_body).get("error_code") == "GROXY-VISION-E003", f"Expected ADR-025c float rejection 422/GROXY-VISION-E003, got {st_vfloat}: {vfloat_body}"
        st_vstage, _, vstage_body = http_request(
            f"{groxy_url}/api/groxy/vision-clone", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body=vision_base,
        )
        assert st_vstage == 200, f"vision-clone staging failed ({st_vstage}): {vstage_body}"
        staged = json.loads(vstage_body)
        assert staged["schema_version"] == "1.1.0" and staged["approval_required"] is True
        assert staged["validation"]["div_count"] == 0 and staged["validation"]["inner_html_write_count"] == 0
        assert staged["audit_report"]["overall_score"] >= 90 and staged["audit_report"]["publish_safe"] is True
        assert staged["visual_analysis"]["contrast_repairs"], "Expected low-contrast palette auto-repair"
        apply_base = {"clone_id": staged["clone_id"], "approval_token": staged["approval_token"], "layout_sha256": staged["target_binding"]["layout_sha256"]}
        st_vtamper, _, _ = http_request(
            f"{groxy_url}/api/groxy/vision-clone/apply", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body={**apply_base, "slot": "footer"},
        )
        assert st_vtamper == 403, f"Expected target-binding mismatch 403, got {st_vtamper}"
        st_vapply, _, vapply_body = http_request(
            f"{groxy_url}/api/groxy/vision-clone/apply", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body={**apply_base, "slot": "main", "builder_url": builder_url},
        )
        assert st_vapply == 200, f"vision-clone apply failed ({st_vapply}): {vapply_body}"
        applied = json.loads(vapply_body)
        assert applied["target_binding_verified"] is True and applied["actor"] == "groxy-ai"
        assert applied["builder_dispatch"]["dispatched"] is True and applied["undo_available"] is True
        st_vreplay, _, _ = http_request(
            f"{groxy_url}/api/groxy/vision-clone/apply", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body={**apply_base, "slot": "main", "builder_url": builder_url},
        )
        assert st_vreplay == 409, f"Expected single-use approval replay 409, got {st_vreplay}"

        # Verify GrabLab CMS create_entry_draft safety + typed custom fields
        st_draft, _, draft_body = http_request(
            f"{cms_url}/api/mcp",
            method="POST",
            headers={"Authorization": f"Bearer {cms_token}"},
            json_body={
                "jsonrpc": "2.0",
                "id": 10,
                "method": "tools/call",
                "params": {
                    "name": "create_entry_draft",
                    "arguments": {
                        "content_type_slug": "post",
                        "title": "Semantic Fast GRAB Themes Without Wrapper Divs",
                        "slug": "semantic-fast-grab-themes",
                        "excerpt": "Discover how fast GRAB themes unite semantic Grex JS elements, WCAG AA contrast, and exact decimal data.",
                        "custom_fields": {"subtitle": "Zero wrapper divs", "reading_minutes": "6"},
                    },
                },
            },
        )
        assert st_draft == 200, f"GrabLab create_entry_draft failed ({st_draft}): {draft_body}"
        draft_rpc = json.loads(draft_body)
        assert not draft_rpc.get("result", {}).get("isError"), f"create_entry_draft MCP error: {draft_body}"
        draft_res = draft_rpc["result"]["structuredContent"]
        assert draft_res.get("status_enforced") == "draft", f"Unexpected create_entry_draft result: {draft_res}"
        draft_entry = draft_res["entry"]
        assert draft_entry["status"] == "draft"

        # Verify deterministic POST /api/groxy/audit on clean layout (twice -> identical JSON!)
        clean_audit_req = {
            "builder_url": builder_url,
            "focus_keyword": "fast grab themes",
            "entry": {
                **draft_entry,
                "author_name": "Urban Press Team",
                "published_at": "2026-11-14T12:00:00Z",
                "custom_fields": {"price": "19.95", "reading_minutes": "6"},
            },
            "grex_layout": {
                "element": "Container",
                "tag": "main",
                "props": {"id": "main-root"},
                "styles": {"base": {"color": "#0f172a", "background-color": "#ffffff"}},
                "children": [
                    {"element": "Heading", "props": {"id": "h1", "level": 1, "text": "Fast GRAB Themes Without Wrapper Divs"}},
                    {
                        "element": "Text",
                        "tag": "p",
                        "props": {
                            "id": "lead-copy",
                            "text": (
                                "Fast GRAB themes pair semantic Grex elements with zero wrapper divs and instant HTML delivery. "
                                "Every verified design token enforces accessible typography and predictable contrast. "
                            )
                            * 14,
                        },
                    },
                    {"element": "Heading", "props": {"id": "h2", "level": 2, "text": "Verified SEO & Clean-DOM Architecture"}},
                    {
                        "element": "Text",
                        "tag": "p",
                        "props": {
                            "id": "body-copy",
                            "text": "Clean heading structure, meaningful link labels, and image alt text help both readers and search engines navigate cleanly. "
                            * 10,
                        },
                    },
                    {"element": "Image", "props": {"id": "hero-img", "src": "/static/theme/hero.png", "alt": "Semantic GRAB theme diagram"}},
                    {"element": "Link", "props": {"id": "blog-link", "href": "/blog", "text": "Read more GRAB architecture guides"}},
                ],
            },
        }
        st_a1, _, body_a1 = http_request(
            f"{groxy_url}/api/groxy/audit",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body=clean_audit_req,
        )
        st_a2, _, body_a2 = http_request(
            f"{groxy_url}/api/groxy/audit",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body=clean_audit_req,
        )
        assert st_a1 == 200 and st_a2 == 200
        assert body_a1 == body_a2, "AuditReport must be byte-identical across repeated deterministic runs"
        clean_rep = json.loads(body_a1)
        assert clean_rep["publish_safe"] is True
        assert clean_rep["overall_grade"] in ("A+", "A"), f"Expected A/A+, got {clean_rep['overall_grade']} ({clean_rep['overall_score']})"
        assert len(clean_rep["findings"]) == 22
        seo008 = next(f for f in clean_rep["findings"] if f["rule_id"] == "GROXY-SEO-008")
        assert seo008["severity"] == "pass"

        # Verify safety F-cap on flawed wrapper-<div> layout
        flawed_req = {
            "entry": {
                "id": "999",
                "content_type": "post",
                "title": "Short",
                "slug": "admin-bad_slug",
                "excerpt": "Too short.",
                "custom_fields": {"price": 19.95},
            },
            "grex_layout": {
                "element": "div",
                "tag": "div",
                "children": [{"element": "Image", "props": {"id": "no-alt", "src": "/img.png"}}],
            },
        }
        st_bad, _, body_bad = http_request(
            f"{groxy_url}/api/groxy/audit",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body=flawed_req,
        )
        assert st_bad == 200
        bad_rep = json.loads(body_bad)
        assert bad_rep["publish_safe"] is False
        assert bad_rep["overall_grade"] == "F"
        assert bad_rep["overall_score"] <= 59
        dom001 = next(f for f in bad_rep["findings"] if f["rule_id"] == "GROXY-DOM-001")
        assert dom001["severity"] == "critical"

        # Verify Grex Theme Builder POST /api/mcp/layout: rejects <div> (422 / -32602), accepts clean candidate with actor="groxy-ai", keeps live published unchanged!
        _, _, state_before_raw = http_request(f"{builder_url}/api/studio/state")
        state_before = json.loads(state_before_raw)
        builder_csrf = state_before["csrf_token"]
        live_before = state_before["published"]

        st_rej, _, rej_body = http_request(
            f"{builder_url}/api/mcp/layout",
            method="POST",
            headers={"X-CSRF-Token": builder_csrf},
            json_body={
                "slot": "home",
                "actor": "groxy-ai",
                "summary": "Invalid div layout check",
                "tree": {"element": "div", "tag": "div", "children": []},
            },
        )
        assert st_rej == 422, f"Expected 422 rejecting <div> in Grex Builder, got {st_rej}: {rej_body}"
        rej_json = json.loads(rej_body)
        assert rej_json.get("mcp_error", {}).get("code") == -32602

        st_acc, _, acc_body = http_request(
            f"{builder_url}/api/mcp/layout",
            method="POST",
            headers={"X-CSRF-Token": builder_csrf},
            json_body={
                "slot": "home",
                "actor": "groxy-ai",
                "summary": "Groxy AI semantic candidate layout",
                "tree": clean_audit_req["grex_layout"],
            },
        )
        assert st_acc == 200, f"Expected 200 accepting clean Grex layout, got {st_acc}: {acc_body}"

        _, _, cmds_raw = http_request(f"{builder_url}/api/studio/commands")
        cmds = json.loads(cmds_raw).get("commands", [])
        assert any(
            (c.get("command_type") == "applyAiLayout" or c.get("type") == "applyAiLayout") and c.get("actor") == "groxy-ai"
            for c in cmds
        ), (
            f"Expected applyAiLayout command attributed to actor='groxy-ai', got: {cmds}"
        )

        _, _, state_after_raw = http_request(f"{builder_url}/api/studio/state")
        assert json.loads(state_after_raw)["published"] == live_before, (
            "Live published theme state must remain completely untouched until human Publish!"
        )

        # -----------------------------------------------------------------
        # Groxy AI v0.2.0 E2E: Pre-Publish Grade Gate + Boost Diff + Approve
        # -----------------------------------------------------------------
        # 1. Opt-out check (groxy_assist_enabled: False -> bypassed)
        st_byp, _, byp_body = http_request(
            f"{groxy_url}/api/groxy/prepublish-review",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"groxy_assist_enabled": False, "entry": {"id": "555", "title": "Bypass"}},
        )
        assert st_byp == 200, f"prepublish-review bypass failed ({st_byp}): {byp_body}"
        byp_json = json.loads(byp_body)
        assert byp_json["gate_status"] == "bypassed"
        assert byp_json["groxy_assist_enabled"] is False

        # 2. Opt-in Pre-Publish Review Gate on flawed F entry (with <div>, H1->H3 skip, missing alt, 301 link)
        v020_flawed_payload = {
            "groxy_assist_enabled": True,
            "builder_url": builder_url,
            "focus_keyword": "semantic cms",
            "entry": {
                "id": "777",
                "content_type": "post",
                "title": "Post",
                "slug": "admin-bad_slug",
                "excerpt": "Short.",
                "body": "Short copy.",
                "custom_fields": {"subtitle": "Semantic boost subtitle", "reading_minutes": "8"},
            },
            "grex_layout": {
                "element": "div",
                "tag": "div",
                "props": {"id": "bad-root"},
                "styles": {"base": {"color": "#9ca3af", "background-color": "#ffffff"}},
                "children": [
                    {"element": "Heading", "props": {"id": "bad-h1", "level": 1, "text": "Draft"}},
                    {"element": "Heading", "props": {"id": "bad-h3", "level": 3, "text": "Skipped H2"}},
                    {"element": "Image", "props": {"id": "bad-img", "src": "/static/theme/product.png"}},
                    {"element": "Link", "props": {"id": "bad-lnk", "href": "/old-guide", "text": "click here"}},
                ],
            },
            "site_context": {
                "entries": [
                    {
                        "id": "10",
                        "title": "Semantic CMS Architecture Guide",
                        "slug": "semantic-cms-architecture",
                        "slug_history": ["old-guide"],
                    }
                ],
                "redirects": [],
            },
        }
        st_rev, _, rev_body = http_request(
            f"{groxy_url}/api/groxy/prepublish-review",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body=v020_flawed_payload,
        )
        assert st_rev == 200, f"prepublish-review failed ({st_rev}): {rev_body}"
        rev_json = json.loads(rev_body)
        assert rev_json["gate_status"] == "review_required"
        assert rev_json["audit_report"]["overall_grade"] == "F"
        assert rev_json["audit_report"]["publish_safe"] is False
        assert [a["id"] for a in rev_json["actions"]] == ["make_live", "boost"]

        # Snapshot GrabLab entries count BEFORE Boost (must not mutate before human approval!)
        st_q_before, _, q_before_body = http_request(
            f"{cms_url}/api/mcp",
            method="POST",
            headers={"Authorization": f"Bearer {cms_token}"},
            json_body={"jsonrpc": "2.0", "id": 20, "method": "tools/call", "params": {"name": "query_entries", "arguments": {}}},
        )
        assert st_q_before == 200
        q_before_sc = json.loads(q_before_body)["result"]["structuredContent"]
        entries_before = q_before_sc.get("items", q_before_sc.get("entries", []))

        # 3. Invoke 🚀 Let Groxy Boost This (POST /api/groxy/boost)
        st_bst, _, bst_body = http_request(
            f"{groxy_url}/api/groxy/boost",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={**v020_flawed_payload, "review_id": rev_json["review_id"]},
        )
        assert st_bst == 200, f"/api/groxy/boost failed ({st_bst}): {bst_body}"
        bst_json = json.loads(bst_body)
        assert bst_json["before_report"]["overall_grade"] == "F"
        assert bst_json["after_report"]["overall_score"] >= 90, (
            f"Expected boosted score >= 90, got {bst_json['after_report']['overall_score']}: {bst_json['after_report']}"
        )
        assert bst_json["after_report"]["overall_grade"] in ("A", "A+")
        assert bst_json["after_report"]["publish_safe"] is True
        assert bst_json["candidate_entry"]["custom_fields"]["reading_minutes"] == "8"
        assert bst_json["candidate_entry"]["custom_fields"]["subtitle"] == "Semantic boost subtitle"
        assert bst_json["approval_required"] is True

        # Also verify GrabDecimal "49.99" exact preservation via live POST /api/groxy/boost on a product candidate
        st_prod_bst, _, prod_bst_body = http_request(
            f"{groxy_url}/api/groxy/boost",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                **v020_flawed_payload,
                "entry": {
                    **v020_flawed_payload["entry"],
                    "content_type": "product",
                    "custom_fields": {"price": "49.99", "sku": "10042"},
                },
            },
        )
        assert st_prod_bst == 200, f"Product boost failed ({st_prod_bst}): {prod_bst_body}"
        prod_bst_json = json.loads(prod_bst_body)
        assert prod_bst_json["candidate_entry"]["custom_fields"]["price"] == "49.99"
        assert prod_bst_json["candidate_entry"]["custom_fields"]["sku"] == "10042"
        approval_token = bst_json["approval_token"]
        boost_id = bst_json["boost_id"]
        assert "/old-guide" not in json.dumps(bst_json["candidate_layout"])
        assert "/semantic-cms-architecture" in json.dumps(bst_json["candidate_layout"])

        # Confirm GrabLab CMS was NOT mutated before human clicks Approve & Make This Live
        _, _, q_mid_body = http_request(
            f"{cms_url}/api/mcp",
            method="POST",
            headers={"Authorization": f"Bearer {cms_token}"},
            json_body={"jsonrpc": "2.0", "id": 21, "method": "tools/call", "params": {"name": "query_entries", "arguments": {}}},
        )
        q_mid_sc = json.loads(q_mid_body)["result"]["structuredContent"]
        entries_mid = q_mid_sc.get("items", q_mid_sc.get("entries", []))
        assert len(entries_mid) == len(entries_before), "Boost preview must NOT persist CMS entries before approval!"

        # 4. Reject invalid approval_token (GROXY-SAFE-001)
        st_bad_tok, _, _ = http_request(
            f"{groxy_url}/api/groxy/boost/approve",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"boost_id": boost_id, "approval_token": "tok_wrong"},
        )
        assert st_bad_tok == 403, f"Expected 403 on wrong approval_token, got {st_bad_tok}"

        # 5. Approve & Make This Live -> persists draft in GrabLab CMS + actor="groxy-ai" layout in Grex Builder
        st_app, _, app_body = http_request(
            f"{groxy_url}/api/groxy/boost/approve",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "boost_id": boost_id,
                "approval_token": approval_token,
                "cms_url": cms_url,
                "cms_token": cms_token,
                "builder_url": builder_url,
                "builder_csrf": builder_csrf,
                "slot": "home",
            },
        )
        assert st_app == 200, f"/api/groxy/boost/approve failed ({st_app}): {app_body}"
        app_json = json.loads(app_body)
        assert app_json["approved"] is True
        assert app_json["draft_status"] == "draft"
        assert app_json["actor"] == "groxy-ai"
        assert app_json["cms_draft_result"]["result"]["structuredContent"]["status_enforced"] == "draft"
        assert app_json["builder_layout_result"]["ok"] is True

        # Replay of single-use approval_token must be rejected (409)
        st_replay, _, _ = http_request(
            f"{groxy_url}/api/groxy/boost/approve",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"boost_id": boost_id, "approval_token": approval_token},
        )
        assert st_replay == 409, f"Expected 409 on replayed approval_token, got {st_replay}"

        # -----------------------------------------------------------------
        # v0.3.0: Autonomous Visual Page & Section Generator + Builder Undo
        # -----------------------------------------------------------------
        st_ds, _, ds_md_raw = http_request(f"{builder_url}/api/design-system.md")
        assert st_ds == 200 and "--grex-" in ds_md_raw, f"Failed fetching live design-system.md: HTTP {st_ds}"

        st_packs, _, packs_raw = http_request(f"{groxy_url}/api/groxy/style-packs")
        assert st_packs == 200, f"GET /api/groxy/style-packs failed ({st_packs}): {packs_raw}"
        packs_doc = json.loads(packs_raw)
        assert packs_doc["schema_version"] == "0.4.0"
        assert packs_doc["total_style_packs"] == 8
        assert [p["id"] for p in packs_doc["style_packs"]] == [
            "emerald-editorial",
            "obsidian-tech",
            "warm-commerce",
            "swiss-minimal",
            "local-service-trust",
            "creative-studio-bold",
            "creator-academy",
            "wellness-organic",
        ]
        for sp in packs_doc["style_packs"]:
            assert sp["contrast_report"]["wcag_aa"] is True, f"WCAG AA contrast failed for {sp['id']}"
            assert sp["contrast_report"]["min_ratio"] >= 4.5
        assert [b["id"] for b in packs_doc["blueprints"]] == [
            "full_landing_page",
            "hero_section",
            "pricing_grid",
            "faq_accordion",
            "foreach_showcase",
        ]
        st_saas, _, saas_raw = http_request(f"{groxy_url}/api/groxy/style-packs?goal=saas")
        assert st_saas == 200, f"GET style-packs?goal=saas failed ({st_saas}): {saas_raw}"
        assert [p["id"] for p in json.loads(saas_raw)["style_packs"]] == ["obsidian-tech"]
        st_svc, _, svc_raw = http_request(f"{groxy_url}/api/groxy/style-packs?industry=home_services")
        assert st_svc == 200, f"GET style-packs?industry=home_services failed ({st_svc}): {svc_raw}"
        assert [p["id"] for p in json.loads(svc_raw)["style_packs"]] == ["local-service-trust"]

        # Snapshot Builder commands, home draft tree, and CMS entries BEFORE generation
        _, _, cmds_pre_raw = http_request(f"{builder_url}/api/studio/commands")
        cmds_pre = json.loads(cmds_pre_raw).get("commands", [])
        _, _, state_pre_raw = http_request(f"{builder_url}/api/studio/state")
        home_draft_before = json.loads(state_pre_raw)["draft"]["templates"]["home"]

        st_cms_pre, _, cms_pre_raw = http_request(
            f"{cms_url}/api/mcp",
            method="POST",
            headers={"Authorization": f"Bearer {cms_token}"},
            json_body={"jsonrpc": "2.0", "id": 30, "method": "tools/call", "params": {"name": "query_entries", "arguments": {}}},
        )
        assert st_cms_pre == 200
        cms_pre_sc = json.loads(cms_pre_raw)["result"]["structuredContent"]
        cms_count_before_gen = len(cms_pre_sc.get("items", cms_pre_sc.get("entries", [])))

        # Reject JS float pricing per ADR-025c (HTTP 422)
        st_float, _, float_body = http_request(
            f"{groxy_url}/api/groxy/generate-layout",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "blueprint": "pricing_grid",
                "style_pack": "warm-commerce",
                "pricing_tiers": [{"name": "FloatBad", "price": 29.99, "sku": "10020"}],
            },
        )
        assert st_float == 422, f"Expected 422 ADR-025c rejection for float price, got {st_float}: {float_body}"

        # Generate Pricing Grid preview with exact base-10 wire strings
        st_gen_price, _, gen_price_raw = http_request(
            f"{groxy_url}/api/groxy/generate-layout",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "blueprint": "pricing_grid",
                "style_pack": "warm-commerce",
                "slot": "main",
                "focus_keyword": "precision commerce builder",
                "design_system_md": ds_md_raw,
                "pricing_tiers": [
                    {
                        "name": "Starter",
                        "price": "0.00",
                        "billing_period": "month",
                        "sku": "10010",
                        "cta_label": "Start Free Draft",
                        "cta_href": "/pricing",
                        "features": ["Zero wrapper div layout"],
                    },
                    {
                        "name": "Studio Pro",
                        "price": "29.00",
                        "billing_period": "month",
                        "sku": "10020",
                        "cta_label": "Explore Studio Pro",
                        "cta_href": "/about",
                        "features": ["Live GRAB design tokens"],
                    },
                    {
                        "name": "Enterprise",
                        "price": "149.95",
                        "billing_period": "month",
                        "sku": "10030",
                        "cta_label": "Read Enterprise Guide",
                        "cta_href": "/blog",
                        "features": ["One-click Undo parity"],
                    },
                ],
            },
        )
        assert st_gen_price == 200, f"generate-layout pricing_grid failed ({st_gen_price}): {gen_price_raw}"
        gen_price = json.loads(gen_price_raw)
        assert gen_price["validation"]["div_count"] == 0
        assert gen_price["validation"]["grex_schema_valid"] is True
        assert gen_price["validation"]["wcag_aa_passed"] is True
        assert gen_price["validation"]["decimal_integrity_verified"] is True
        assert gen_price["audit_report"]["overall_score"] >= 90
        assert gen_price["audit_report"]["overall_grade"] in ("A", "A+")
        assert gen_price["audit_report"]["publish_safe"] is True
        assert gen_price["candidate_entry"]["custom_fields"]["featured_price"] == "29.00"
        assert gen_price["candidate_entry"]["custom_fields"]["featured_sku"] == "10020"
        tree_str = json.dumps(gen_price["candidate_layout"])
        for wire in ("0.00", "29.00", "149.95", "10020"):
            assert wire in tree_str, f"Exact wire string {wire} missing from pricing tree"

        # Generate Full Landing Page preview wired to live Builder URL
        st_gen_full, _, gen_full_raw = http_request(
            f"{groxy_url}/api/groxy/generate-layout",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "blueprint": "full_landing_page",
                "style_pack": "emerald-editorial",
                "slot": "main",
                "focus_keyword": "semantic theme builder",
                "builder_url": builder_url,
            },
        )
        assert st_gen_full == 200, f"generate-layout full_landing_page failed ({st_gen_full}): {gen_full_raw}"
        gen_full = json.loads(gen_full_raw)
        assert gen_full["approval_required"] is True
        assert gen_full["approval_token"].startswith("tok_")
        assert gen_full["validation"]["div_count"] == 0
        assert gen_full["audit_report"]["overall_score"] >= 90
        assert gen_full["audit_report"]["overall_grade"] in ("A", "A+")
        assert gen_full["audit_report"]["publish_safe"] is True
        assert len(gen_full["design_system_summary"]["tokens_applied"]) > 0

        # Confirm generation alone made ZERO mutations to Builder or CMS
        _, _, cmds_mid_raw = http_request(f"{builder_url}/api/studio/commands")
        assert len(json.loads(cmds_mid_raw).get("commands", [])) == len(cmds_pre), (
            "Preview generation must NOT mutate Grex Theme Builder commands"
        )
        st_cms_mid, _, cms_mid_raw = http_request(
            f"{cms_url}/api/mcp",
            method="POST",
            headers={"Authorization": f"Bearer {cms_token}"},
            json_body={"jsonrpc": "2.0", "id": 31, "method": "tools/call", "params": {"name": "query_entries", "arguments": {}}},
        )
        assert st_cms_mid == 200
        cms_mid_sc = json.loads(cms_mid_raw)["result"]["structuredContent"]
        assert len(cms_mid_sc.get("items", cms_mid_sc.get("entries", []))) == cms_count_before_gen, (
            "Preview generation must NOT write GrabLab CMS entries before human approval"
        )

        # Bad approval_token must be rejected (403)
        st_bad_tok, _, _ = http_request(
            f"{groxy_url}/api/groxy/generate-layout/apply",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "generation_id": gen_full["generation_id"],
                "approval_token": "tok_invalid_000",
                "builder_url": builder_url,
                "builder_csrf": builder_csrf,
            },
        )
        assert st_bad_tok == 403, f"Expected 403 on bad approval_token, got {st_bad_tok}"

        # Valid human approval dispatches to Grex Theme Builder (actor: groxy-ai) + saves CMS draft
        st_gen_apply, _, gen_apply_raw = http_request(
            f"{groxy_url}/api/groxy/generate-layout/apply",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "generation_id": gen_full["generation_id"],
                "approval_token": gen_full["approval_token"],
                "slot": "main",
                "builder_url": builder_url,
                "builder_csrf": builder_csrf,
                "grablab_url": cms_url,
                "grablab_token": cms_token,
                "create_draft": True,
            },
        )
        assert st_gen_apply == 200, f"generate-layout/apply failed ({st_gen_apply}): {gen_apply_raw}"
        apply_doc = json.loads(gen_apply_raw)
        assert apply_doc["approved"] is True
        assert apply_doc["actor"] == "groxy-ai"
        assert apply_doc["command_stack_action"] == "applyAiLayout"
        assert apply_doc["undo_available"] is True
        assert apply_doc["status_enforced"] == "draft"
        assert apply_doc["builder_dispatch"]["dispatched"] is True
        assert apply_doc["builder_dispatch"]["builder_slot"] == "home"
        assert apply_doc["draft_persistence"]["saved_as_draft"] is True
        cms_gen_sc = apply_doc["draft_persistence"]["result"]["result"]["structuredContent"]
        assert cms_gen_sc["status_enforced"] == "draft"
        assert cms_gen_sc["entry"]["status"] == "draft"

        # Replay of single-use approval_token must return 409
        st_gen_replay, _, _ = http_request(
            f"{groxy_url}/api/groxy/generate-layout/apply",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "generation_id": gen_full["generation_id"],
                "approval_token": gen_full["approval_token"],
            },
        )
        assert st_gen_replay == 409, f"Expected 409 on replayed generation approval_token, got {st_gen_replay}"

        # Verify Builder recorded applyAiLayout by groxy-ai & execute 1-click Undo restoration
        _, _, cmds_post_raw = http_request(f"{builder_url}/api/studio/commands")
        cmds_post = json.loads(cmds_post_raw).get("commands", [])
        assert len(cmds_post) > len(cmds_pre)
        ai_cmd_rows = [
            c for c in cmds_post
            if c.get("actor") == "groxy-ai" and c.get("command_type") == "applyAiLayout"
        ]
        assert len(ai_cmd_rows) >= 1, f"Expected applyAiLayout command by groxy-ai, got: {cmds_post}"
        latest_ai_cmd = json.loads(ai_cmd_rows[0]["command_json"])
        assert latest_ai_cmd["type"] == "applyAiLayout"
        assert latest_ai_cmd["slot"] == "home"
        assert latest_ai_cmd["inverse"]["_restore"] is True
        restore_tree = latest_ai_cmd["inverse"]["nextTree"]
        assert restore_tree == home_draft_before

        _, _, state_after_apply_raw = http_request(f"{builder_url}/api/studio/state")
        assert json.loads(state_after_apply_raw)["draft"]["templates"]["home"]["id"] == "root-landing-main"

        st_undo, _, undo_raw = http_request(
            f"{builder_url}/api/mcp/layout",
            method="POST",
            headers={"X-CSRF-Token": builder_csrf},
            json_body={
                "slot": "home",
                "actor": "designer-undo",
                "summary": "1-Click Undo restoring pre-AI layout",
                "layout": restore_tree,
            },
        )
        assert st_undo == 200, f"1-Click Undo layout restore failed ({st_undo}): {undo_raw}"
        _, _, state_after_undo_raw = http_request(f"{builder_url}/api/studio/state")
        assert json.loads(state_after_undo_raw)["draft"]["templates"]["home"] == home_draft_before, (
            "1-Click Undo failed to restore exact pre-AI draft home layout"
        )

        # Live published theme state STILL untouched
        _, _, state_final_raw = http_request(f"{builder_url}/api/studio/state")
        assert json.loads(state_final_raw)["published"] == live_before

        # -----------------------------------------------------------------
        # v0.4.0: Site Context Sync, Link Graph + Loop Exclusion, Schema.org
        # JSON-LD, Media Alt Enrichment, Nightly Watch Digest & Site DNA
        # -----------------------------------------------------------------
        # Verify CSRF enforcement across new v0.4.0 POST endpoints
        for csrf_ep in [
            "/api/groxy/site-context/sync",
            "/api/groxy/links/analyze",
            "/api/groxy/schema/generate",
            "/api/groxy/media/enrich-alt",
            "/api/groxy/media/enrich-alt/approve",
            "/api/groxy/watch/run",
        ]:
            st_nc, _, _ = http_request(
                f"{groxy_url}{csrf_ep}",
                method="POST",
                headers={"X-CSRF-Token": "wrong-csrf"},
                json_body={},
            )
            assert st_nc == 403, f"Expected 403 invalid CSRF on {csrf_ep}, got {st_nc}"

        # 1. Sync live SITE-CONTEXT.md (pulling live GrabLab CMS + Grex Builder design system)
        st_sync, _, sync_raw = http_request(
            f"{groxy_url}/api/groxy/site-context/sync",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "grablab_url": cms_url,
                "mcp_token": cms_token,
                "builder_url": builder_url,
                "site_name": "E2E Connected Site",
                "site_url": cms_url,
                "products": [
                    {"title": "E2E Espresso Scale", "path": "/products/scale", "sku": "SCL-01", "price": "149.95", "currency": "USD"},
                    {"title": "E2E Grinder", "path": "/products/grinder", "sku": "GRD-02", "price": "10020", "currency": "USD"},
                ],
                "redirects": [
                    {"old_path": "/legacy-v1", "target_path": "/legacy-v2", "status_code": 301},
                    {"old_path": "/legacy-v2", "target_path": "/guides/semantic-live", "status_code": 301},
                    {"old_path": "/loop-one", "target_path": "/loop-two", "status_code": 301},
                    {"old_path": "/loop-two", "target_path": "/loop-one", "status_code": 301},
                ],
            },
        )
        assert st_sync == 200, f"Site context sync failed ({st_sync}): {sync_raw}"
        sync_doc = json.loads(sync_raw)
        assert sync_doc["ok"] is True
        assert sync_doc["persisted_to_cache"] is True
        assert sync_doc["persisted_to_disk"] is True
        assert sync_doc["decimal_integrity_verified"] is True
        assert sync_doc["counts"]["entries"] >= 1
        assert sync_doc["counts"]["products"] >= 2
        assert (REPO_ROOT / "storage" / "SITE-CONTEXT.md").exists()

        st_md, hdrs_md, md_body = http_request(f"{groxy_url}/api/groxy/site-context.md")
        assert st_md == 200
        assert "text/markdown" in hdrs_md.get("content-type", "").lower()
        assert "# SITE-CONTEXT.md" in md_body
        assert '"149.95"' in md_body

        # 2. Analyze Internal Linking Graph (read-only + orphan + 301 loop exclusion)
        graph_payload = {
            "site_context": {
                "site_name": "Link Graph E2E",
                "site_url": "https://e2e.example",
                "redirects": [
                    {"old_path": "/v1-seo", "target_path": "/v2-seo", "status_code": 301},
                    {"old_path": "/v2-seo", "target_path": "/guides/seo", "status_code": 301},
                    {"old_path": "/loop-one", "target_path": "/loop-two", "status_code": 301},
                    {"old_path": "/loop-two", "target_path": "/loop-one", "status_code": 301},
                    {"old_path": "/self-cycle", "target_path": "/self-cycle", "status_code": 301},
                ],
                "menus": [
                    {"location": "primary", "items": [{"label": "Home", "url": "/"}]},
                ],
                "entries": [
                    {
                        "id": 1,
                        "title": "Home",
                        "slug": "home",
                        "full_path": "/",
                        "content_type": "page",
                        "status": "published",
                        "body_html": '<p><a href="/guides/seo">SEO Architecture</a> <a href="/missing-404">click here</a></p>',
                    },
                    {
                        "id": 2,
                        "title": "SEO Architecture Guide",
                        "slug": "seo",
                        "full_path": "/guides/seo",
                        "content_type": "post",
                        "status": "published",
                        "tags": ["seo"],
                        "body_html": '<p>Links back <a href="/">Home Overview</a></p>',
                    },
                    {
                        "id": 3,
                        "title": "Orphan SEO Checklist",
                        "slug": "orphan-seo",
                        "full_path": "/guides/orphan-seo",
                        "content_type": "post",
                        "status": "published",
                        "tags": ["seo"],
                        "body_html": "<p>No inbound links yet.</p>",
                    },
                    {
                        "id": 4,
                        "title": "Loop Target",
                        "slug": "loop-one",
                        "full_path": "/loop-one",
                        "content_type": "page",
                        "status": "published",
                        "tags": ["seo"],
                        "body_html": "<p>Loop page.</p>",
                    },
                ],
            }
        }
        st_lnk, _, lnk_raw = http_request(
            f"{groxy_url}/api/groxy/links/analyze",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body=graph_payload,
        )
        assert st_lnk == 200, f"links/analyze failed ({st_lnk}): {lnk_raw}"
        lnk_doc = json.loads(lnk_raw)
        assert lnk_doc["mutates_live_cms"] is False
        assert lnk_doc["summary"]["orphan_count"] >= 1
        assert lnk_doc["summary"]["redirect_loop_count"] >= 2
        assert lnk_doc["summary"]["broken_link_count"] >= 1
        assert lnk_doc["summary"]["generic_anchor_count"] >= 1
        excl = set(lnk_doc["excluded_loop_targets"])
        assert "/loop-one" in excl and "/loop-two" in excl and "/self-cycle" in excl
        assert len(lnk_doc["suggestions"]) >= 1
        for sg in lnk_doc["suggestions"]:
            assert sg["target_path"] not in excl, f"301 loop leaked into link suggestions: {sg}"
            assert sg["anchor_text"].lower() not in {"click here", "read more", "here"}

        # 3. Deterministic Schema.org JSON-LD (exact price + 422 float reject + XSS </script> escape)
        st_sch, _, sch_raw = http_request(
            f"{groxy_url}/api/groxy/schema/generate",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "schema_types": ["Product", "Article"],
                "site_url": "https://e2e.example",
                "entry": {
                    "title": 'Headline </script><script>alert(1)</script> & Guide',
                    "full_path": "/products/e2e-kettle",
                    "custom_fields": {"price": "49.99", "currency": "USD", "sku": "E2E-49"},
                },
                "include_breadcrumbs": True,
                "include_website": True,
            },
        )
        assert st_sch == 200, f"schema/generate failed ({st_sch}): {sch_raw}"
        sch_doc = json.loads(sch_raw)
        assert sch_doc["decimal_integrity_verified"] is True
        assert sch_doc["xss_safe"] is True
        assert "</script>" not in sch_doc["json_ld_escaped"].lower()
        assert "\\u003c/script\\u003e" in sch_doc["json_ld_escaped"]
        prod_ent = next(n for n in sch_doc["json_ld"]["@graph"] if n["@type"] == "Product")
        assert prod_ent["offers"]["price"] == "49.99" and isinstance(prod_ent["offers"]["price"], str)

        st_flt, _, flt_raw = http_request(
            f"{groxy_url}/api/groxy/schema/generate",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"schema_type": "Product", "product": {"name": "Bad Float", "price": 49.99}},
        )
        assert st_flt == 422, f"Expected HTTP 422 rejecting JS float price in schema/generate, got {st_flt}: {flt_raw}"

        # 4. Media Library alt-Text Enrichment (decorative preserved + single-use approval_token)
        st_med, _, med_raw = http_request(
            f"{groxy_url}/api/groxy/media/enrich-alt",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "media": [
                    {"id": 501, "filename": "IMG_1234.jpg", "alt_text": "IMG_1234.jpg", "decorative": False, "context_entry_title": "Espresso Scale Showcase"},
                    {"id": 502, "filename": "divider.svg", "alt_text": "", "decorative": True},
                ]
            },
        )
        assert st_med == 200, f"media/enrich-alt failed ({st_med}): {med_raw}"
        med_doc = json.loads(med_raw)
        assert med_doc["approval_required"] is True
        alt_tok = med_doc["approval_token"]
        assert alt_tok and alt_tok.startswith("altok_")
        assert med_doc["summary"]["decorative_preserved"] == 1
        dec_item = next(i for i in med_doc["items"] if i["media_id"] == 502)
        assert dec_item["proposed_alt"] == "" and dec_item["aria_hidden"] == "true"

        st_bad_tok, _, _ = http_request(
            f"{groxy_url}/api/groxy/media/enrich-alt/approve",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"approval_token": "altok_invalid", "updates": [{"media_id": 501, "alt_text": "Espresso scale product photo"}]},
        )
        assert st_bad_tok == 403

        st_mapp, _, mapp_raw = http_request(
            f"{groxy_url}/api/groxy/media/enrich-alt/approve",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={
                "approval_token": alt_tok,
                "updates": [
                    {"media_id": 501, "alt_text": "Espresso Scale Showcase — digital stainless coffee scale"},
                    {"media_id": 502, "alt_text": "Should remain empty decorative"},
                ],
            },
        )
        assert st_mapp == 200, f"media/enrich-alt/approve failed ({st_mapp}): {mapp_raw}"
        mapp_doc = json.loads(mapp_raw)
        assert mapp_doc["single_use_consumed"] is True
        assert mapp_doc["approved_count"] == 1
        assert mapp_doc["preserved_decorative_count"] == 1
        assert next(i for i in mapp_doc["approved_items"] if i["media_id"] == 502)["alt_text"] == ""

        st_mrep, _, _ = http_request(
            f"{groxy_url}/api/groxy/media/enrich-alt/approve",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"approval_token": alt_tok, "updates": [{"media_id": 501, "alt_text": "Replay alt text"}]},
        )
        assert st_mrep == 409, f"Expected 409 replay conflict on consumed media approval_token, got {st_mrep}"

        # 5. Groxy Nightly Watch Digest + Portable Site DNA Export
        st_wrun, _, wrun_raw = http_request(
            f"{groxy_url}/api/groxy/watch/run",
            method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body=graph_payload,
        )
        assert st_wrun == 200, f"watch/run failed ({st_wrun}): {wrun_raw}"
        wrun_doc = json.loads(wrun_raw)
        assert wrun_doc["popups"] is False and wrun_doc["silent_edits"] is False and wrun_doc["mutates_live_cms"] is False
        assert any(o["cta_label"] == "🚀 Let Groxy Boost This" for o in wrun_doc["boost_opportunities"])

        st_wdig, _, wdig_raw = http_request(f"{groxy_url}/api/groxy/watch/digest")
        assert st_wdig == 200 and json.loads(wdig_raw)["digest_name"] == "Morning Boost Report"

        st_dna, _, dna_raw = http_request(f"{groxy_url}/api/groxy/site-dna/export?style_pack=local-service-trust")
        assert st_dna == 200, f"site-dna/export failed ({st_dna}): {dna_raw}"
        dna_doc = json.loads(dna_raw)
        assert dna_doc["schema_version"] == "0.4.0"
        assert "gashboard" in dna_doc["compatible_consumers"] and "grabman" in dna_doc["compatible_consumers"]
        assert dna_doc["active_style_pack"]["id"] == "local-service-trust"
        assert dna_doc["decimal_integrity_verified"] is True

        st_dnamd, hdrs_dnamd, dnamd_body = http_request(f"{groxy_url}/api/groxy/site-dna/export?format=markdown")
        assert st_dnamd == 200 and "text/markdown" in hdrs_dnamd.get("content-type", "").lower()
        assert "# Groxy Site DNA Export (0.4.0)" in dnamd_body

        # v1.2.0 Brand DNA -> Site DNA -> batch stage/apply -> CMS draft only.
        profile_payload = {
            "business_name": "Albany Accessibility Studio", "business_type": "Web design studio",
            "niche": "Accessible local websites", "target_audience": "small business owners",
            "pain_points": ["customers cannot find clear local information"], "service_area": "Albany, NY",
            "location_terms": ["Capital Region"],
            "voice_weights": {"authoritative": 25, "warm_friendly": 35, "bold_direct": 15, "technical_expert": 25},
            "forbidden_terms": ["guaranteed rankings"], "preferred_ctas": ["Book a consultation"],
            "avoided_ctas": ["Buy now"], "offer_types": ["consultation"],
            "prices": {"default": "129.50"}, "currency": "USD",
            "guarantees": {"status": "unknown", "details": ""}, "style_pack": "local-service-trust",
            "design_tokens": ["--grex-space-md"], "editorial_notes": "Never invent customer outcomes.",
        }
        st_brand, _, brand_raw = http_request(
            f"{groxy_url}/api/groxy/brand-dna/wizard", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body=profile_payload,
        )
        assert st_brand == 200, f"Brand DNA save failed ({st_brand}): {brand_raw}"
        brand_doc = json.loads(brand_raw)
        assert brand_doc["configured"] is True and brand_doc["revision"] >= 1
        st_brand_get, _, brand_get_raw = http_request(f"{groxy_url}/api/groxy/brand-dna")
        assert st_brand_get == 200 and json.loads(brand_get_raw)["profile"]["business_name"] == profile_payload["business_name"]
        st_brand_stale, _, _ = http_request(
            f"{groxy_url}/api/groxy/brand-dna/wizard", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body={**profile_payload, "expected_revision": 0},
        )
        assert st_brand_stale == 409, f"Expected stale Brand DNA revision conflict, got {st_brand_stale}"
        st_dna_brand, _, dna_brand_raw = http_request(f"{groxy_url}/api/groxy/site-dna/export")
        assert st_dna_brand == 200 and json.loads(dna_brand_raw).get("brand_dna", {}).get("revision") == brand_doc["revision"], f"Site DNA Brand DNA round-trip failed ({st_dna_brand}): {dna_brand_raw}"

        st_bad_count, _, _ = http_request(
            f"{groxy_url}/api/groxy/batch-create", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"brief": "Accessible local website planning.", "item_count": 0, "content_type": "post", "cms_url": cms_url},
        )
        assert st_bad_count == 422, f"Expected 422 for batch count 0, got {st_bad_count}"
        st_bad_price, _, _ = http_request(
            f"{groxy_url}/api/groxy/batch-create", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"brief": "Accessible local website planning.", "item_count": 1, "content_type": "product", "price": 12.5, "cms_url": cms_url},
        )
        assert st_bad_price == 422, f"Expected 422 for numeric product price, got {st_bad_price}"
        st_product, _, product_raw = http_request(
            f"{groxy_url}/api/groxy/batch-create", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"brief": "Accessible local website planning.", "item_count": 1, "content_type": "product", "cms_url": cms_url},
        )
        assert st_product == 200, f"Product campaign staging failed ({st_product}): {product_raw}"
        product_doc = json.loads(product_raw)
        product_schema = json.loads(product_doc["items"][0]["schema_json_ld"])
        assert product_schema["@type"] == "Product" and product_schema["offers"]["price"] == "129.50"

        st_ollama, _, ollama_raw = http_request(
            f"{groxy_url}/api/groxy/batch-create", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"brief": "Accessible local website planning.", "item_count": 1, "content_type": "post", "provider": "ollama", "cms_url": cms_url},
        )
        assert st_ollama == 200, f"Ollama campaign did not fall back cleanly ({st_ollama}): {ollama_raw}"
        ollama_doc = json.loads(ollama_raw)
        assert ollama_doc["provider_used"] in ["deterministic", "ollama"]
        assert ollama_doc["fallback_used"] is (ollama_doc["provider_used"] == "deterministic")

        st_batch, _, batch_raw = http_request(
            f"{groxy_url}/api/groxy/batch-create", method="POST",
            headers={"X-CSRF-Token": groxy_csrf},
            json_body={"brief": "Accessible local website planning.", "item_count": 1, "content_type": "post", "cms_url": cms_url},
        )
        assert st_batch == 200, f"Batch staging failed ({st_batch}): {batch_raw}"
        batch_doc = json.loads(batch_raw)
        assert batch_doc["item_count"] == 1 and batch_doc["approval_token"].startswith("btok_")
        assert batch_doc["items"][0]["audit"]["overall_score"] >= 90
        apply_payload = {"batch_id": batch_doc["batch_id"], "approval_token": batch_doc["approval_token"], "cms_url": cms_url, "cms_token": cms_token}
        st_invalid_token, _, _ = http_request(
            f"{groxy_url}/api/groxy/batch-create/apply", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body={**apply_payload, "approval_token": "btok_" + "0" * 48},
        )
        assert st_invalid_token == 403, f"Expected 403 invalid batch token, got {st_invalid_token}"
        st_apply, _, apply_raw = http_request(
            f"{groxy_url}/api/groxy/batch-create/apply", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body=apply_payload,
        )
        assert st_apply == 200, f"Batch apply failed ({st_apply}): {apply_raw}"
        apply_doc = json.loads(apply_raw)
        assert apply_doc["created_count"] == 1 and apply_doc["failed_count"] == 0 and apply_doc["status_enforced"] == "draft"
        st_replay, _, _ = http_request(
            f"{groxy_url}/api/groxy/batch-create/apply", method="POST",
            headers={"X-CSRF-Token": groxy_csrf}, json_body=apply_payload,
        )
        assert st_replay == 409, f"Expected 409 batch token replay, got {st_replay}"

        print("  [PASS] Gate 3B complete (live 4-layer GRAB + GrabLab CMS + Grex Builder + Groxy AI v1.2.0 verified 100%).")
    finally:
        for p in reversed(procs):
            terminate_process(p)
        for fh in log_files:
            try:
                fh.close()
            except Exception:
                pass
        shutil.rmtree(tmp_root, ignore_errors=True)


def main():
    grab_bin = find_grab_binary()
    print(f"Using GRAB binary: {grab_bin}")
    gate_1_static_and_format(grab_bin)
    gate_2_node_tests()
    gate_3a_grab_mcp_stdio(grab_bin)
    gate_3b_live_cross_layer(grab_bin)
    print("\nALL GROXY AI v1.2.0 VERIFICATION GATES PASSED 100%.")


if __name__ == "__main__":
    import traceback

    try:
        main()
    except Exception as exc:
        traceback.print_exc()
        print(f"\n[FAIL] {exc}", file=sys.stderr)
        sys.exit(1)
