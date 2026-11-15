/**
 * Groxy AI v0.1.0 — Unified `grab mcp` & Grex Theme Builder Client.
 * Connects safely to:
 *   1. GrabLab CMS v1.0.1 (POST /api/mcp, GET /api/mcp/tools, POST /api/mcp/tools/{name}, /static/grex/grex.elements.json)
 *   2. Grex Theme Builder v1.0.0 (GET /api/design-system.md, POST /api/mcp/layout, GET /api/studio/commands, GET /api/revisions)
 *   3. Core GRAB CLI v1.1.0 stdio MCP tools (grab_check, grab_format, grab_inspect_routes, grab_inspect_schema, grab_scaffold)
 */

import { parseDesignSystemMarkdown } from "./playbook.js";

export const GRAB_CLI_MCP_TOOLS = Object.freeze([
  {
    name: "grab_check",
    description: "Run static analysis on a .grab or .grab.html file in the workspace",
    readOnly: true,
    inputSchema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string" }, mode: { type: "string" } },
    },
  },
  {
    name: "grab_format",
    description: "Format a .grab source string or workspace file canonically",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: { file: { type: "string" }, source: { type: "string" }, write: { type: "boolean" } },
    },
  },
  {
    name: "grab_inspect_routes",
    description: "Inspect HTTP routes declared in a .grab server file",
    readOnly: true,
    inputSchema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string" } },
    },
  },
  {
    name: "grab_inspect_schema",
    description: "Inspect database schema migrations in the workspace",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "grab_scaffold",
    description: "Scaffold a new .grab or .grab.html file (requires explicit --allow-write)",
    readOnly: false,
    inputSchema: {
      type: "object",
      required: ["kind", "target"],
      properties: { kind: { type: "string" }, target: { type: "string" } },
    },
  },
]);

export const GRABLAB_MCP_TOOL_NAMES = Object.freeze([
  "list_content_types",
  "query_entries",
  "create_entry_draft",
  "update_entry_layout",
  "list_media",
  "list_menus",
]);

export class GroxyMcpError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "GroxyMcpError";
    this.code = details.code || "GROXY-MCP-ERR";
    this.status = details.status || 400;
    this.mcpCode = details.mcpCode;
    this.payload = details.payload;
  }
}

const SENSITIVE_PATH_PATTERNS = [
  /(^|[\\/])\.\.([\\/]|$)/,
  /(^|[\\/])\.git([\\/]|$)/i,
  /(^|[\\/])\.env(\.|$)/i,
  /(^|[\\/])\.ssh([\\/]|$)/i,
  /\.key$/i,
  /\.pem$/i,
];

function isBlockedWorkspacePath(rawPath) {
  const s = String(rawPath || "").trim();
  if (!s) return false;
  return SENSITIVE_PATH_PATTERNS.some((re) => re.test(s));
}

function isBlockedSSRFHost(hostname) {
  const h = String(hostname || "").trim().toLowerCase();
  if (!h) return true;
  if (h === "169.254.169.254" || h === "metadata.google.internal" || h.startsWith("169.254.")) {
    return true;
  }
  return false;
}

/**
 * Validate an outbound HTTP(S) URL against default-deny allowNet and SSRF guards (GRAB-E402).
 * @param {string} rawUrl
 * @param {Array<string>} [allowNet]
 * @returns {URL}
 */
export function assertAllowedNetworkUrl(rawUrl, allowNet = []) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl));
  } catch {
    throw new GroxyMcpError(`GRAB-E310: Invalid URL "${String(rawUrl)}".`, {
      code: "GRAB-E310",
      status: 400,
    });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new GroxyMcpError(
      `GRAB-E310: Unsupported URL scheme "${parsed.protocol}". Only http/https allowed.`,
      { code: "GRAB-E310", status: 400 }
    );
  }

  if (isBlockedSSRFHost(parsed.hostname)) {
    throw new GroxyMcpError(
      `GRAB-E402: SSRF protection blocked access to metadata/link-local host "${parsed.hostname}".`,
      { code: "GRAB-E402", status: 403 }
    );
  }

  const normalizedAllowed = (allowNet || []).map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  const hostPort = parsed.host.toLowerCase();
  const hostOnly = parsed.hostname.toLowerCase();
  const originLower = parsed.origin.toLowerCase();

  const permitted = normalizedAllowed.some(
    (rule) =>
      rule === originLower ||
      rule === hostPort ||
      rule === hostOnly
  );

  if (!permitted) {
    throw new GroxyMcpError(
      `GRAB-E402: Network permission denied for host "${parsed.host}" (not in allowNet).`,
      { code: "GRAB-E402", status: 403 }
    );
  }

  return parsed;
}

