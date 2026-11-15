import test from "node:test";
import assert from "node:assert/strict";

import {
  assertAllowedNetworkUrl,
  buildGrabMcpRpcRequest,
  createGroxyMcpClient,
  GRABLAB_MCP_TOOL_NAMES,
  GroxyMcpError,
} from "../public/groxy/mcp-client.js";

test("assertAllowedNetworkUrl enforces GRAB-E402 default-deny and SSRF metadata blocks", () => {
  const parsed = assertAllowedNetworkUrl("http://127.0.0.1:4100/api/mcp", ["127.0.0.1:4100"]);
  assert.equal(parsed.hostname, "127.0.0.1");

  assert.throws(
    () => assertAllowedNetworkUrl("http://169.254.169.254/latest/meta-data", ["169.254.169.254"]),
    (err) => err instanceof GroxyMcpError && err.code === "GRAB-E402"
  );

  assert.throws(
    () => assertAllowedNetworkUrl("https://evil.example.com/steal", ["127.0.0.1:4100"]),
    (err) => err instanceof GroxyMcpError && err.code === "GRAB-E402"
  );

  assert.throws(
    () => assertAllowedNetworkUrl("ftp://127.0.0.1/file", ["127.0.0.1"]),
    (err) => err instanceof GroxyMcpError && err.code === "GRAB-E310"
  );
});

test("buildGrabMcpRpcRequest enforces read-only default and GRAB-E401 sensitive file blocks", () => {
  const req = buildGrabMcpRpcRequest("grab_check", { file: "src/groxy.grab" });
  assert.equal(req.jsonrpc, "2.0");
  assert.equal(req.method, "tools/call");
  assert.equal(req.params.name, "grab_check");

  assert.throws(
    () => buildGrabMcpRpcRequest("grab_check", { file: ".env" }),
    (err) => err instanceof GroxyMcpError && err.code === "GRAB-E401"
  );

  assert.throws(
    () => buildGrabMcpRpcRequest("grab_check", { file: "../secrets.key" }),
    (err) => err instanceof GroxyMcpError && err.code === "GRAB-E401"
  );

  assert.throws(
    () => buildGrabMcpRpcRequest("grab_scaffold", { kind: "route", target: "src/new.grab" }),
    (err) => err instanceof GroxyMcpError && err.code === "GRAB-E401"
  );

  const writeReq = buildGrabMcpRpcRequest(
    "grab_scaffold",
    { kind: "route", target: "src/new.grab" },
    { allowWrite: true }
  );
  assert.equal(writeReq.params.name, "grab_scaffold");
});

test("createGroxyMcpClient handles GrabLab CMS JSON-RPC, safety draft-only gating, and Theme Builder actor stamping", async () => {
  const recordedCalls = [];
  const mockFetch = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    recordedCalls.push({ url, method: init.method || "GET", headers: init.headers || {}, body });

    if (url.endsWith("/api/mcp/tools")) {
      return new Response(
        JSON.stringify({ tools: GRABLAB_MCP_TOOL_NAMES.map((name) => ({ name })) }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.endsWith("/api/mcp") && body?.method === "tools/call") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            structuredContent: { ok: true, echoed: body.params },
            content: [{ type: "json", json: { ok: true, echoed: body.params } }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (url.endsWith("/api/design-system.md")) {
      return new Response(
        `# GRAB-DESIGN-SYSTEM.md\n\n## 1. Design Tokens\n\n### Mode: \`light\`\n\n- \`--grex-bg-surface\`: \`#ffffff\`\n`,
        { status: 200, headers: { "Content-Type": "text/markdown" } }
      );
    }

    if (url.endsWith("/api/mcp/layout")) {
      if (body?.layout?.element === "div" || body?.tree?.tag === "div") {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32602, message: "Wrapper <div> forbidden by Grex validation" },
          }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ ok: true, command: "applyAiLayout", actor: body.actor }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: false }), { status: 404 });
  };

  const client = createGroxyMcpClient({
    cmsBaseUrl: "http://127.0.0.1:4101",
    builderBaseUrl: "http://127.0.0.1:4102",
    allowNet: ["127.0.0.1:4101", "127.0.0.1:4102"],
    bearerToken: "mcp-secret",
    csrfToken: "csrf-123",
    fetchImpl: mockFetch,
  });

  const tools = await client.listGrabLabTools("rest");
  assert.equal(tools.length, 6);

  // Refuses status="published"
  await assert.rejects(
    () => client.createEntryDraft({ title: "Unsafe Auto Publish", status: "published" }),
    (err) => err instanceof GroxyMcpError && err.code === "GROXY-SAFE-001"
  );

  // Forces status="draft"
  const draftRes = await client.createEntryDraft({
    content_type_slug: "post",
    title: "Draft SEO Post",
    slug: "draft-seo-post",
  });
  assert.equal(draftRes.status_enforced, "draft");
  assert.equal(draftRes.echoed.arguments.status, "draft");

  // Refuses direct auto-publish calls
  await assert.rejects(
    () => client.callGrabLabTool("publish_entry", { entry_id: 1 }),
    (err) => err instanceof GroxyMcpError && err.code === "GROXY-SAFE-001"
  );

  // Theme Builder design system + actor: "groxy-ai" layout submission + -32602 error propagation
  const ds = await client.fetchDesignSystem();
  assert.equal(ds.contract.tokens_loaded, 1);

  const layoutOk = await client.submitCandidateLayout({
    slot: "home",
    tree: { element: "Container", tag: "main", children: [] },
  });
  assert.equal(layoutOk.actor, "groxy-ai");

  await assert.rejects(
    () =>
      client.submitCandidateLayout({
        slot: "home",
        tree: { element: "div", tag: "div", children: [] },
      }),
    (err) => err instanceof GroxyMcpError && err.status === 422 && err.mcpCode === -32602
  );
});
