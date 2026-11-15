#!/usr/bin/env python3
"""
Groxy AI v0.1.0 — Full Cross-Layer End-to-End Verification Suite.

Runs 3 non-negotiable gates:
  Gate 1: Static analysis (grab check), non-destructive canonical formatting (grab format byte-for-byte),
          .grab.html compile probe, and zero wrapper-<div> / zero-innerHTML source verification.
  Gate 2: Node unit & DOM accessibility suite (node --test tests/unit_*.test.js).
  Gate 3: Live cross-layer integration spinning up:
            - Core GRAB v1.1.0 `grab mcp` stdio JSON-RPC 2.0 server
            - GrabLab CMS v1.0.1 (isolated temp copy)
            - Grex Theme Builder v1.0.0 (isolated temp copy)
            - Groxy AI v0.1.0 (src/groxy.grab)
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
        return resp.status, dict(resp.headers), body
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        return err.code, dict(err.headers), body


def wait_for_health(base_url, proc, label, timeout_s=20.0):
    deadline = time.time() + timeout_s
    last_err = None
    while time.time() < deadline:
        if proc.poll() is not None:
            out, err = proc.communicate(timeout=2)
            raise AssertionError(
                f"{label} exited prematurely with code {proc.returncode}.\nSTDOUT:\n{out}\nSTDERR:\n{err}"
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
        REPO_ROOT / "public" / "groxy" / "mcp-client.js",
        REPO_ROOT / "public" / "groxy" / "dashboard.js",
    ]:
        src = js_file.read_text(encoding="utf-8")
        code_only = re.sub(r"/\*[\s\S]*?\*/|//.*", "", src)
        assert ".innerHTML" not in code_only, f"{js_file.name} must never reference .innerHTML"
        assert not re.search(r"\beval\s*\(", code_only), f"{js_file.name} must never call eval()"

    print("  [PASS] Gate 1 complete.")


def gate_2_node_tests():
    print("[Gate 2] Running Node unit & DOM tests (node --test)...")
    run_cmd([
        "node",
        "--test",
        "tests/unit_playbook.test.js",
        "tests/unit_auditor.test.js",
        "tests/unit_mcp_client.test.js",
        "tests/unit_ui_dom.test.js",
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
    for required_route in ["/_health", "/_ready", "/groxy", "/api/groxy/playbook", "/api/groxy/audit", "/api/groxy/mcp/inspect"]:
        assert required_route in routes_raw, f"Route {required_route} missing from grab_inspect_routes output"

    env_res = responses[5]["result"]
    env_raw = json.dumps(responses[5])
    assert env_res.get("isError") or "GRAB-E401" in env_raw or "denied" in env_raw.lower(), (
        f"Expected GRAB-E401 refusal reading .env via grab mcp, got: {responses[5]}"
    )
    print("  [PASS] Gate 3A complete (grab mcp initialize, tools/list, grab_check, routes, GRAB-E401).")


def gate_3b_live_cross_layer(grab_bin: str):
    print("[Gate 3B] Starting live GrabLab CMS v1.0.1 + Grex Theme Builder v1.0.0 + Groxy AI v0.1.0...")
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
    tmp_root = Path(tempfile.mkdtemp(prefix="groxy_e2e_"))
    try:
        cms_tmp = tmp_root / "grablab-cms"
        builder_tmp = tmp_root / "grex-builder"
        copy_clean_dir(cms_src, cms_tmp)
        copy_clean_dir(builder_src, builder_tmp)

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
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        procs.append(cms_proc)
        wait_for_health(cms_url, cms_proc, "GrabLab CMS v1.0.1")

        # 2. Migrate & start ephemeral Grex Theme Builder v1.0.0
        for mig in ["migrations/001_studio_schema.grab", "migrations/002_revisions_schema.grab"]:
            run_cmd([grab_bin, "migrate", "--db-config", "grab.data.json", "--allow-db", "main:migrate", mig], cwd=builder_tmp)

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
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        procs.append(builder_proc)
        wait_for_health(builder_url, builder_proc, "Grex Theme Builder v1.0.0")

        # 3. Start Groxy AI v0.1.0 from REPO_ROOT
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
                "--allow-net",
                f"127.0.0.1:{cms_port},127.0.0.1:{builder_port}",
                "src/groxy.grab",
            ],
            cwd=str(REPO_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        procs.append(groxy_proc)
        health_json = wait_for_health(groxy_url, groxy_proc, "Groxy AI v0.1.0")
        assert health_json.get("status") == "ok", (
            f"Unexpected /_health payload from Groxy AI: {health_json}"
        )

        # Verify /_ready & static assets & /groxy HTML & /api/groxy/playbook
        st, _, body = http_request(f"{groxy_url}/_ready")
        assert st == 200
        ready_json = json.loads(body)
        assert ready_json.get("status") == "ready", f"Unexpected /_ready payload: {ready_json}"

        st, _, html = http_request(f"{groxy_url}/groxy")
        assert st == 200
        assert re.search(r"<div\b", html, re.IGNORECASE) is None, "/groxy HTML must have zero <div> elements"
        m = re.search(r'<meta\s+name="groxy-csrf"\s+content="([^"]+)"', html)
        assert m, "Missing groxy-csrf meta tag in /groxy HTML"
        groxy_csrf = m.group(1)

        for asset_path in ["/static/groxy/groxy.css", "/static/groxy/dashboard.js", "/static/groxy/grex.js"]:
            st, _, _ = http_request(f"{groxy_url}{asset_path}")
            assert st == 200, f"Expected 200 for {asset_path}, got {st}"

        st, _, pb_body = http_request(f"{groxy_url}/api/groxy/playbook")
        assert st == 200
        pb = json.loads(pb_body)
        assert len(pb.get("rules", [])) == 22

        # Verify CSRF enforcement on POST routes
        st_no_csrf, _, _ = http_request(f"{groxy_url}/api/groxy/audit", method="POST", json_body={"entry": {}})
        assert st_no_csrf == 403, f"Expected 403 without CSRF on /api/groxy/audit, got {st_no_csrf}"
        st_no_csrf2, _, _ = http_request(f"{groxy_url}/api/groxy/mcp/inspect", method="POST", json_body={})
        assert st_no_csrf2 == 403, f"Expected 403 without CSRF on /api/groxy/mcp/inspect, got {st_no_csrf2}"

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
        assert insp["grablab_cms"]["connected"] is True
        assert insp["grablab_cms"]["elements_count"] == 20
        assert "create_entry_draft" in insp["grablab_cms"]["tools"]
        assert insp["grex_builder"]["connected"] is True
        assert insp["grex_builder"]["tokens_loaded"] > 0

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

        print("  [PASS] Gate 3B complete (live 4-layer GRAB + GrabLab CMS + Grex Builder + Groxy AI verified 100%).")
    finally:
        for p in reversed(procs):
            terminate_process(p)
        shutil.rmtree(tmp_root, ignore_errors=True)


def main():
    grab_bin = find_grab_binary()
    print(f"Using GRAB binary: {grab_bin}")
    gate_1_static_and_format(grab_bin)
    gate_2_node_tests()
    gate_3a_grab_mcp_stdio(grab_bin)
    gate_3b_live_cross_layer(grab_bin)
    print("\nALL GROXY AI v0.1.0 VERIFICATION GATES PASSED 100%.")


if __name__ == "__main__":
    import traceback

    try:
        main()
    except Exception as exc:
        traceback.print_exc()
        print(f"\n[FAIL] {exc}", file=sys.stderr)
        sys.exit(1)
