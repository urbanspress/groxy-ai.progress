import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as pubPlaybook from "../public/groxy/playbook.js";
import * as pubAuditor from "../public/groxy/auditor.js";
import * as pubBooster from "../public/groxy/booster.js";
import * as pubGenerator from "../public/groxy/generator.js";
import * as pubSiteContext from "../public/groxy/site-context.js";
import * as pubMcpClient from "../public/groxy/mcp-client.js";
import * as pubDashboard from "../public/groxy/dashboard.js";
import * as pubVisionClone from "../public/groxy/vision-clone.js";
import * as pubEmailFlows from "../public/groxy/email-flows.js";
import * as pubCommerceEngines from "../public/groxy/commerce-engines.js";

import * as assetPlaybook from "../assets/playbook.js";
import * as assetAuditor from "../assets/auditor.js";
import * as assetBooster from "../assets/booster.js";
import * as assetGenerator from "../assets/generator.js";
import * as assetSiteContext from "../assets/site-context.js";
import * as assetMcpClient from "../assets/mcp-client.js";
import * as assetDashboard from "../assets/dashboard.js";
import * as assetVisionClone from "../assets/vision-clone.js";
import * as assetEmailFlows from "../assets/email-flows.js";
import * as assetCommerceEngines from "../assets/commerce-engines.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

test("v1.4.0 runtime version metadata is synchronized across src/, views/, public/groxy/, and assets/", () => {
  const runtimeModules = [
    ["public/groxy/playbook.js", pubPlaybook],
    ["public/groxy/auditor.js", pubAuditor],
    ["public/groxy/booster.js", pubBooster],
    ["public/groxy/generator.js", pubGenerator],
    ["public/groxy/site-context.js", pubSiteContext],
    ["public/groxy/mcp-client.js", pubMcpClient],
    ["public/groxy/dashboard.js", pubDashboard],
    ["public/groxy/vision-clone.js", pubVisionClone],
    ["public/groxy/email-flows.js", pubEmailFlows],
    ["public/groxy/commerce-engines.js", pubCommerceEngines],
    ["assets/playbook.js", assetPlaybook],
    ["assets/auditor.js", assetAuditor],
    ["assets/booster.js", assetBooster],
    ["assets/generator.js", assetGenerator],
    ["assets/site-context.js", assetSiteContext],
    ["assets/mcp-client.js", assetMcpClient],
    ["assets/dashboard.js", assetDashboard],
    ["assets/vision-clone.js", assetVisionClone],
    ["assets/email-flows.js", assetEmailFlows],
    ["assets/commerce-engines.js", assetCommerceEngines],
  ];

  for (const [label, mod] of runtimeModules) {
    assert.equal(mod.GROXY_VERSION, "1.4.0", `${label} must export GROXY_VERSION === "1.4.0"`);
  }

  const groxyGrab = fs.readFileSync(path.join(REPO_ROOT, "src", "groxy.grab"), "utf8");
  assert.ok(groxyGrab.includes('record {status: "ok", service: "groxy-ai", version: "1.4.0"}'));
  assert.ok(groxyGrab.includes('record {status: "ready", service: "groxy-ai", version: "1.4.0"'));
  assert.ok(groxyGrab.includes('set pb_out to copy_to_map using pb'));
  assert.ok(groxyGrab.includes('set pb_out to collections.put using pb_out, "service_version", "1.4.0"'));
  assert.ok(groxyGrab.includes('record {ok: yes, service: "groxy-ai", version: "1.4.0"'));

  const viewHtml = fs.readFileSync(path.join(REPO_ROOT, "views", "dashboard.grab.html"), "utf8");
  assert.ok(viewHtml.includes('<meta name="groxy-version" content="1.4.0">'));
  assert.ok(viewHtml.includes('<span class="groxy-badge">v1.4.0</span>'));
  assert.ok(viewHtml.includes("Groxy AI v1.4.0"));
  assert.equal(/<div\b/i.test(viewHtml), false, "dashboard.grab.html must contain zero <div> tags");
});

test("deploy/docker-compose.yml and deploy/README.md enforce --read-only isolation and zero secrets/private IPs", () => {
  const composePath = path.join(REPO_ROOT, "deploy", "docker-compose.yml");
  const deployReadmePath = path.join(REPO_ROOT, "deploy", "README.md");
  assert.equal(fs.existsSync(composePath), true, "deploy/docker-compose.yml must exist");
  assert.equal(fs.existsSync(deployReadmePath), true, "deploy/README.md must exist");

  const compose = fs.readFileSync(composePath, "utf8");
  const readme = fs.readFileSync(deployReadmePath, "utf8");

  // Hardened container controls across standalone and integrated services
  assert.equal((compose.match(/read_only:\s*true/g) || []).length, 3);
  assert.equal((compose.match(/no-new-privileges:true/g) || []).length, 3);
  assert.equal((compose.match(/cap_drop:/g) || []).length, 3);
  assert.equal((compose.match(/tmpfs:/g) || []).length, 3);
  assert.ok(compose.includes("/tmp:rw,noexec,nosuid"));
  assert.ok(compose.includes("../storage:/app/storage:rw"));
  assert.ok(compose.includes("../cache:/app/cache:rw"));
  assert.ok(compose.includes("--allow-write"));
  assert.ok(compose.includes("/app/storage"));
  assert.ok(compose.includes("/app/cache"));
  assert.ok(compose.includes("127.0.0.1:${GROXY_PORT:-8090}:8090"));
  assert.ok(compose.includes('profiles: ["ecosystem-stack"]'));
  assert.ok(compose.includes("http://127.0.0.1:8090/_ready"));

  // Zero hardcoded secrets or private/public non-loopback IPv4 literals
  const combined = `${compose}\n${readme}`;
  assert.equal(/\b(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+)\b/.test(combined), false);
  assert.equal(/0123456789abcdef/.test(combined), false);
  assert.equal(/password\s*[:=]\s*["']?[A-Za-z0-9!@#$%^&*]{8,}/i.test(combined), false);
  assert.ok(compose.includes("${GRABLAB_MASTER_KEY:?"));
});