/**
 * Build and validate a JSON-RPC 2.0 request for Core GRAB v1.1.0 stdio MCP tools.
 * Enforces read-only default and GRAB-E401 sensitive file blocking.
 *
 * @param {string} toolName
 * @param {object} [args]
 * @param {{ id?: number, allowWrite?: boolean }} [options]
 * @returns {object}
 */
export function buildGrabMcpRpcRequest(toolName, args = {}, options = {}) {
  const tool = GRAB_CLI_MCP_TOOLS.find((t) => t.name === toolName);
  if (!tool) {
    throw new GroxyMcpError(`Unknown GRAB CLI MCP tool "${String(toolName)}".`, {
      code: "GRAB-MCP-UNKNOWN",
      mcpCode: -32601,
      status: 404,
    });
  }

  const safeArgs = args && typeof args === "object" ? { ...args } : {};
  const allowWrite = Boolean(options.allowWrite);

  for (const pathKey of ["file", "target"]) {
    if (typeof safeArgs[pathKey] === "string" && isBlockedWorkspacePath(safeArgs[pathKey])) {
      throw new GroxyMcpError(
        `GRAB-E401: Access to sensitive or out-of-workspace path "${safeArgs[pathKey]}" denied.`,
        { code: "GRAB-E401", status: 403 }
      );
    }
  }

  if (!allowWrite && (!tool.readOnly || safeArgs.write === true)) {
    throw new GroxyMcpError(
      `GRAB-E401: Write operation via "${toolName}" requires explicit --allow-write opt-in.`,
      { code: "GRAB-E401", status: 403 }
    );
  }

  return {
    jsonrpc: "2.0",
    id: options.id ?? 1,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: safeArgs,
    },
  };
}

/**
 * Create a unified capability-gated client for GrabLab CMS v1.0.1,
 * Grex Theme Builder v1.0.0, and GRAB v1.1.0 MCP contracts.
 *
 * @param {{
 *   cmsBaseUrl?: string,
 *   builderBaseUrl?: string,
 *   bearerToken?: string,
 *   csrfToken?: string,
 *   cookieHeader?: string,
 *   allowNet?: string[],
 *   fetchImpl?: Function
 * }} [config]
 */
export function createGroxyMcpClient(config = {}) {
  const cmsBaseUrl = String(config.cmsBaseUrl || "").replace(/\/+$/, "");
  const builderBaseUrl = String(config.builderBaseUrl || "").replace(/\/+$/, "");
  let bearerToken = String(config.bearerToken || "");
  let csrfToken = String(config.csrfToken || "");
  const cookieHeader = String(config.cookieHeader || "");
  const fetchFn = config.fetchImpl || globalThis.fetch;

  const derivedAllowNet = new Set(Array.isArray(config.allowNet) ? config.allowNet : []);
  for (const base of [cmsBaseUrl, builderBaseUrl]) {
    if (base) {
      try {
        const u = new URL(base);
        derivedAllowNet.add(u.origin);
        derivedAllowNet.add(u.host);
      } catch {
        // Handled when request runs
      }
    }
  }
  const allowNetList = Array.from(derivedAllowNet);

  let rpcSeq = 1;

  async function requestJson(url, opts = {}) {
    if (typeof fetchFn !== "function") {
      throw new GroxyMcpError("No fetch implementation available for MCP client.", {
        code: "GROXY-NO-FETCH",
        status: 500,
      });
    }
    assertAllowedNetworkUrl(url, allowNetList);

    const headers = {
      Accept: "application/json",
      ...(opts.headers || {}),
    };
    if (bearerToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }
    if (cookieHeader && !headers.Cookie) {
      headers.Cookie = cookieHeader;
    }
    if (opts.csrf && csrfToken && !headers["X-CSRF-Token"]) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const fetchOpts = {
      method: opts.method || "GET",
      headers,
    };
    if (opts.body !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      fetchOpts.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    }

    const resp = await fetchFn(url, fetchOpts);
    const rawText = await resp.text();
    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!resp.ok) {
      const mcpCode = data?.mcp_error?.code ?? data?.error?.code ?? data?.code;
      const errMsg =
        data?.mcp_error?.message ||
        (typeof data?.error === "string" ? data.error : data?.error?.message) ||
        data?.message ||
        `HTTP ${resp.status} from ${url}`;
      throw new GroxyMcpError(String(errMsg), {
        code: data?.code || (resp.status === 422 ? "grex_validation_failed" : `HTTP_${resp.status}`),
        status: resp.status,
        mcpCode: typeof mcpCode === "number" ? mcpCode : undefined,
        payload: data,
      });
    }

    return { status: resp.status, data, text: rawText };
  }

  async function requestText(url, opts = {}) {
    if (typeof fetchFn !== "function") {
      throw new GroxyMcpError("No fetch implementation available for MCP client.", {
        code: "GROXY-NO-FETCH",
        status: 500,
      });
    }
    assertAllowedNetworkUrl(url, allowNetList);
    const headers = { ...(opts.headers || {}) };
    if (bearerToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }
    if (cookieHeader && !headers.Cookie) {
      headers.Cookie = cookieHeader;
    }
    const resp = await fetchFn(url, { method: opts.method || "GET", headers });
    const text = await resp.text();
    if (!resp.ok) {
      throw new GroxyMcpError(`HTTP ${resp.status} fetching ${url}`, {
        code: `HTTP_${resp.status}`,
        status: resp.status,
      });
    }
    return text;
  }

  function requireBase(base, label) {
    if (!base) {
      throw new GroxyMcpError(`${label} base URL is not configured.`, {
        code: "GROXY-CONFIG-ERR",
        status: 400,
      });
    }
    return base;
  }

  return {
    setBearerToken(tok) {
      bearerToken = String(tok || "");
    },
    setCsrfToken(tok) {
      csrfToken = String(tok || "");
    },
    getAllowNet() {
      return [...allowNetList];
    },

    // --- GrabLab CMS v1.0.1 MCP Methods ---
    async mintMcpToken(overrideCsrf) {
      const base = requireBase(cmsBaseUrl, "GrabLab CMS");
      const { data } = await requestJson(`${base}/api/auth/mcp-token`, {
        method: "POST",
        body: {},
        csrf: true,
        headers: overrideCsrf ? { "X-CSRF-Token": overrideCsrf } : {},
      });
      if (data?.token) {
        bearerToken = String(data.token);
      }
      return data;
    },

    async listGrabLabTools(mode = "rest") {
      const base = requireBase(cmsBaseUrl, "GrabLab CMS");
      if (mode === "rpc") {
        const { data } = await requestJson(`${base}/api/mcp`, {
          method: "POST",
          body: { jsonrpc: "2.0", id: rpcSeq++, method: "tools/list" },
        });
        return data?.result?.tools || [];
      }
      const { data } = await requestJson(`${base}/api/mcp/tools`, { method: "GET" });
      return data?.tools || [];
    },

    async callGrabLabTool(toolName, args = {}, mode = "rpc") {
      const base = requireBase(cmsBaseUrl, "GrabLab CMS");
      const name = String(toolName || "").trim();
      if (name === "publish_entry" || name === "auto_publish") {
        throw new GroxyMcpError(
          "GROXY-SAFE-001: Groxy AI is strictly forbidden from auto-publishing live CMS entries.",
          { code: "GROXY-SAFE-001", status: 403 }
        );
      }

      const safeArgs = args && typeof args === "object" ? { ...args } : {};
      if (name === "create_entry_draft") {
        // Human-in-the-loop safety invariant: never allow status="published"
        delete safeArgs.status;
        safeArgs.status = "draft";
      }

      if (mode === "rest") {
        const { data } = await requestJson(`${base}/api/mcp/tools/${encodeURIComponent(name)}`, {
          method: "POST",
          body: { arguments: safeArgs },
          csrf: !bearerToken,
        });
        return data;
      }

      const { data } = await requestJson(`${base}/api/mcp`, {
        method: "POST",
        body: {
          jsonrpc: "2.0",
          id: rpcSeq++,
          method: "tools/call",
          params: {
            name,
            arguments: safeArgs,
          },
        },
        csrf: !bearerToken,
      });

      if (data?.error) {
        throw new GroxyMcpError(data.error.message || "MCP JSON-RPC error", {
          code: "MCP_RPC_ERROR",
          mcpCode: data.error.code,
          status: data.error.code === -32602 ? 422 : 400,
          payload: data.error,
        });
      }

      const result = data?.result;
      if (result?.isError) {
        const structured = result.structuredContent || {};
        throw new GroxyMcpError(
          structured.error || "GrabLab MCP tool returned an error",
          {
            code: structured.error || "grex_validation_failed",
            mcpCode: result.errorCode ?? -32602,
            status: result.status || 422,
            payload: structured,
          }
        );
      }
      return result?.structuredContent ?? result;
    },

    async listContentTypes() {
      return this.callGrabLabTool("list_content_types", {});
    },

    async queryEntries(filters = {}) {
      return this.callGrabLabTool("query_entries", filters);
    },

    async createEntryDraft(payload = {}) {
      if (String(payload.status || "").toLowerCase() === "published") {
        throw new GroxyMcpError(
          "GROXY-SAFE-001: createEntryDraft refuses status='published'. Drafts require human review.",
          { code: "GROXY-SAFE-001", status: 403 }
        );
      }
      const cleanPayload = { ...payload, status: "draft" };
      const res = await this.callGrabLabTool("create_entry_draft", cleanPayload);
      return {
        ...res,
        status_enforced: res?.status_enforced || "draft",
      };
    },

    async updateEntryLayout(entryId, layout) {
      return this.callGrabLabTool("update_entry_layout", {
        entry_id: entryId,
        layout,
      });
    },

    async listMedia(filters = {}) {
      return this.callGrabLabTool("list_media", filters);
    },

    async listMenus(location = "") {
      return this.callGrabLabTool("list_menus", location ? { location } : {});
    },

    async fetchGrexElementsCatalog() {
      const base = requireBase(cmsBaseUrl, "GrabLab CMS");
      const { data } = await requestJson(`${base}/static/grex/grex.elements.json`, { method: "GET" });
      return data;
    },

    // --- Grex Theme Builder v1.0.0 Methods ---
    async fetchDesignSystem() {
      const base = requireBase(builderBaseUrl, "Grex Theme Builder");
      const markdown = await requestText(`${base}/api/design-system.md`, { method: "GET" });
      return {
        markdown,
        contract: parseDesignSystemMarkdown(markdown),
      };
    },

    async submitCandidateLayout({ slot = "home", tree, layout, document, summary, csrfToken: overrideCsrf } = {}) {
      const base = requireBase(builderBaseUrl, "Grex Theme Builder");
      const payload = {
        slot,
        actor: "groxy-ai",
        summary: summary || "Groxy AI candidate layout",
      };
      if (document) payload.document = document;
      if (layout) payload.layout = layout;
      if (tree) payload.tree = tree;

      const { data } = await requestJson(`${base}/api/mcp/layout`, {
        method: "POST",
        body: payload,
        csrf: true,
        headers: overrideCsrf ? { "X-CSRF-Token": overrideCsrf } : {},
      });
      return data;
    },

    async listStudioCommands() {
      const base = requireBase(builderBaseUrl, "Grex Theme Builder");
      const { data } = await requestJson(`${base}/api/studio/commands`, { method: "GET" });
      return data?.commands || [];
    },

    async listRevisions() {
      const base = requireBase(builderBaseUrl, "Grex Theme Builder");
      const { data } = await requestJson(`${base}/api/revisions`, { method: "GET" });
      return data?.revisions || [];
    },

    // --- Core GRAB v1.1.0 CLI MCP Descriptor ---
    getGrabCliMcpCapabilities() {
      return [...GRAB_CLI_MCP_TOOLS];
    },
  };
}
