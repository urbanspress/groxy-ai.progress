/* Grex JS v1.0.0 | MIT License | Zero-build browser ES module */

// --- signals.js ---
/**
 * Grex JS v0.1 Fine-Grained Reactive Engine & Exact GRAB Value Integrity.
 * Zero external dependencies, zero eval()/new Function(), deterministic disposal.
 */

const CLEAN = 0;
const CHECK = 1;
const DIRTY = 2;

let activeObserver = null;
let batchDepth = 0;
let isFlushing = false;
const pendingEffects = new Set();

function cleanupObserverSources(observer) {
  for (const source of observer.sources) {
    source.subscribers.delete(observer);
  }
  observer.sources.clear();
}

function trackSource(source) {
  if (!activeObserver || activeObserver.disposed) {
    return;
  }
  if (!activeObserver.sources.has(source)) {
    activeObserver.sources.add(source);
    source.subscribers.add(activeObserver);
  }
}

function notifyDownstream(source, nextState) {
  for (const sub of source.subscribers) {
    if (sub.disposed) {
      continue;
    }
    if (sub.kind === "effect") {
      if (sub.state < nextState) {
        sub.state = nextState;
      }
      pendingEffects.add(sub);
    } else if (sub.kind === "computed") {
      const prevState = sub.state;
      if (prevState < nextState) {
        sub.state = nextState;
      }
      if (prevState === CLEAN) {
        notifyDownstream(sub, CHECK);
      }
    }
  }
}

function flushEffects() {
  if (batchDepth > 0 || isFlushing) {
    return;
  }
  isFlushing = true;
  let guard = 0;
  try {
    while (pendingEffects.size > 0) {
      if (++guard > 10000) {
        pendingEffects.clear();
        throw new Error("Grex reactive cycle detected: effect triggered more than 10,000 iterations.");
      }
      const queue = Array.from(pendingEffects);
      pendingEffects.clear();
      for (const eff of queue) {
        if (!eff.disposed && shouldUpdate(eff)) {
          runEffect(eff);
        }
      }
    }
  } finally {
    isFlushing = false;
  }
}

function shouldUpdate(node) {
  if (node.state === CLEAN) {
    return false;
  }
  if (node.state === DIRTY) {
    return true;
  }
  for (const source of node.sources) {
    if (source.kind === "computed") {
      evaluateComputed(source);
      if (node.state === DIRTY) {
        return true;
      }
    }
  }
  node.state = CLEAN;
  return false;
}

function evaluateComputed(comp) {
  if (comp.disposed) {
    return comp.value;
  }
  if (comp.state === CLEAN) {
    return comp.value;
  }
  if (!shouldUpdate(comp)) {
    return comp.value;
  }

  const prevObserver = activeObserver;
  cleanupObserverSources(comp);
  activeObserver = comp;
  let nextValue;
  try {
    nextValue = comp.fn();
  } finally {
    activeObserver = prevObserver;
  }

  const changed = !comp.initialized || !Object.is(comp.value, nextValue);
  comp.value = nextValue;
  comp.initialized = true;
  comp.state = CLEAN;

  if (changed) {
    for (const sub of comp.subscribers) {
      if (!sub.disposed && sub.state < DIRTY) {
        sub.state = DIRTY;
      }
    }
  }
  return comp.value;
}

function runEffect(eff) {
  if (eff.disposed) {
    return;
  }
  if (typeof eff.cleanup === "function") {
    const fn = eff.cleanup;
    eff.cleanup = null;
    fn();
  }
  cleanupObserverSources(eff);
  eff.state = CLEAN;

  const prevObserver = activeObserver;
  activeObserver = eff;
  try {
    const maybeCleanup = eff.fn();
    eff.cleanup = typeof maybeCleanup === "function" ? maybeCleanup : null;
  } finally {
    activeObserver = prevObserver;
  }
}

/**
 * Create a reactive signal holding a single value.
 * @template T
 * @param {T} initialValue
 * @returns {{ get(): T, set(nextValue: T | ((prev: T) => T)): T, peek(): T }}
 */
export function signal(initialValue) {
  const node = {
    kind: "signal",
    value: initialValue,
    subscribers: new Set(),
    disposed: false,
  };

  return {
    get() {
      trackSource(node);
      return node.value;
    },
    peek() {
      return node.value;
    },
    set(nextValue) {
      const resolved = typeof nextValue === "function" ? nextValue(node.value) : nextValue;
      if (Object.is(node.value, resolved)) {
        return node.value;
      }
      node.value = resolved;
      notifyDownstream(node, DIRTY);
      flushEffects();
      return node.value;
    },
  };
}

/**
 * Create a lazy, memoized derived signal.
 * @template T
 * @param {() => T} fn
 * @returns {{ get(): T, peek(): T, dispose(): void }}
 */
export function computed(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("computed(fn) requires a function.");
  }

  const node = {
    kind: "computed",
    fn,
    value: undefined,
    initialized: false,
    state: DIRTY,
    sources: new Set(),
    subscribers: new Set(),
    disposed: false,
  };

  return {
    get() {
      if (node.disposed) {
        return node.value;
      }
      evaluateComputed(node);
      trackSource(node);
      return node.value;
    },
    peek() {
      if (node.disposed) {
        return node.value;
      }
      return evaluateComputed(node);
    },
    dispose() {
      if (node.disposed) {
        return;
      }
      node.disposed = true;
      cleanupObserverSources(node);
      node.subscribers.clear();
    },
  };
}

/**
 * Run a reactive side effect immediately and re-run when tracked signals change.
 * @param {() => (void | (() => void))} fn
 * @returns {() => void} dispose callback
 */
export function effect(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("effect(fn) requires a function.");
  }

  const eff = {
    kind: "effect",
    fn,
    cleanup: null,
    state: DIRTY,
    sources: new Set(),
    disposed: false,
  };

  runEffect(eff);

  return function dispose() {
    if (eff.disposed) {
      return;
    }
    eff.disposed = true;
    pendingEffects.delete(eff);
    cleanupObserverSources(eff);
    if (typeof eff.cleanup === "function") {
      const cleanupFn = eff.cleanup;
      eff.cleanup = null;
      cleanupFn();
    }
  };
}

/**
 * Coalesce multiple signal updates so downstream effects run once at the end.
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function batch(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("batch(fn) requires a function.");
  }
  batchDepth += 1;
  try {
    return fn();
  } finally {
    batchDepth -= 1;
    if (batchDepth === 0) {
      flushEffects();
    }
  }
}

/**
 * Execute a function without tracking any signal reads inside the current observer.
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("untrack(fn) requires a function.");
  }
  const prevObserver = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = prevObserver;
  }
}

/**
 * Check whether a value is an exact GRAB base-10 integer or decimal wire string.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isExactGrabWireString(value) {
  return typeof value === "string" && /^[+-]?\d+(?:\.\d+)?$/.test(value.trim());
}

/**
 * Format a GRAB base-10 integer or decimal wire string (e.g. "19.95") for display
 * using pure string manipulation—never coercing to IEEE-754 floating-point math.
 *
 * @param {string | number} value
 * @param {{ prefix?: string, suffix?: string, decimals?: number | null, groupSeparator?: string }} [options]
 * @returns {string}
 */
export function formatGrabDecimal(value, options = {}) {
  const {
    prefix = "",
    suffix = "",
    decimals = null,
    groupSeparator = ",",
  } = options;

  const raw = typeof value === "string" ? value.trim() : String(value);
  const match = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) {
    throw new TypeError(`Expected exact base-10 decimal string, received: ${String(value)}`);
  }

  const sign = match[1] === "-" ? "-" : "";
  let intPart = match[2].replace(/^0+(?=\d)/, "");
  let fracPart = match[3] || "";

  if (typeof decimals === "number" && Number.isInteger(decimals) && decimals >= 0) {
    if (fracPart.length < decimals) {
      fracPart = fracPart.padEnd(decimals, "0");
    } else if (fracPart.length > decimals) {
      fracPart = fracPart.slice(0, decimals);
    }
  }

  if (groupSeparator) {
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  }

  const numeric = fracPart.length > 0 ? `${intPart}.${fracPart}` : intPart;
  return `${sign}${prefix}${numeric}${suffix}`;
}

// --- security.js ---
/**
 * Grex JS v0.1 Strict CSP & XSS Security Guards (ADR-014, ADR-017).
 * Blocks unsafe tags, javascript:/data: URLs, and inline on* event handlers.
 */

export class GrexSecurityError extends Error {
  constructor(message) {
    super(message);
    this.name = "GrexSecurityError";
  }
}

const FORBIDDEN_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "base",
  "meta",
  "link",
]);

const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "action",
  "formaction",
  "poster",
  "cite",
]);

const ALLOWED_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Validate that a tag name is a safe semantic HTML5 tag.
 * @param {string} tag
 * @returns {string} normalized lowercase tag name
 */
export function assertSafeTag(tag) {
  if (typeof tag !== "string") {
    throw new GrexSecurityError("Element tag must be a non-empty string.");
  }
  const normalized = tag.trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(normalized)) {
    throw new GrexSecurityError(`Invalid HTML tag name: "${tag}".`);
  }
  if (FORBIDDEN_TAGS.has(normalized)) {
    throw new GrexSecurityError(`Forbidden HTML tag "${normalized}" blocked by Grex CSP policy.`);
  }
  return normalized;
}

/**
 * Check whether an attribute name is forbidden (e.g., inline on* handlers or srcdoc).
 * @param {string} attrName
 * @returns {boolean}
 */
export function isForbiddenAttribute(attrName) {
  if (typeof attrName !== "string") {
    return true;
  }
  const normalized = attrName.trim().toLowerCase();
  if (!normalized || !/^[a-z_:][a-z0-9_.:-]*$/.test(normalized)) {
    return true;
  }
  return normalized.startsWith("on") || normalized === "srcdoc";
}

/**
 * Validate a URL string, blocking javascript:, data:, vbscript:, and file: protocols.
 * Strips ASCII control characters and whitespace before inspecting the scheme.
 * @param {unknown} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (typeof url !== "string") {
    return false;
  }
  // Remove ASCII control chars & whitespace attackers insert inside schemes (e.g. java\tscript:).
  const cleaned = url.replace(/[\u0000-\u0020\u007f]+/g, "");
  if (cleaned === "" || cleaned.startsWith("/") || cleaned.startsWith("./") || cleaned.startsWith("../") || cleaned.startsWith("#") || cleaned.startsWith("?")) {
    return true;
  }

  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*:)/.exec(cleaned);
  if (!schemeMatch) {
    // Relative path without explicit scheme (e.g. "products/hat")
    return true;
  }

  const scheme = schemeMatch[1].toLowerCase();
  return ALLOWED_URL_SCHEMES.has(scheme);
}

/**
 * Validate an attribute name + value pair and return the safe string value.
 * Throws GrexSecurityError for forbidden attributes or unsafe URLs.
 * @param {string} attrName
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeAttributeValue(attrName, value) {
  if (isForbiddenAttribute(attrName)) {
    throw new GrexSecurityError(`Forbidden attribute "${String(attrName)}" blocked by Grex XSS policy.`);
  }
  const normalized = attrName.trim().toLowerCase();
  const strValue = value == null ? "" : String(value);

  if (URL_ATTRIBUTES.has(normalized) && !isSafeUrl(strValue)) {
    throw new GrexSecurityError(`Unsafe URL protocol blocked on "${normalized}" attribute.`);
  }

  return strValue;
}

/**
 * Safely assign text content to a DOM node using textContent (never innerHTML).
 * Preserves exact string representations (including GRAB decimal wire strings).
 * @param {Node} node
 * @param {unknown} value
 */
export function setSafeText(node, value) {
  const safeText = value == null ? "" : String(value);
  if (node.nodeType === 3) {
    node.nodeValue = safeText;
  } else {
    node.textContent = safeText;
  }
}

// --- tokens.js ---
/**
 * Grex JS v0.1 / v0.2 Responsive --grex-* Design Tokens & /static/grex/ CSS Compiler (ADR-027b).
 */


export const DEFAULT_BREAKPOINTS = Object.freeze({
  base: null,
  tablet: "(max-width: 1024px)",
  mobile: "(max-width: 640px)",
});

export const ALLOWED_STYLE_PROPERTIES = Object.freeze({
  padding: "padding",
  paddingBlock: "padding-block",
  "padding-block": "padding-block",
  paddingInline: "padding-inline",
  "padding-inline": "padding-inline",
  margin: "margin",
  marginBlock: "margin-block",
  "margin-block": "margin-block",
  marginInline: "margin-inline",
  "margin-inline": "margin-inline",
  maxWidth: "max-width",
  "max-width": "max-width",
  width: "width",
  height: "height",
  minHeight: "min-height",
  "min-height": "min-height",
  display: "display",
  gridTemplateColumns: "grid-template-columns",
  "grid-template-columns": "grid-template-columns",
  flexDirection: "flex-direction",
  "flex-direction": "flex-direction",
  flexWrap: "flex-wrap",
  "flex-wrap": "flex-wrap",
  gap: "gap",
  rowGap: "row-gap",
  "row-gap": "row-gap",
  columnGap: "column-gap",
  "column-gap": "column-gap",
  alignItems: "align-items",
  "align-items": "align-items",
  justifyContent: "justify-content",
  "justify-content": "justify-content",
  fontSize: "font-size",
  "font-size": "font-size",
  fontWeight: "font-weight",
  "font-weight": "font-weight",
  lineHeight: "line-height",
  "line-height": "line-height",
  textAlign: "text-align",
  "text-align": "text-align",
  color: "color",
  background: "background",
  backgroundColor: "background-color",
  "background-color": "background-color",
  border: "border",
  borderRadius: "border-radius",
  "border-radius": "border-radius",
  boxShadow: "box-shadow",
  "box-shadow": "box-shadow",
});

const UNSAFE_CSS_VALUE_PATTERN = /[;{}]|<\/style|expression\s*\(|javascript:|@import/i;

/**
 * Normalize and validate a --grex-* CSS custom property name.
 * @param {string} name
 * @returns {string}
 */
export function normalizeTokenName(name) {
  if (typeof name !== "string") {
    throw new GrexSecurityError("Token name must be a string.");
  }
  const trimmed = name.trim();
  const normalized = trimmed.startsWith("--grex-")
    ? trimmed
    : trimmed.startsWith("--")
      ? `--grex-${trimmed.slice(2)}`
      : `--grex-${trimmed}`;

  if (!/^--grex-[a-z0-9-]+$/i.test(normalized)) {
    throw new GrexSecurityError(`Invalid --grex-* token name: "${name}".`);
  }
  return normalized.toLowerCase();
}

/**
 * Validate and normalize either a --grex-* custom property or an allowlisted CSS property.
 * @param {string} prop
 * @returns {string}
 */
export function normalizeStyleProperty(prop) {
  if (typeof prop !== "string" || prop.trim() === "") {
    throw new GrexSecurityError("Style property name must be a non-empty string.");
  }
  const trimmed = prop.trim();
  if (trimmed.startsWith("--")) {
    return normalizeTokenName(trimmed);
  }
  const mapped = ALLOWED_STYLE_PROPERTIES[trimmed];
  if (!mapped) {
    throw new GrexSecurityError(`Disallowed CSS style property "${trimmed}" blocked by Grex CSS policy.`);
  }
  return mapped;
}

/**
 * Validate a CSS token/style value to prevent style-block injection.
 * @param {unknown} value
 * @returns {string}
 */
export function validateTokenValue(value) {
  if (value == null) {
    return "";
  }
  const str = String(value).trim();
  if (UNSAFE_CSS_VALUE_PATTERN.test(str)) {
    throw new GrexSecurityError(`Unsafe CSS token value blocked: "${str}".`);
  }
  return str;
}

/**
 * Apply --grex-* CSS custom properties directly onto a DOM element (no wrapper divs).
 * @param {Element} element
 * @param {Record<string, unknown>} tokens
 */
export function applyTokens(element, tokens) {
  if (!element || !element.style) {
    throw new TypeError("applyTokens(element, tokens) requires a DOM element with .style.");
  }
  if (!tokens || typeof tokens !== "object") {
    return;
  }
  for (const [rawName, rawValue] of Object.entries(tokens)) {
    const name = normalizeTokenName(rawName);
    const val = validateTokenValue(rawValue);
    if (val === "") {
      element.style.removeProperty(name);
    } else {
      element.style.setProperty(name, val);
    }
  }
}

function formatDeclBlock(indent, propMap, allowCssProps = false) {
  const entries = Object.entries(propMap || {});
  if (entries.length === 0) {
    return [];
  }
  return entries.map(([k, v]) => {
    const key = allowCssProps ? normalizeStyleProperty(k) : normalizeTokenName(k);
    return `${indent}${key}: ${validateTokenValue(v)};`;
  });
}

function assertSafeSelector(selector) {
  if (typeof selector !== "string" || selector.trim() === "" || /[{}<>]/.test(selector)) {
    throw new GrexSecurityError(`Unsafe CSS selector blocked: "${String(selector)}".`);
  }
  return selector.trim();
}

function compileSelectorRules(selectors, breakpoints, allowCssProps) {
  const chunks = [];
  const mediaBuckets = new Map();

  for (const [rawSelector, deviceMap] of Object.entries(selectors || {})) {
    const selector = assertSafeSelector(rawSelector);
    if (!deviceMap || typeof deviceMap !== "object") {
      continue;
    }

    for (const [bpName, propMap] of Object.entries(deviceMap)) {
      if (!(bpName in breakpoints)) {
        throw new GrexSecurityError(`Unknown breakpoint "${bpName}" in CSS compiler.`);
      }
      const decls = formatDeclBlock("  ", propMap, allowCssProps);
      if (decls.length === 0) {
        continue;
      }
      const query = breakpoints[bpName];
      if (!query) {
        chunks.push(`${selector} {\n${decls.join("\n")}\n}`);
      } else {
        if (!mediaBuckets.has(query)) {
          mediaBuckets.set(query, []);
        }
        const indented = decls.map((line) => `  ${line}`);
        mediaBuckets.get(query).push(`  ${selector} {\n${indented.join("\n")}\n  }`);
      }
    }
  }

  for (const [query, rules] of mediaBuckets.entries()) {
    chunks.push(`@media ${query} {\n${rules.join("\n")}\n}`);
  }
  return chunks;
}

/**
 * Compile responsive --grex-* tokens into deterministic CSS suitable for /static/grex/*.css
 * on --read-only Docker containers served via GRAB server.asset.
 *
 * @param {{
 *   root?: Record<string, unknown>,
 *   selectors?: Record<string, Record<string, Record<string, unknown>>>,
 *   breakpoints?: Record<string, string | null>
 * }} config
 * @returns {string}
 */
export function compileTokenCss(config = {}) {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...(config.breakpoints || {}) };
  const chunks = [];

  if (config.root && Object.keys(config.root).length > 0) {
    const decls = formatDeclBlock("  ", config.root, false);
    chunks.push(`:root {\n${decls.join("\n")}\n}`);
  }

  chunks.push(...compileSelectorRules(config.selectors, breakpoints, false));

  return chunks.join("\n\n") + (chunks.length > 0 ? "\n" : "");
}

function hashStringHex(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function hasAnyStyleDeclarations(styles) {
  if (!styles || typeof styles !== "object") {
    return false;
  }
  return Object.values(styles).some((bpMap) => bpMap && typeof bpMap === "object" && Object.keys(bpMap).length > 0);
}

/**
 * Compute deterministic CSS class name for a GrexElementNode that declares `styles`.
 * Returns null if the node has no style declarations.
 * @param {{ id?: string, styles?: Record<string, unknown> }} node
 * @returns {string | null}
 */
export function getElementStyleClass(node) {
  if (!node || !hasAnyStyleDeclarations(node.styles)) {
    return null;
  }
  if (typeof node.id === "string" && node.id.trim() !== "") {
    const cleanId = node.id.trim();
    if (!/^[a-z0-9_-]+$/i.test(cleanId)) {
      throw new GrexSecurityError(`Invalid element id "${node.id}" for CSS class generation.`);
    }
    return `grex-el-${cleanId}`;
  }
  return `grex-s-${hashStringHex(JSON.stringify(node.styles))}`;
}

/**
 * Compile per-element `styles` (`base`, `tablet`, `mobile`) and optional `root` tokens
 * across one or more GrexElementNodes into deterministic CSS for `/static/grex/`.
 *
 * @param {object | Array<object>} nodes
 * @param {{ root?: Record<string, unknown>, breakpoints?: Record<string, string | null> }} [options]
 * @returns {string}
 */
export function compileElementStyles(nodes, options = {}) {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...(options.breakpoints || {}) };
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const selectors = {};

  const visit = (node) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const cls = getElementStyleClass(node);
    if (cls) {
      selectors[`.${cls}`] = node.styles;
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        if (child && typeof child === "object" && ("type" in child || "tag" in child)) {
          visit(child);
        }
      }
    }
  };

  for (const node of list) {
    visit(node);
  }

  const chunks = [];
  if (options.root && Object.keys(options.root).length > 0) {
    const decls = formatDeclBlock("  ", options.root, false);
    chunks.push(`:root {\n${decls.join("\n")}\n}`);
  }
  chunks.push(...compileSelectorRules(selectors, breakpoints, true));

  return chunks.join("\n\n") + (chunks.length > 0 ? "\n" : "");
}

// --- dom.js ---
/**
 * Grex JS v0.1 Zero-Wrapper-Div Semantic DOM Engine & Selective Hydration (ADR-018).
 */


function isReactiveValue(val) {
  return Boolean(val && typeof val === "object" && typeof val.get === "function");
}

function resolveMaybeReactive(val) {
  if (isReactiveValue(val)) {
    return val.get();
  }
  if (typeof val === "function") {
    return val();
  }
  return val;
}

function applySafeAttribute(element, attrName, value) {
  if (value === false || value == null) {
    sanitizeAttributeValue(attrName, "");
    element.removeAttribute(attrName);
    return;
  }
  const finalValue = value === true ? "" : sanitizeAttributeValue(attrName, value);
  element.setAttribute(attrName, finalValue);
}

/**
 * Bind reactive text, attributes, --grex-* tokens, and event listeners directly
 * to an existing semantic DOM element without inserting any wrapper <div>s.
 *
 * @param {Element} element
 * @param {{
 *   text?: unknown,
 *   attrs?: Record<string, unknown>,
 *   tokens?: Record<string, unknown>,
 *   on?: Record<string, EventListener>
 * }} [bindings]
 * @returns {{ element: Element, dispose(): void }}
 */
export function bindElement(element, bindings = {}) {
  const disposers = [];
  const listeners = [];

  if ("text" in bindings && bindings.text !== undefined) {
    if (isReactiveValue(bindings.text) || typeof bindings.text === "function") {
      disposers.push(
        effect(() => {
          setSafeText(element, resolveMaybeReactive(bindings.text));
        })
      );
    } else {
      setSafeText(element, bindings.text);
    }
  }

  if (bindings.attrs && typeof bindings.attrs === "object") {
    for (const [attrName, attrValue] of Object.entries(bindings.attrs)) {
      if (isReactiveValue(attrValue) || typeof attrValue === "function") {
        disposers.push(
          effect(() => {
            applySafeAttribute(element, attrName, resolveMaybeReactive(attrValue));
          })
        );
      } else {
        applySafeAttribute(element, attrName, attrValue);
      }
    }
  }

  if (bindings.tokens && typeof bindings.tokens === "object") {
    for (const [rawToken, tokenValue] of Object.entries(bindings.tokens)) {
      const tokenName = normalizeTokenName(rawToken);
      if (isReactiveValue(tokenValue) || typeof tokenValue === "function") {
        disposers.push(
          effect(() => {
            const val = validateTokenValue(resolveMaybeReactive(tokenValue));
            if (val === "") {
              element.style.removeProperty(tokenName);
            } else {
              element.style.setProperty(tokenName, val);
            }
          })
        );
      } else {
        const val = validateTokenValue(tokenValue);
        if (val === "") {
          element.style.removeProperty(tokenName);
        } else {
          element.style.setProperty(tokenName, val);
        }
      }
    }
  }

  if (bindings.on && typeof bindings.on === "object") {
    for (const [eventName, handler] of Object.entries(bindings.on)) {
      if (typeof handler !== "function") {
        throw new TypeError(`Event handler for "${eventName}" must be a function.`);
      }
      const cleanEvent = eventName.trim().toLowerCase();
      element.addEventListener(cleanEvent, handler);
      listeners.push([cleanEvent, handler]);
    }
  }

  return {
    element,
    dispose() {
      for (const disposeFn of disposers) {
        disposeFn();
      }
      disposers.length = 0;
      for (const [cleanEvent, handler] of listeners) {
        element.removeEventListener(cleanEvent, handler);
      }
      listeners.length = 0;
    },
  };
}

/**
 * Render a semantic HTML5 element directly with zero wrapper <div> nodes.
 *
 * @param {{
 *   tag: string,
 *   text?: unknown,
 *   attrs?: Record<string, unknown>,
 *   tokens?: Record<string, unknown>,
 *   on?: Record<string, EventListener>,
 *   children?: Array<unknown>
 * }} spec
 * @param {{ document?: Document }} [options]
 * @returns {{ element: Element, dispose(): void }}
 */
export function renderElement(spec, options = {}) {
  const doc = options.document || globalThis.document;
  if (!doc || typeof doc.createElement !== "function") {
    throw new Error("renderElement requires a DOM document.");
  }
  if (!spec || typeof spec !== "object") {
    throw new TypeError("renderElement(spec) requires a specification object.");
  }

  const tag = assertSafeTag(spec.tag);
  const element = doc.createElement(tag);
  const childDisposers = [];

  const rootBinding = bindElement(element, {
    text: spec.text,
    attrs: spec.attrs,
    tokens: spec.tokens,
    on: spec.on,
  });

  if (Array.isArray(spec.children)) {
    for (const child of spec.children) {
      if (child == null || child === false) {
        continue;
      }
      if (isReactiveValue(child) || typeof child === "function") {
        const textNode = doc.createTextNode("");
        element.appendChild(textNode);
        childDisposers.push(
          effect(() => {
            setSafeText(textNode, resolveMaybeReactive(child));
          })
        );
      } else if (typeof child === "object" && "tag" in child) {
        const renderedChild = renderElement(child, { document: doc });
        element.appendChild(renderedChild.element);
        childDisposers.push(renderedChild.dispose);
      } else if (typeof child === "object" && child.nodeType) {
        element.appendChild(child);
      } else {
        const textNode = doc.createTextNode(String(child));
        element.appendChild(textNode);
      }
    }
  }

  return {
    element,
    dispose() {
      rootBinding.dispose();
      for (const disposeFn of childDisposers) {
        disposeFn();
      }
      childDisposers.length = 0;
    },
  };
}

/**
 * Selectively hydrate server-rendered .grab.html markup in place via data-grex-* attributes.
 * Never tears down existing DOM nodes and never inserts wrapper <div> elements.
 *
 * @param {Document | Element} root
 * @param {{
 *   signals?: Record<string, { get(): unknown, set?(v: unknown): void }>,
 *   actions?: Record<string, EventListener>
 * }} [registry]
 * @returns {{
 *   elements: Record<string, Element>,
 *   signals: Record<string, { get(): unknown, set?(v: unknown): void }>,
 *   dispose(): void
 * }}
 */
export function hydrate(root = globalThis.document, registry = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    throw new Error("hydrate(root, registry) requires a DOM document or root element.");
  }

  const signals = registry.signals || {};
  const actions = registry.actions || {};
  const elements = {};
  const disposers = [];

  const candidates = Array.from(root.querySelectorAll("*"));
  if (typeof root.getAttribute === "function" && root.attributes) {
    candidates.unshift(root);
  }

  for (const el of candidates) {
    const grexId = el.getAttribute("data-grex-id");
    if (grexId) {
      elements[grexId] = el;
    }

    const attrsObj = el.attributes ? Array.from(el.attributes) : [];
    const bindings = { attrs: {}, tokens: {}, on: {} };
    let hasBindings = false;

    for (const attr of attrsObj) {
      const name = attr.name;
      const key = attr.value;

      if (name === "data-grex-text") {
        if (key in signals) {
          bindings.text = signals[key];
          hasBindings = true;
        }
      } else if (name.startsWith("data-grex-attr-")) {
        const targetAttr = name.slice("data-grex-attr-".length);
        if (key in signals) {
          bindings.attrs[targetAttr] = signals[key];
          hasBindings = true;
        }
      } else if (name.startsWith("data-grex-token-")) {
        const tokenSuffix = name.slice("data-grex-token-".length);
        if (key in signals) {
          bindings.tokens[tokenSuffix] = signals[key];
          hasBindings = true;
        }
      } else if (name.startsWith("data-grex-on-")) {
        const eventName = name.slice("data-grex-on-".length);
        if (typeof actions[key] === "function") {
          bindings.on[eventName] = actions[key];
          hasBindings = true;
        }
      }
    }

    if (hasBindings) {
      const bound = bindElement(el, bindings);
      disposers.push(bound.dispose);
    }
  }

  return {
    elements,
    signals,
    dispose() {
      for (const disposeFn of disposers) {
        disposeFn();
      }
      disposers.length = 0;
    },
  };
}

// --- elements.js ---
/**
 * Grex JS v0.2 Zero-Bloat Layout, Typography & Media Elements.
 * 12 native semantic HTML5 elements with zero wrapper <div>s,
 * strict XSS allowlists (zero innerHTML), and accessibility defaults.
 */


const SVG_NS = "http://www.w3.org/2000/svg";

const RICHTEXT_ALLOWED_TAGS = new Set([
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "code",
  "mark",
  "small",
  "sup",
  "sub",
  "br",
  "a",
]);

const RICHTEXT_DROP_CONTENT_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "applet",
  "noscript",
  "template",
  "svg",
]);

const ALLOWED_SVG_TAGS = new Set([
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
]);

const ALLOWED_SVG_ATTRS = new Set([
  "d",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "width",
  "height",
  "x1",
  "y1",
  "x2",
  "y2",
  "points",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "fill-rule",
  "clip-rule",
]);

const LAYOUT_TAGS = Object.freeze({
  Section: ["section", "header", "footer", "main", "aside"],
  Container: ["section", "article", "main", "header", "footer"],
  Grid: ["section", "ul", "ol", "article", "nav"],
  Stack: ["section", "header", "nav", "footer", "ul", "ol", "article"],
  Card: ["article", "section", "aside"],
  Text: ["p", "span", "small", "strong", "em", "blockquote", "time", "code"],
  RichText: ["p", "article", "section", "span"],
});

export function isReactive(val) {
  return Boolean(val && typeof val === "object" && typeof val.get === "function");
}

export function readVal(val) {
  if (isReactive(val)) {
    return val.get();
  }
  if (typeof val === "function") {
    return val();
  }
  return val;
}

function resolveTag(requested, defaultTag, allowedList) {
  if (requested == null || requested === "") {
    return defaultTag;
  }
  if (typeof requested !== "string") {
    throw new GrexSecurityError("Element tag must be a string.");
  }
  const clean = requested.trim().toLowerCase();
  if (!allowedList.includes(clean)) {
    throw new GrexSecurityError(
      `Disallowed tag "${clean}" (allowed: ${allowedList.join(", ")}).`
    );
  }
  return clean;
}

function joinClasses(...parts) {
  const tokens = [];
  for (const part of parts) {
    if (typeof part === "string" && part.trim() !== "") {
      tokens.push(part.trim());
    }
  }
  return tokens.length > 0 ? tokens.join(" ") : undefined;
}

export function buildBaseSpec(baseClass, config = {}) {
  const styleClass = getElementStyleClass(config);
  const attrs = { ...(config.attrs || {}) };
  if (typeof config.id === "string" && config.id.trim() !== "") {
    attrs["data-grex-id"] = config.id.trim();
  }
  const mergedClass = joinClasses(baseClass, styleClass, attrs.class, config.className);
  if (mergedClass) {
    attrs.class = mergedClass;
  }
  return {
    attrs,
    tokens: { ...(config.tokens || {}) },
    on: { ...(config.on || {}) },
  };
}

export function appendChildren(parentEl, children, doc, disposers) {
  if (!Array.isArray(children)) {
    return;
  }
  for (const child of children) {
    if (child == null || child === false) {
      continue;
    }
    if (isReactive(child) || typeof child === "function") {
      const textNode = doc.createTextNode("");
      parentEl.appendChild(textNode);
      disposers.push(
        effect(() => {
          setSafeText(textNode, readVal(child));
        })
      );
    } else if (typeof child === "object" && "type" in child) {
      const rendered = renderNode(child, { document: doc });
      parentEl.appendChild(rendered.element);
      disposers.push(rendered.dispose);
    } else if (typeof child === "object" && "tag" in child) {
      const rendered = renderElement(child, { document: doc });
      parentEl.appendChild(rendered.element);
      disposers.push(rendered.dispose);
    } else if (typeof child === "object" && child.element && child.element.nodeType) {
      parentEl.appendChild(child.element);
      if (typeof child.dispose === "function") {
        disposers.push(child.dispose);
      }
    } else if (typeof child === "object" && child.nodeType) {
      parentEl.appendChild(child);
    } else {
      parentEl.appendChild(doc.createTextNode(String(child)));
    }
  }
}

function renderContainerElement(typeName, defaultTag, baseClass, config = {}, options = {}, extraTokens = {}) {
  const doc = options.document || globalThis.document;
  if (!doc || typeof doc.createElement !== "function") {
    throw new Error(`${typeName} requires a DOM document.`);
  }
  const props = config.props || {};
  const tag = resolveTag(config.tag, defaultTag, LAYOUT_TAGS[typeName]);
  const base = buildBaseSpec(baseClass, config);

  if (props.label != null) {
    base.attrs["aria-label"] = props.label;
  }
  if (props.labelledBy != null) {
    base.attrs["aria-labelledby"] = props.labelledBy;
  }
  Object.assign(base.tokens, extraTokens);

  const el = doc.createElement(tag);
  const disposers = [];
  const rootBinding = bindElement(el, base);
  disposers.push(rootBinding.dispose);
  appendChildren(el, config.children, doc, disposers);

  return {
    element: el,
    dispose() {
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 1-5: Layout Elements ---

export function Section(config = {}, options = {}) {
  return renderContainerElement("Section", "section", "grex-section", config, options);
}

export function Container(config = {}, options = {}) {
  const props = config.props || {};
  const extraTokens = {};
  if (props.maxWidth != null) {
    extraTokens["--grex-container-max-width"] = props.maxWidth;
  }
  return renderContainerElement("Container", "section", "grex-container", config, options, extraTokens);
}

export function Grid(config = {}, options = {}) {
  const props = config.props || {};
  const extraTokens = {};
  if (props.columns != null) {
    extraTokens["--grex-grid-cols"] = props.columns;
  }
  if (props.gap != null) {
    extraTokens["--grex-gap"] = props.gap;
  }
  if (props.align != null) {
    extraTokens["--grex-align"] = props.align;
  }
  if (props.justify != null) {
    extraTokens["--grex-justify"] = props.justify;
  }
  return renderContainerElement("Grid", "section", "grex-grid", config, options, extraTokens);
}

export function Stack(config = {}, options = {}) {
  const props = config.props || {};
  const extraTokens = {};
  if (props.direction != null) {
    extraTokens["--grex-stack-dir"] = props.direction;
  }
  if (props.wrap != null) {
    extraTokens["--grex-stack-wrap"] = props.wrap;
  }
  if (props.gap != null) {
    extraTokens["--grex-gap"] = props.gap;
  }
  if (props.align != null) {
    extraTokens["--grex-align"] = props.align;
  }
  if (props.justify != null) {
    extraTokens["--grex-justify"] = props.justify;
  }
  return renderContainerElement("Stack", "section", "grex-stack", config, options, extraTokens);
}

export function Card(config = {}, options = {}) {
  const props = config.props || {};
  const cls = props.elevated ? "grex-card grex-card-elevated" : "grex-card";
  return renderContainerElement("Card", "article", cls, config, options);
}

// --- 6-10: Typography & Action Elements ---

export function Heading(config = {}, options = {}) {
  const props = config.props || {};
  const level = props.level === undefined ? 2 : props.level;
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new GrexSecurityError(`Heading level must be an integer 1..6; received "${String(level)}".`);
  }
  const tag = `h${level}`;
  if (config.tag && config.tag.toLowerCase() !== tag) {
    throw new GrexSecurityError(`Heading tag "${config.tag}" does not match level ${level}.`);
  }
  const base = buildBaseSpec("grex-heading", config);
  return renderElement(
    {
      tag,
      text: props.text !== undefined ? props.text : config.text,
      attrs: base.attrs,
      tokens: base.tokens,
      on: base.on,
    },
    options
  );
}

export function Text(config = {}, options = {}) {
  const props = config.props || {};
  const tag = resolveTag(config.tag, "p", LAYOUT_TAGS.Text);
  const base = buildBaseSpec("grex-text", config);
  if (props.dateTime != null) {
    base.attrs.datetime = props.dateTime;
  }
  return renderElement(
    {
      tag,
      text: props.text !== undefined ? props.text : config.text,
      attrs: base.attrs,
      tokens: base.tokens,
      on: base.on,
    },
    options
  );
}

function mergeRelNoopener(existingRel) {
  const tokens = new Set(
    typeof existingRel === "string"
      ? existingRel.trim().split(/\s+/).filter(Boolean)
      : []
  );
  tokens.add("noopener");
  tokens.add("noreferrer");
  return Array.from(tokens).join(" ");
}

function isExternalHref(href) {
  return typeof href === "string" && /^(https?:)?\/\//i.test(href.trim());
}

function decodeHtmlEntities(text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity) => {
    const lower = entity.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    if (lower === "quot") return '"';
    if (lower === "apos" || lower === "#39") return "'";
    if (lower === "nbsp") return "\u00a0";
    if (lower.startsWith("#x")) {
      const code = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (lower.startsWith("#")) {
      const code = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    return full;
  });
}

function parseTagAttributes(rawAttrStr) {
  const attrs = {};
  const attrRegex = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRegex.exec(rawAttrStr)) !== null) {
    const name = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? "";
    if (!isForbiddenAttribute(name)) {
      attrs[name] = decodeHtmlEntities(val);
    }
  }
  return attrs;
}

function appendSafeRichHtml(container, html, doc) {
  const tokenRegex = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)([^>]*)>/g;
  const stack = [container];
  let lastIndex = 0;
  let dropDepth = 0;
  let dropTag = null;
  let match;

  while ((match = tokenRegex.exec(html)) !== null) {
    const [fullMatch, rawTagName, rawAttrs] = match;
    const isClosing = fullMatch.startsWith("</");
    const tag = rawTagName.toLowerCase();

    if (match.index > lastIndex && dropDepth === 0) {
      const textChunk = decodeHtmlEntities(html.slice(lastIndex, match.index));
      if (textChunk) {
        stack[stack.length - 1].appendChild(doc.createTextNode(textChunk));
      }
    }
    lastIndex = tokenRegex.lastIndex;

    if (RICHTEXT_DROP_CONTENT_TAGS.has(tag)) {
      if (!isClosing && !fullMatch.endsWith("/>")) {
        if (dropDepth === 0) {
          dropTag = tag;
        }
        if (tag === dropTag) {
          dropDepth += 1;
        }
      } else if (isClosing && dropDepth > 0 && tag === dropTag) {
        dropDepth -= 1;
        if (dropDepth === 0) {
          dropTag = null;
        }
      }
      continue;
    }

    if (dropDepth > 0) {
      continue;
    }

    if (!RICHTEXT_ALLOWED_TAGS.has(tag)) {
      // Non-allowlisted tag (e.g. <div>, <img>) is stripped; inner text remains safe.
      continue;
    }

    if (isClosing) {
      for (let i = stack.length - 1; i >= 1; i -= 1) {
        if (stack[i].localName === tag || stack[i].tagName.toLowerCase() === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node = doc.createElement(tag);
    if (tag === "a") {
      const parsed = parseTagAttributes(rawAttrs);
      if (parsed.href && isSafeUrl(parsed.href)) {
        node.setAttribute("href", parsed.href);
      }
      if (parsed.target === "_blank") {
        node.setAttribute("target", "_blank");
      }
      if (parsed.target === "_blank" || (parsed.href && isExternalHref(parsed.href))) {
        node.setAttribute("rel", mergeRelNoopener(parsed.rel));
      } else if (parsed.rel) {
        node.setAttribute("rel", parsed.rel);
      }
      if (parsed.title) {
        node.setAttribute("title", parsed.title);
      }
    }

    stack[stack.length - 1].appendChild(node);
    if (tag !== "br" && !fullMatch.endsWith("/>")) {
      stack.push(node);
    }
  }

  if (lastIndex < html.length && dropDepth === 0) {
    const tail = decodeHtmlEntities(html.slice(lastIndex));
    if (tail) {
      stack[stack.length - 1].appendChild(doc.createTextNode(tail));
    }
  }
}

function appendStructuredRichNodes(container, nodes, doc, disposers) {
  for (const item of nodes) {
    if (item == null || item === false) {
      continue;
    }
    if (typeof item === "string" || typeof item === "number") {
      container.appendChild(doc.createTextNode(String(item)));
      continue;
    }
    if (isReactive(item) || typeof item === "function") {
      const textNode = doc.createTextNode("");
      container.appendChild(textNode);
      disposers.push(
        effect(() => {
          setSafeText(textNode, readVal(item));
        })
      );
      continue;
    }
    if (typeof item !== "object" || typeof item.tag !== "string") {
      throw new GrexSecurityError("Invalid RichText inline node.");
    }
    const tag = item.tag.trim().toLowerCase();
    if (!RICHTEXT_ALLOWED_TAGS.has(tag)) {
      throw new GrexSecurityError(`Disallowed RichText inline tag "${tag}".`);
    }
    const attrs = { ...(item.attrs || {}) };
    if (tag === "a") {
      const href = attrs.href;
      if (href != null && !isSafeUrl(String(href))) {
        throw new GrexSecurityError(`Unsafe URL blocked in RichText link: "${String(href)}".`);
      }
      if (attrs.target === "_blank" || isExternalHref(href)) {
        attrs.rel = mergeRelNoopener(attrs.rel);
      }
    }
    const childEl = doc.createElement(tag);
    const bound = bindElement(childEl, { text: item.text, attrs });
    disposers.push(bound.dispose);
    if (Array.isArray(item.children)) {
      appendStructuredRichNodes(childEl, item.children, doc, disposers);
    }
    container.appendChild(childEl);
  }
}

function clearElementChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function RichText(config = {}, options = {}) {
  const doc = options.document || globalThis.document;
  if (!doc || typeof doc.createElement !== "function") {
    throw new Error("RichText requires a DOM document.");
  }
  const props = config.props || {};
  const tag = resolveTag(config.tag, "p", LAYOUT_TAGS.RichText);
  const base = buildBaseSpec("grex-richtext", config);
  const el = doc.createElement(tag);
  const disposers = [];

  const rootBinding = bindElement(el, base);
  disposers.push(rootBinding.dispose);

  if (Array.isArray(props.nodes)) {
    appendStructuredRichNodes(el, props.nodes, doc, disposers);
  } else if (props.html !== undefined) {
    if (isReactive(props.html) || typeof props.html === "function") {
      disposers.push(
        effect(() => {
          clearElementChildren(el);
          appendSafeRichHtml(el, String(readVal(props.html) ?? ""), doc);
        })
      );
    } else {
      appendSafeRichHtml(el, String(props.html ?? ""), doc);
    }
  } else if (props.text !== undefined) {
    setSafeText(el, readVal(props.text));
  }

  return {
    element: el,
    dispose() {
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

export function Link(config = {}, options = {}) {
  const doc = options.document || globalThis.document;
  if (!doc || typeof doc.createElement !== "function") {
    throw new Error("Link requires a DOM document.");
  }
  const props = config.props || {};
  if (config.tag && config.tag.toLowerCase() !== "a") {
    throw new GrexSecurityError(`Link must render <a>; received "${config.tag}".`);
  }
  const base = buildBaseSpec("grex-link", config);
  const hrefProp = props.href !== undefined ? props.href : base.attrs.href;
  if (hrefProp === undefined) {
    throw new GrexSecurityError("Link requires an href prop.");
  }

  base.attrs.href = hrefProp;
  if (props.target != null) {
    base.attrs.target = props.target;
  }
  if (props.label != null) {
    base.attrs["aria-label"] = props.label;
  }

  const shouldEnforceNoopener =
    props.external === true ||
    props.target === "_blank" ||
    (!isReactive(hrefProp) && typeof hrefProp !== "function" && isExternalHref(hrefProp));

  if (isReactive(hrefProp) || typeof hrefProp === "function") {
    base.attrs.rel = () => {
      const currentHref = readVal(hrefProp);
      if (props.external === true || props.target === "_blank" || isExternalHref(currentHref)) {
        return mergeRelNoopener(props.rel || base.attrs.rel);
      }
      return props.rel || base.attrs.rel || false;
    };
  } else if (shouldEnforceNoopener) {
    base.attrs.rel = mergeRelNoopener(props.rel || base.attrs.rel);
  } else if (props.rel != null) {
    base.attrs.rel = props.rel;
  }

  const el = doc.createElement("a");
  const disposers = [];
  const binding = bindElement(el, {
    text: props.text !== undefined ? props.text : config.text,
    attrs: base.attrs,
    tokens: base.tokens,
    on: base.on,
  });
  disposers.push(binding.dispose);
  appendChildren(el, config.children, doc, disposers);

  return {
    element: el,
    dispose() {
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

const ALLOWED_BUTTON_TYPES = new Set(["button", "submit", "reset"]);

export function Button(config = {}, options = {}) {
  const props = config.props || {};
  if (config.tag && config.tag.toLowerCase() !== "button") {
    throw new GrexSecurityError(`Button must render <button>; received "${config.tag}".`);
  }
  const btnType = props.type === undefined ? "button" : String(props.type).trim().toLowerCase();
  if (!ALLOWED_BUTTON_TYPES.has(btnType)) {
    throw new GrexSecurityError(`Invalid Button type "${btnType}".`);
  }

  const base = buildBaseSpec("grex-button", config);
  base.attrs.type = btnType;
  if (props.disabled !== undefined) {
    base.attrs.disabled = props.disabled;
  }
  if (props.pressed !== undefined) {
    base.attrs["aria-pressed"] = props.pressed;
  }
  if (props.expanded !== undefined) {
    base.attrs["aria-expanded"] = props.expanded;
  }
  if (props.label != null) {
    base.attrs["aria-label"] = props.label;
  }
  if (typeof props.onClick === "function") {
    base.on.click = props.onClick;
  }

  return renderElement(
    {
      tag: "button",
      text: props.text !== undefined ? props.text : config.text,
      attrs: base.attrs,
      tokens: base.tokens,
      on: base.on,
    },
    options
  );
}

// --- 11-12: Media Elements ---

function validateSrcset(srcset) {
  const str = String(srcset).trim();
  if (str === "") {
    return "";
  }
  const candidates = str.split(",");
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }
    const urlPart = trimmed.split(/\s+/)[0];
    if (!isSafeUrl(urlPart)) {
      throw new GrexSecurityError(`Unsafe URL blocked inside Image srcset: "${urlPart}".`);
    }
  }
  return str;
}

export function Image(config = {}, options = {}) {
  const props = config.props || {};
  if (config.tag && config.tag.toLowerCase() !== "img") {
    throw new GrexSecurityError(`Image must render <img>; received "${config.tag}".`);
  }
  if (props.src === undefined) {
    throw new GrexSecurityError("Image requires a src prop.");
  }

  const decorative = props.decorative === true;
  if (!decorative && typeof props.alt !== "string" && !isReactive(props.alt)) {
    throw new GrexSecurityError("Image requires an alt string (or decorative: true).");
  }

  const loading = props.loading === undefined ? "lazy" : String(props.loading).toLowerCase();
  if (loading !== "lazy" && loading !== "eager") {
    throw new GrexSecurityError(`Invalid Image loading mode "${loading}".`);
  }
  const decoding = props.decoding === undefined ? "async" : String(props.decoding).toLowerCase();
  if (decoding !== "async" && decoding !== "sync" && decoding !== "auto") {
    throw new GrexSecurityError(`Invalid Image decoding mode "${decoding}".`);
  }

  const base = buildBaseSpec("grex-image", config);
  base.attrs.src = props.src;
  base.attrs.loading = loading;
  base.attrs.decoding = decoding;

  if (decorative) {
    base.attrs.alt = "";
    base.attrs["aria-hidden"] = "true";
  } else {
    base.attrs.alt = props.alt;
  }

  if (props.width != null) {
    base.attrs.width = String(props.width);
  }
  if (props.height != null) {
    base.attrs.height = String(props.height);
  }
  if (props.sizes != null) {
    base.attrs.sizes = props.sizes;
  }
  if (props.srcset !== undefined) {
    if (isReactive(props.srcset) || typeof props.srcset === "function") {
      base.attrs.srcset = () => validateSrcset(readVal(props.srcset));
    } else {
      base.attrs.srcset = validateSrcset(props.srcset);
    }
  }

  return renderElement(
    {
      tag: "img",
      attrs: base.attrs,
      tokens: base.tokens,
      on: base.on,
    },
    options
  );
}

export function Icon(config = {}, options = {}) {
  const doc = options.document || globalThis.document;
  if (!doc || typeof doc.createElementNS !== "function") {
    throw new Error("Icon requires a DOM document with createElementNS().");
  }
  const props = config.props || {};
  if (config.tag && config.tag.toLowerCase() !== "svg") {
    throw new GrexSecurityError(`Icon must render <svg>; received "${config.tag}".`);
  }
  if ("rawSvg" in props || "html" in props) {
    throw new GrexSecurityError("Raw SVG markup is forbidden on Icon; use safe paths or symbolId.");
  }

  const viewBox = props.viewBox === undefined ? "0 0 24 24" : String(props.viewBox).trim();
  if (!/^-?\d+(?:\.\d+)?(?:\s+-?\d+(?:\.\d+)?){3}$/.test(viewBox)) {
    throw new GrexSecurityError(`Invalid SVG viewBox "${viewBox}".`);
  }

  const size = props.size === undefined ? "24" : String(props.size).trim();
  const svg = doc.createElementNS(SVG_NS, "svg");
  const base = buildBaseSpec("grex-icon", config);
  base.attrs.viewBox = viewBox;
  base.attrs.width = size;
  base.attrs.height = size;
  base.attrs.fill = props.fill === undefined ? "none" : String(props.fill);

  if (props.label != null && String(props.label).trim() !== "") {
    base.attrs.role = "img";
    base.attrs["aria-label"] = String(props.label).trim();
  } else {
    base.attrs["aria-hidden"] = "true";
  }

  const binding = bindElement(svg, base);

  if (props.symbolId !== undefined) {
    const sym = String(props.symbolId).trim();
    if (!/^#[a-z0-9_-]+$/i.test(sym)) {
      throw new GrexSecurityError(`Unsafe Icon symbolId "${sym}"; must be a same-document #id.`);
    }
    const useEl = doc.createElementNS(SVG_NS, "use");
    useEl.setAttribute("href", sym);
    svg.appendChild(useEl);
  } else if (Array.isArray(props.paths)) {
    for (const shape of props.paths) {
      if (!shape || typeof shape !== "object" || typeof shape.tag !== "string") {
        throw new GrexSecurityError("Invalid Icon path descriptor.");
      }
      const shapeTag = shape.tag.trim().toLowerCase();
      if (!ALLOWED_SVG_TAGS.has(shapeTag)) {
        throw new GrexSecurityError(`Forbidden SVG tag "${shapeTag}" blocked by Icon allowlist.`);
      }
      const shapeEl = doc.createElementNS(SVG_NS, shapeTag);
      const shapeAttrs = shape.attrs || {};
      for (const [k, v] of Object.entries(shapeAttrs)) {
        const attrKey = k.trim().toLowerCase();
        if (isForbiddenAttribute(attrKey) || !ALLOWED_SVG_ATTRS.has(attrKey)) {
          throw new GrexSecurityError(`Forbidden SVG attribute "${k}" blocked by Icon allowlist.`);
        }
        shapeEl.setAttribute(attrKey, sanitizeAttributeValue(attrKey, v));
      }
      svg.appendChild(shapeEl);
    }
  } else {
    throw new GrexSecurityError("Icon requires either paths[] or symbolId.");
  }

  return {
    element: svg,
    dispose() {
      binding.dispose();
    },
  };
}

export const ELEMENT_REGISTRY = {
  Section,
  Container,
  Grid,
  Stack,
  Card,
  Heading,
  Text,
  RichText,
  Link,
  Button,
  Image,
  Icon,
};

/**
 * Register additional semantic element factories (used by v0.3 interactive components).
 * @param {string} typeName
 * @param {Function} factory
 */
export function registerElementType(typeName, factory) {
  if (typeof typeName === "string" && typeof factory === "function") {
    ELEMENT_REGISTRY[typeName] = factory;
  }
}

/**
 * Render a declarative GrexElementNode JSON object (v0.2) or raw v0.1 spec.
 * @param {object} node
 * @param {{ document?: Document }} [options]
 */
export function renderNode(node, options = {}) {
  if (!node || typeof node !== "object") {
    throw new TypeError("renderNode(node) requires an object.");
  }
  if (typeof node.type === "string") {
    const factory = ELEMENT_REGISTRY[node.type];
    if (!factory) {
      throw new GrexSecurityError(`Unknown Grex element type "${node.type}".`);
    }
    return factory(node, options);
  }
  return renderElement(node, options);
}

// --- interactive.js ---
/**
 * Grex JS v0.3 Zero-Wrapper-Div Interactive & Form Components + Keyed Repeaters (ForEach).
 * 7 semantic components: Form, Input, Select, Tabs, Accordion, Modal, Nav + ForEach.
 */


let interactiveIdSeq = 0;

function nextInteractiveId(prefix) {
  interactiveIdSeq += 1;
  return `${prefix}-${interactiveIdSeq}`;
}

function getDoc(options) {
  const doc = (options && options.document) || globalThis.document;
  if (!doc || typeof doc.createElement !== "function") {
    throw new Error("Grex interactive element requires a DOM document.");
  }
  return doc;
}

function collectFormValues(formEl) {
  const data = {};
  const controls = formEl.querySelectorAll("input, select, textarea");
  for (const ctrl of controls) {
    const name = ctrl.getAttribute("name");
    if (!name) {
      continue;
    }
    data[name] = ctrl.value;
  }
  return data;
}

// --- 1. Form (<form>) ---

export function Form(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  if (config.tag && config.tag.toLowerCase() !== "form") {
    throw new GrexSecurityError(`Form must render <form>; received "${config.tag}".`);
  }

  const base = buildBaseSpec("grex-form", config);
  const method = props.method === undefined ? "post" : String(props.method).trim().toLowerCase();
  if (method !== "post" && method !== "get") {
    throw new GrexSecurityError(`Invalid Form method "${method}"; expected "post" or "get".`);
  }
  base.attrs.method = method;

  if (props.action !== undefined) {
    base.attrs.action = props.action;
  }

  const submitting = isReactive(props.submitting) ? props.submitting : signal(false);
  const error = isReactive(props.error) ? props.error : signal(null);
  const submitted = isReactive(props.submitted) ? props.submitted : signal(false);
  const csrfHeader = props.csrfHeader || "X-CSRF-Token";

  base.attrs["aria-busy"] = () => (submitting.get() ? "true" : "false");

  const formEl = doc.createElement("form");
  const disposers = [];
  const binding = bindElement(formEl, base);
  disposers.push(binding.dispose);

  let csrfHiddenInput = null;
  if (props.csrfField) {
    const fieldName = sanitizeAttributeValue("name", props.csrfField);
    csrfHiddenInput = doc.createElement("input");
    csrfHiddenInput.setAttribute("type", "hidden");
    csrfHiddenInput.setAttribute("name", fieldName);
    formEl.appendChild(csrfHiddenInput);

    if (props.csrfToken !== undefined) {
      if (isReactive(props.csrfToken) || typeof props.csrfToken === "function") {
        disposers.push(
          effect(() => {
            const tok = String(readVal(props.csrfToken) ?? "");
            csrfHiddenInput.setAttribute("value", tok);
            csrfHiddenInput.value = tok;
          })
        );
      } else {
        const tok = String(props.csrfToken ?? "");
        csrfHiddenInput.setAttribute("value", tok);
        csrfHiddenInput.value = tok;
      }
    }
  }

  appendChildren(formEl, config.children, doc, disposers);

  const onSubmitHandler = async (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (submitting.peek()) {
      return;
    }

    const tokenVal = props.csrfToken !== undefined ? readVal(props.csrfToken) : undefined;
    if (method === "post" && props.requireCsrf !== false && props.csrfToken !== undefined && !tokenVal) {
      error.set("Missing CSRF token.");
      return;
    }

    submitting.set(true);
    error.set(null);
    try {
      if (csrfHiddenInput && tokenVal !== undefined) {
        csrfHiddenInput.setAttribute("value", String(tokenVal));
        csrfHiddenInput.value = String(tokenVal);
      }
      if (typeof props.onSubmit === "function") {
        await props.onSubmit({
          event,
          form: formEl,
          values: collectFormValues(formEl),
          csrfToken: tokenVal,
          csrfHeader,
        });
      }
      submitted.set(true);
    } catch (err) {
      error.set(err && err.message ? err.message : String(err));
    } finally {
      submitting.set(false);
    }
  };

  formEl.addEventListener("submit", onSubmitHandler);

  return {
    element: formEl,
    submitting,
    error,
    submitted,
    dispose() {
      formEl.removeEventListener("submit", onSubmitHandler);
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 2. Input (<label> + <input>/<textarea> + <small role="alert">) ---

const ALLOWED_INPUT_TYPES = new Set([
  "text",
  "email",
  "password",
  "search",
  "tel",
  "url",
  "number",
  "hidden",
  "textarea",
]);

function validateInputRules(val, props) {
  const str = val == null ? "" : String(val);

  if (props.required && str.trim() === "") {
    return typeof props.required === "string" ? props.required : "This field is required.";
  }
  if (str !== "") {
    if (props.grabType === "GrabInteger" && !/^[+-]?\d+$/.test(str.trim())) {
      return "Must be an exact whole integer.";
    }
    if (props.grabType === "GrabDecimal" && !/^[+-]?\d+(?:\.\d+)?$/.test(str.trim())) {
      return "Must be an exact base-10 decimal value.";
    }
    if (typeof props.minLength === "number" && str.length < props.minLength) {
      return `Must be at least ${props.minLength} characters.`;
    }
    if (typeof props.maxLength === "number" && str.length > props.maxLength) {
      return `Must be at most ${props.maxLength} characters.`;
    }
    if (props.pattern) {
      const rx = props.pattern instanceof RegExp ? props.pattern : new RegExp(props.pattern);
      if (!rx.test(str)) {
        return props.patternMessage || "Invalid format.";
      }
    }
  }
  if (typeof props.validate === "function") {
    const customErr = props.validate(str);
    if (customErr) {
      return String(customErr);
    }
  }
  return null;
}

export function Input(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  const inputType = props.type === undefined ? "text" : String(props.type).trim().toLowerCase();
  if (!ALLOWED_INPUT_TYPES.has(inputType)) {
    throw new GrexSecurityError(`Disallowed Input type "${inputType}".`);
  }

  const controlId = props.inputId || (config.id ? `${config.id}-input` : nextInteractiveId("grex-input"));
  const errorId = `${controlId}-error`;
  const valueSignal = isReactive(props.value) ? props.value : signal(props.value == null ? "" : String(props.value));
  const errorSignal = isReactive(props.error) ? props.error : signal(null);

  const isTextarea = inputType === "textarea";
  const controlEl = doc.createElement(isTextarea ? "textarea" : "input");
  controlEl.setAttribute("id", controlId);
  if (!isTextarea) {
    controlEl.setAttribute("type", inputType);
  }
  if (props.name != null) {
    controlEl.setAttribute("name", sanitizeAttributeValue("name", props.name));
  }
  if (props.placeholder != null) {
    controlEl.setAttribute("placeholder", String(props.placeholder));
  }
  if (props.required) {
    controlEl.setAttribute("required", "");
  }
  if (props.disabled) {
    controlEl.setAttribute("disabled", "");
  }
  if (props.grabType === "GrabDecimal") {
    controlEl.setAttribute("inputmode", "decimal");
  } else if (props.grabType === "GrabInteger") {
    controlEl.setAttribute("inputmode", "numeric");
  } else if (props.inputMode) {
    controlEl.setAttribute("inputmode", String(props.inputMode));
  }
  if (props.bare && props.label != null) {
    controlEl.setAttribute("aria-label", String(props.label));
  }

  const disposers = [];
  const base = buildBaseSpec(props.bare ? "grex-input" : "grex-field", config);

  const errorEl = doc.createElement("small");
  errorEl.setAttribute("id", errorId);
  errorEl.setAttribute("role", "alert");
  errorEl.setAttribute("hidden", "");

  const runValidation = (currentVal) => {
    const errMsg = validateInputRules(currentVal, props);
    errorSignal.set(errMsg);
    if (errMsg) {
      controlEl.setAttribute("aria-invalid", "true");
      controlEl.setAttribute("aria-describedby", errorId);
      errorEl.removeAttribute("hidden");
      setSafeText(errorEl, errMsg);
    } else {
      controlEl.removeAttribute("aria-invalid");
      controlEl.removeAttribute("aria-describedby");
      errorEl.setAttribute("hidden", "");
      setSafeText(errorEl, "");
    }
    return errMsg === null;
  };

  disposers.push(
    effect(() => {
      const nextStr = valueSignal.get() == null ? "" : String(valueSignal.get());
      controlEl.value = nextStr;
      controlEl.setAttribute("value", nextStr);
      if (isTextarea) {
        setSafeText(controlEl, nextStr);
      }
    })
  );

  const onInput = (ev) => {
    const raw = ev && ev.target && typeof ev.target.value === "string" ? ev.target.value : controlEl.value;
    valueSignal.set(String(raw));
    if (errorSignal.peek() !== null || props.validateOnInput) {
      runValidation(raw);
    }
  };

  const onBlur = () => {
    runValidation(controlEl.value);
  };

  controlEl.addEventListener("input", onInput);
  controlEl.addEventListener("blur", onBlur);

  if (props.bare) {
    const bound = bindElement(controlEl, base);
    disposers.push(bound.dispose);
    return {
      element: controlEl,
      input: controlEl,
      value: valueSignal,
      error: errorSignal,
      validate: () => runValidation(controlEl.value),
      dispose() {
        controlEl.removeEventListener("input", onInput);
        controlEl.removeEventListener("blur", onBlur);
        for (const fn of disposers) {
          fn();
        }
        disposers.length = 0;
      },
    };
  }

  const labelEl = doc.createElement("label");
  labelEl.setAttribute("for", controlId);
  const bound = bindElement(labelEl, base);
  disposers.push(bound.dispose);

  if (props.label != null) {
    const caption = doc.createElement("span");
    caption.setAttribute("class", "grex-label");
    setSafeText(caption, props.label);
    labelEl.appendChild(caption);
  }
  labelEl.appendChild(controlEl);
  labelEl.appendChild(errorEl);

  return {
    element: labelEl,
    input: controlEl,
    value: valueSignal,
    error: errorSignal,
    validate: () => runValidation(controlEl.value),
    dispose() {
      controlEl.removeEventListener("input", onInput);
      controlEl.removeEventListener("blur", onBlur);
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 3. Select (<label> + <select> + <option>/<optgroup>) ---

function appendSelectOptions(selectEl, items, doc) {
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    if (typeof item.group === "string" && Array.isArray(item.options)) {
      const groupEl = doc.createElement("optgroup");
      groupEl.setAttribute("label", item.group);
      appendSelectOptions(groupEl, item.options, doc);
      selectEl.appendChild(groupEl);
    } else {
      const optEl = doc.createElement("option");
      const valStr = item.value == null ? "" : String(item.value);
      optEl.setAttribute("value", valStr);
      if (item.disabled) {
        optEl.setAttribute("disabled", "");
      }
      setSafeText(optEl, item.label == null ? valStr : item.label);
      selectEl.appendChild(optEl);
    }
  }
}

export function Select(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  const controlId = props.selectId || (config.id ? `${config.id}-select` : nextInteractiveId("grex-select"));
  const valueSignal = isReactive(props.value) ? props.value : signal(props.value == null ? "" : String(props.value));

  const selectEl = doc.createElement("select");
  selectEl.setAttribute("id", controlId);
  if (props.name != null) {
    selectEl.setAttribute("name", sanitizeAttributeValue("name", props.name));
  }
  if (props.required) {
    selectEl.setAttribute("required", "");
  }
  if (props.disabled) {
    selectEl.setAttribute("disabled", "");
  }
  if (props.bare && props.label != null) {
    selectEl.setAttribute("aria-label", String(props.label));
  }

  const disposers = [];
  const renderOpts = () => {
    while (selectEl.firstChild) {
      selectEl.removeChild(selectEl.firstChild);
    }
    const list = readVal(props.options) || [];
    appendSelectOptions(selectEl, list, doc);
    selectEl.value = String(valueSignal.peek() ?? "");
  };

  if (isReactive(props.options) || typeof props.options === "function") {
    disposers.push(effect(renderOpts));
  } else {
    renderOpts();
  }

  disposers.push(
    effect(() => {
      selectEl.value = String(valueSignal.get() ?? "");
    })
  );

  const onChange = (ev) => {
    const nextVal = ev && ev.target && typeof ev.target.value === "string" ? ev.target.value : selectEl.value;
    valueSignal.set(String(nextVal));
  };
  selectEl.addEventListener("change", onChange);

  const base = buildBaseSpec(props.bare ? "grex-select" : "grex-field", config);

  if (props.bare) {
    const bound = bindElement(selectEl, base);
    disposers.push(bound.dispose);
    return {
      element: selectEl,
      select: selectEl,
      value: valueSignal,
      dispose() {
        selectEl.removeEventListener("change", onChange);
        for (const fn of disposers) {
          fn();
        }
        disposers.length = 0;
      },
    };
  }

  const labelEl = doc.createElement("label");
  labelEl.setAttribute("for", controlId);
  const bound = bindElement(labelEl, base);
  disposers.push(bound.dispose);

  if (props.label != null) {
    const caption = doc.createElement("span");
    caption.setAttribute("class", "grex-label");
    setSafeText(caption, props.label);
    labelEl.appendChild(caption);
  }
  labelEl.appendChild(selectEl);

  return {
    element: labelEl,
    select: selectEl,
    value: valueSignal,
    dispose() {
      selectEl.removeEventListener("change", onChange);
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 4. Tabs (role="tablist", role="tab", role="tabpanel") ---

export function Tabs(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  const tabs = Array.isArray(props.tabs) ? props.tabs : [];
  if (tabs.length === 0) {
    throw new GrexSecurityError("Tabs requires at least one tab item.");
  }

  const activeId = isReactive(props.activeId) ? props.activeId : signal(props.activeId ?? tabs[0].id);
  const prefix = config.id || nextInteractiveId("grex-tabs");

  const sectionEl = doc.createElement("section");
  const disposers = [];
  const base = buildBaseSpec("grex-tabs", config);
  const bound = bindElement(sectionEl, base);
  disposers.push(bound.dispose);

  const tablistEl = doc.createElement("nav");
  tablistEl.setAttribute("role", "tablist");
  if (props.label != null) {
    tablistEl.setAttribute("aria-label", String(props.label));
  }
  sectionEl.appendChild(tablistEl);

  const tabButtons = [];
  const tabPanels = [];
  const clickHandlers = [];

  for (const tab of tabs) {
    const tabId = `${prefix}-tab-${tab.id}`;
    const panelId = `${prefix}-panel-${tab.id}`;

    const btn = doc.createElement("button");
    btn.setAttribute("type", "button");
    btn.setAttribute("role", "tab");
    btn.setAttribute("id", tabId);
    btn.setAttribute("aria-controls", panelId);
    setSafeText(btn, tab.label);
    const onClick = () => activeId.set(tab.id);
    btn.addEventListener("click", onClick);
    clickHandlers.push([btn, onClick]);
    tablistEl.appendChild(btn);
    tabButtons.push({ id: tab.id, el: btn });

    const panel = doc.createElement("section");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("id", panelId);
    panel.setAttribute("aria-labelledby", tabId);
    panel.setAttribute("tabindex", "0");
    if (tab.content !== undefined) {
      appendChildren(panel, Array.isArray(tab.content) ? tab.content : [tab.content], doc, disposers);
    }
    sectionEl.appendChild(panel);
    tabPanels.push({ id: tab.id, el: panel });
  }

  disposers.push(
    effect(() => {
      const current = activeId.get();
      for (const btnEntry of tabButtons) {
        const isActive = btnEntry.id === current;
        btnEntry.el.setAttribute("aria-selected", isActive ? "true" : "false");
        btnEntry.el.setAttribute("tabindex", isActive ? "0" : "-1");
      }
      for (const panelEntry of tabPanels) {
        if (panelEntry.id === current) {
          panelEntry.el.removeAttribute("hidden");
        } else {
          panelEntry.el.setAttribute("hidden", "");
        }
      }
    })
  );

  const onKeyDown = (event) => {
    const key = event && event.key;
    if (!key) {
      return;
    }
    const currentIndex = tabButtons.findIndex((b) => b.id === activeId.peek());
    const idx = currentIndex === -1 ? 0 : currentIndex;
    let nextIdx = null;

    if (key === "ArrowRight") {
      nextIdx = (idx + 1) % tabButtons.length;
    } else if (key === "ArrowLeft") {
      nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
    } else if (key === "Home") {
      nextIdx = 0;
    } else if (key === "End") {
      nextIdx = tabButtons.length - 1;
    }

    if (nextIdx !== null) {
      if (typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      const nextTab = tabButtons[nextIdx];
      activeId.set(nextTab.id);
      if (typeof nextTab.el.focus === "function") {
        nextTab.el.focus();
      }
    }
  };

  tablistEl.addEventListener("keydown", onKeyDown);

  return {
    element: sectionEl,
    activeId,
    dispose() {
      tablistEl.removeEventListener("keydown", onKeyDown);
      for (const [btn, fn] of clickHandlers) {
        btn.removeEventListener("click", fn);
      }
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 5. Accordion (<details> + <summary>) ---

export function Accordion(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  const items = Array.isArray(props.items) ? props.items : [];
  const singleOpen = props.singleOpen === true;
  const openIds = isReactive(props.openIds)
    ? props.openIds
    : signal(items.filter((i) => i.open).map((i) => i.id));

  const sectionEl = doc.createElement("section");
  const disposers = [];
  const base = buildBaseSpec("grex-accordion", config);
  const bound = bindElement(sectionEl, base);
  disposers.push(bound.dispose);

  const detailsEntries = [];
  const toggleListeners = [];

  for (const item of items) {
    const detailsEl = doc.createElement("details");
    if (item.open) {
      detailsEl.open = true;
    }
    const summaryEl = doc.createElement("summary");
    setSafeText(summaryEl, item.summary);
    detailsEl.appendChild(summaryEl);

    if (item.content !== undefined) {
      appendChildren(detailsEl, Array.isArray(item.content) ? item.content : [item.content], doc, disposers);
    }

    const onToggle = () => {
      if (singleOpen && detailsEl.open) {
        for (const other of detailsEntries) {
          if (other.el !== detailsEl && other.el.open) {
            other.el.open = false;
          }
        }
      }
      openIds.set(detailsEntries.filter((d) => d.el.open).map((d) => d.id));
    };

    detailsEl.addEventListener("toggle", onToggle);
    toggleListeners.push([detailsEl, onToggle]);
    detailsEntries.push({ id: item.id, el: detailsEl });
    sectionEl.appendChild(detailsEl);
  }

  return {
    element: sectionEl,
    openIds,
    dispose() {
      for (const [el, fn] of toggleListeners) {
        el.removeEventListener("toggle", fn);
      }
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 6. Modal (<dialog> with showModal(), focus trap, Escape, focus restore) ---

function getFocusableDescendants(container) {
  const nodes = container.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes);
}

export function Modal(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  const openSignal = isReactive(props.open) ? props.open : signal(Boolean(props.open));
  const titleId = config.id ? `${config.id}-title` : nextInteractiveId("grex-modal-title");

  const dialogEl = doc.createElement("dialog");
  const disposers = [];
  const base = buildBaseSpec("grex-modal", config);
  base.attrs["aria-modal"] = "true";
  if (props.title != null) {
    base.attrs["aria-labelledby"] = titleId;
  }
  const bound = bindElement(dialogEl, base);
  disposers.push(bound.dispose);

  if (props.title != null) {
    const headingEl = doc.createElement("h2");
    headingEl.setAttribute("id", titleId);
    setSafeText(headingEl, props.title);
    dialogEl.appendChild(headingEl);
  }

  appendChildren(dialogEl, config.children, doc, disposers);

  let previousActive = null;

  const closeAndRestore = () => {
    if (dialogEl.open && typeof dialogEl.close === "function") {
      dialogEl.close();
    } else {
      dialogEl.open = false;
    }
    if (previousActive && typeof previousActive.focus === "function") {
      previousActive.focus();
    }
    previousActive = null;
    if (typeof props.onClose === "function") {
      props.onClose();
    }
  };

  disposers.push(
    effect(() => {
      const shouldOpen = Boolean(openSignal.get());
      if (shouldOpen && !dialogEl.open) {
        previousActive = doc.activeElement || null;
        if (typeof dialogEl.showModal === "function") {
          dialogEl.showModal();
        } else {
          dialogEl.open = true;
        }
        const focusables = getFocusableDescendants(dialogEl);
        if (focusables.length > 0 && typeof focusables[0].focus === "function") {
          focusables[0].focus();
        } else if (typeof dialogEl.focus === "function") {
          dialogEl.focus();
        }
      } else if (!shouldOpen && dialogEl.open) {
        closeAndRestore();
      }
    })
  );

  const onCancel = (ev) => {
    if (ev && typeof ev.preventDefault === "function") {
      ev.preventDefault();
    }
    openSignal.set(false);
  };

  const onKeyDown = (ev) => {
    if (!ev) {
      return;
    }
    if (ev.key === "Escape") {
      if (typeof ev.preventDefault === "function") {
        ev.preventDefault();
      }
      openSignal.set(false);
      return;
    }
    if (ev.key === "Tab") {
      const focusables = getFocusableDescendants(dialogEl);
      if (focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (ev.shiftKey && doc.activeElement === first) {
        if (typeof ev.preventDefault === "function") {
          ev.preventDefault();
        }
        last.focus();
      } else if (!ev.shiftKey && doc.activeElement === last) {
        if (typeof ev.preventDefault === "function") {
          ev.preventDefault();
        }
        first.focus();
      }
    }
  };

  dialogEl.addEventListener("cancel", onCancel);
  dialogEl.addEventListener("keydown", onKeyDown);

  return {
    element: dialogEl,
    open: openSignal,
    dispose() {
      dialogEl.removeEventListener("cancel", onCancel);
      dialogEl.removeEventListener("keydown", onKeyDown);
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 7. Nav (<nav> + optional mobile toggle + <ul>/<li>/<a>) ---

export function Nav(config = {}, options = {}) {
  const doc = getDoc(options);
  const props = config.props || {};
  const items = Array.isArray(props.items) ? props.items : [];
  const activePath = isReactive(props.activePath) ? props.activePath : signal(props.activePath ?? "");
  const menuOpen = isReactive(props.open) ? props.open : signal(Boolean(props.open));
  const listId = config.id ? `${config.id}-list` : nextInteractiveId("grex-nav-list");

  const navEl = doc.createElement("nav");
  const disposers = [];
  const base = buildBaseSpec("grex-nav", config);
  if (props.label != null) {
    base.attrs["aria-label"] = String(props.label);
  }
  const bound = bindElement(navEl, base);
  disposers.push(bound.dispose);

  let toggleBtn = null;
  let onToggleClick = null;
  if (props.collapsible) {
    toggleBtn = doc.createElement("button");
    toggleBtn.setAttribute("type", "button");
    toggleBtn.setAttribute("class", "grex-nav-toggle");
    toggleBtn.setAttribute("aria-controls", listId);
    setSafeText(toggleBtn, props.toggleLabel || "Menu");
    onToggleClick = () => menuOpen.set(!menuOpen.peek());
    toggleBtn.addEventListener("click", onToggleClick);
    navEl.appendChild(toggleBtn);
  }

  const ulEl = doc.createElement("ul");
  ulEl.setAttribute("id", listId);
  navEl.appendChild(ulEl);

  if (toggleBtn) {
    disposers.push(
      effect(() => {
        const isOpen = Boolean(menuOpen.get());
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen) {
          ulEl.removeAttribute("hidden");
        } else {
          ulEl.setAttribute("hidden", "");
        }
      })
    );
  }

  const linkEntries = [];
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    if (!isSafeUrl(item.href)) {
      throw new GrexSecurityError(`Unsafe URL blocked in Nav item: "${String(item.href)}".`);
    }
    const liEl = doc.createElement("li");
    const aEl = doc.createElement("a");
    aEl.setAttribute("href", item.href);
    if (item.external || /^(https?:)?\/\//i.test(item.href)) {
      aEl.setAttribute("rel", "noopener noreferrer");
    }
    setSafeText(aEl, item.text);
    liEl.appendChild(aEl);
    ulEl.appendChild(liEl);
    linkEntries.push({ href: item.href, el: aEl });
  }

  disposers.push(
    effect(() => {
      const current = String(activePath.get() ?? "");
      for (const entry of linkEntries) {
        if (current !== "" && entry.href === current) {
          entry.el.setAttribute("aria-current", "page");
        } else {
          entry.el.removeAttribute("aria-current");
        }
      }
    })
  );

  return {
    element: navEl,
    activePath,
    open: menuOpen,
    dispose() {
      if (toggleBtn && onToggleClick) {
        toggleBtn.removeEventListener("click", onToggleClick);
      }
      for (const fn of disposers) {
        fn();
      }
      disposers.length = 0;
    },
  };
}

// --- 8. Keyed Repeater (ForEach) ---

function resolveRenderedChild(rendered, doc) {
  if (!rendered) {
    throw new Error("ForEach render() must return an element or { element, dispose }.");
  }
  if (typeof rendered === "object" && rendered.element) {
    return {
      element: rendered.element,
      dispose: typeof rendered.dispose === "function" ? rendered.dispose : () => {},
    };
  }
  if (typeof rendered === "object" && "type" in rendered) {
    return renderNode(rendered, { document: doc });
  }
  if (typeof rendered === "object" && "tag" in rendered) {
    return renderElement(rendered, { document: doc });
  }
  if (typeof rendered === "object" && rendered.nodeType) {
    return { element: rendered, dispose: () => {} };
  }
  throw new TypeError("Unsupported ForEach render() return value.");
}

export function ForEach(config = {}, options = {}) {
  const doc = getDoc(options);
  if (typeof config.key !== "function") {
    throw new TypeError("ForEach requires a key(item, index) function.");
  }
  if (typeof config.render !== "function") {
    throw new TypeError("ForEach requires a render(itemSignal, indexSignal) function.");
  }

  let parentEl;
  let parentDispose = () => {};
  if (config.parent && config.parent.nodeType === 1) {
    parentEl = config.parent;
  } else if (config.parent && typeof config.parent === "object") {
    const renderedParent = renderNode(config.parent, { document: doc });
    parentEl = renderedParent.element;
    parentDispose = renderedParent.dispose;
  } else {
    parentEl = doc.createElement("ul");
  }

  let keyedMap = new Map();
  let emptyHandle = null;

  const disposeEmpty = () => {
    if (emptyHandle) {
      if (emptyHandle.element && emptyHandle.element.parentNode === parentEl) {
        parentEl.removeChild(emptyHandle.element);
      }
      emptyHandle.dispose();
      emptyHandle = null;
    }
  };

  const stopEffect = effect(() => {
    const list = readVal(config.items) || [];
    if (!Array.isArray(list)) {
      throw new TypeError("ForEach items must resolve to an array.");
    }

    if (list.length === 0) {
      for (const entry of keyedMap.values()) {
        if (entry.element.parentNode === parentEl) {
          parentEl.removeChild(entry.element);
        }
        entry.dispose();
      }
      keyedMap.clear();

      if (typeof config.empty === "function" && !emptyHandle) {
        const emptyRes = resolveRenderedChild(config.empty(), doc);
        emptyHandle = emptyRes;
        parentEl.appendChild(emptyRes.element);
      }
      return;
    }

    disposeEmpty();

    const nextMap = new Map();
    const orderedEntries = [];

    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const itemKey = config.key(item, i);
      if (itemKey === undefined || itemKey === null || itemKey === "") {
        throw new Error(`ForEach key() returned invalid key at index ${i}.`);
      }
      if (nextMap.has(itemKey)) {
        throw new Error(`ForEach duplicate key "${String(itemKey)}" detected.`);
      }

      let entry = keyedMap.get(itemKey);
      if (entry) {
        entry.itemSignal.set(item);
        entry.indexSignal.set(i);
        keyedMap.delete(itemKey);
      } else {
        const itemSignal = signal(item);
        const indexSignal = signal(i);
        const rendered = resolveRenderedChild(config.render(itemSignal, indexSignal), doc);
        entry = {
          key: itemKey,
          itemSignal,
          indexSignal,
          element: rendered.element,
          dispose: rendered.dispose,
        };
      }
      nextMap.set(itemKey, entry);
      orderedEntries.push(entry);
    }

    // Dispose removed items cleanly
    for (const stale of keyedMap.values()) {
      if (stale.element.parentNode === parentEl) {
        parentEl.removeChild(stale.element);
      }
      stale.dispose();
    }

    // Reorder DOM nodes in place without recreating unchanged items
    let cursor = parentEl.firstChild;
    for (const entry of orderedEntries) {
      if (entry.element === cursor) {
        cursor = cursor.nextSibling;
      } else {
        parentEl.insertBefore(entry.element, cursor);
      }
    }

    keyedMap = nextMap;
  });

  return {
    element: parentEl,
    dispose() {
      stopEffect();
      disposeEmpty();
      for (const entry of keyedMap.values()) {
        entry.dispose();
      }
      keyedMap.clear();
      parentDispose();
    },
  };
}

// Register all 7 interactive components into ELEMENT_REGISTRY for renderNode()
registerElementType("Form", Form);
registerElementType("Input", Input);
registerElementType("Select", Select);
registerElementType("Tabs", Tabs);
registerElementType("Accordion", Accordion);
registerElementType("Modal", Modal);
registerElementType("Nav", Nav);

// --- data.js ---
/**
 * Grex JS v0.3 GRAB 1.0 grab.api.json Data Binding Client, Queries & Mutations (ADR-025b, ADR-025c, ADR-025f).
 * - Same-origin credentials default
 * - Bounded timeout (10s default, 60s max) & AbortController race-condition cancellation
 * - Mandatory CSRF token on unsafe mutations (POST/PUT/PATCH/DELETE)
 * - Exact base-10 GrabInteger/GrabDecimal string preservation
 */


const UNSAFE_HTTP_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const querySubscribers = new Map();

function subscribeQueryTag(tag, refetchFn) {
  if (!tag) {
    return () => {};
  }
  const key = String(tag);
  if (!querySubscribers.has(key)) {
    querySubscribers.set(key, new Set());
  }
  querySubscribers.get(key).add(refetchFn);
  return () => {
    const set = querySubscribers.get(key);
    if (set) {
      set.delete(refetchFn);
      if (set.size === 0) {
        querySubscribers.delete(key);
      }
    }
  };
}

/**
 * Invalidate and refetch all active queries subscribed to the given tag(s).
 * @param {string | string[]} tags
 */
export function invalidateQueries(tags) {
  const list = Array.isArray(tags) ? tags : [tags];
  const called = new Set();
  for (const tag of list) {
    const set = querySubscribers.get(String(tag));
    if (!set) {
      continue;
    }
    for (const refetchFn of Array.from(set)) {
      if (!called.has(refetchFn)) {
        called.add(refetchFn);
        refetchFn();
      }
    }
  }
}

/**
 * Connect an authorized use-sockets WebSocket or message target to invalidate queries.
 * Message format: { type: "invalidate", tags: ["products", ...] } or JSON string.
 *
 * @param {EventTarget} socketOrTarget
 * @param {{ allowedOrigins?: string[] }} [options]
 * @returns {() => void} dispose callback
 */
export function connectSocketInvalidation(socketOrTarget, options = {}) {
  if (!socketOrTarget || typeof socketOrTarget.addEventListener !== "function") {
    throw new TypeError("connectSocketInvalidation requires a WebSocket or EventTarget.");
  }
  const allowedOrigins = Array.isArray(options.allowedOrigins) ? new Set(options.allowedOrigins) : null;

  const onMessage = (event) => {
    if (allowedOrigins && (!event || !allowedOrigins.has(event.origin))) {
      return;
    }
    let payload = event && event.data;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        return;
      }
    }
    if (payload && typeof payload === "object" && payload.type === "invalidate" && payload.tags) {
      invalidateQueries(payload.tags);
    }
  };

  socketOrTarget.addEventListener("message", onMessage);
  return () => {
    socketOrTarget.removeEventListener("message", onMessage);
  };
}

function resolveContractEndpoint(contract, method, routePath) {
  if (!contract || typeof contract !== "object") {
    return;
  }
  const routes = contract.routes || contract.endpoints;
  if (!Array.isArray(routes)) {
    return;
  }
  const cleanMethod = method.toUpperCase();
  const found = routes.some(
    (r) => String(r.method || "GET").toUpperCase() === cleanMethod && r.path === routePath
  );
  if (!found) {
    throw new GrexSecurityError(`Endpoint ${cleanMethod} ${routePath} is not declared in grab.api.json contract.`);
  }
}

function buildRequestUrl(baseUrl, reqPath, query) {
  const base = baseUrl ? baseUrl.replace(/\/+$/, "") : "";
  const pathPart = reqPath.startsWith("/") ? reqPath : `/${reqPath}`;
  const fullPath = `${base}${pathPart}`;
  if (!isSafeUrl(fullPath)) {
    throw new GrexSecurityError(`Unsafe request URL blocked: "${fullPath}".`);
  }
  if (!query || typeof query !== "object") {
    return fullPath;
  }
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) {
      search.set(k, String(v));
    }
  }
  const qs = search.toString();
  return qs ? `${fullPath}?${qs}` : fullPath;
}

/**
 * Create a GRAB 1.0 grab.api.json typed fetch client.
 *
 * @param {{
 *   baseUrl?: string,
 *   contract?: object,
 *   credentials?: RequestCredentials,
 *   timeoutMs?: number,
 *   csrfToken?: string | (() => string) | { get(): string },
 *   csrfHeader?: string,
 *   fetch?: typeof globalThis.fetch
 * }} [options]
 */
export function createGrabClient(options = {}) {
  const baseUrl = options.baseUrl || "";
  const contract = options.contract || null;
  const credentials = options.credentials || "same-origin";
  const timeoutMs = options.timeoutMs === undefined ? 10000 : Number(options.timeoutMs);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) {
    throw new RangeError("createGrabClient timeoutMs must be between 1 and 60000 ms.");
  }

  const csrfHeader = options.csrfHeader || "X-CSRF-Token";
  const fetchImpl = options.fetch || globalThis.fetch;

  const resolveCsrf = (callToken) => {
    if (callToken !== undefined) {
      return typeof callToken === "function" ? callToken() : callToken;
    }
    if (options.csrfToken && typeof options.csrfToken === "object" && typeof options.csrfToken.get === "function") {
      return options.csrfToken.get();
    }
    if (typeof options.csrfToken === "function") {
      return options.csrfToken();
    }
    return options.csrfToken;
  };

  async function request(req) {
    if (typeof fetchImpl !== "function") {
      throw new Error("createGrabClient requires fetch() implementation.");
    }
    const method = String(req.method || "GET").toUpperCase();
    const pathStr = String(req.path || "");
    resolveContractEndpoint(contract, method, pathStr);

    const url = buildRequestUrl(baseUrl, pathStr, req.query);
    const headers = {
      Accept: "application/json",
      ...(req.headers || {}),
    };

    if (UNSAFE_HTTP_METHODS.has(method)) {
      const token = resolveCsrf(req.csrfToken);
      if (!token || String(token).trim() === "") {
        throw new GrexSecurityError(`Unsafe ${method} request to "${pathStr}" requires an explicit CSRF token.`);
      }
      headers[csrfHeader] = String(token);
    }

    let bodyPayload;
    if (req.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyPayload = JSON.stringify(req.body);
    }

    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(new Error("GRAB request timeout exceeded.")), timeoutMs);

    const onExternalAbort = () => timeoutController.abort(req.signal.reason);
    if (req.signal) {
      if (req.signal.aborted) {
        clearTimeout(timer);
        throw req.signal.reason || new DOMException("Aborted", "AbortError");
      }
      req.signal.addEventListener("abort", onExternalAbort, { once: true });
    }

    try {
      const res = await fetchImpl(url, {
        method,
        credentials,
        headers,
        body: bodyPayload,
        signal: timeoutController.signal,
      });

      const rawText = await res.text();
      const parsed = rawText ? JSON.parse(rawText) : null;
      if (!res.ok) {
        const msg = parsed && parsed.error ? parsed.error : `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.payload = parsed;
        throw err;
      }
      return parsed;
    } finally {
      clearTimeout(timer);
      if (req.signal) {
        req.signal.removeEventListener("abort", onExternalAbort);
      }
    }
  }

  return {
    request,
    get: (pathStr, opts = {}) => request({ ...opts, method: "GET", path: pathStr }),
    post: (pathStr, body, opts = {}) => request({ ...opts, method: "POST", path: pathStr, body }),
    put: (pathStr, body, opts = {}) => request({ ...opts, method: "PUT", path: pathStr, body }),
    patch: (pathStr, body, opts = {}) => request({ ...opts, method: "PATCH", path: pathStr, body }),
    delete: (pathStr, opts = {}) => request({ ...opts, method: "DELETE", path: pathStr }),
  };
}

/**
 * Reactive query bound to a GRAB client endpoint with automatic AbortController
 * race-condition cancellation and tag-based cache invalidation.
 *
 * @param {ReturnType<typeof createGrabClient>} client
 * @param {string | (() => { method?: string, path: string, query?: object })} endpointOrFn
 * @param {{ tags?: string[], initialData?: unknown, enabled?: boolean | { get(): boolean } }} [options]
 */
export function useQuery(client, endpointOrFn, options = {}) {
  const data = signal(options.initialData !== undefined ? options.initialData : null);
  const loading = signal(false);
  const error = signal(null);

  let activeController = null;
  let seq = 0;
  let disposed = false;

  const execute = (spec) => {
    if (disposed) {
      return Promise.resolve(null);
    }
    if (activeController) {
      activeController.abort(new Error("Superseded by newer query."));
    }
    const controller = new AbortController();
    activeController = controller;
    const mySeq = ++seq;

    loading.set(true);
    error.set(null);

    const reqSpec = typeof spec === "string" ? { method: "GET", path: spec } : spec;
    return client
      .request({ ...reqSpec, signal: controller.signal })
      .then((res) => {
        if (!disposed && mySeq === seq && !controller.signal.aborted) {
          data.set(res);
          loading.set(false);
        }
        return res;
      })
      .catch((err) => {
        if (!disposed && mySeq === seq && !controller.signal.aborted) {
          error.set(err && err.message ? err.message : String(err));
          loading.set(false);
        }
        return null;
      });
  };

  let lastSpec = null;
  const stopEffect = effect(() => {
    const enabled =
      options.enabled === undefined
        ? true
        : typeof options.enabled === "object" && typeof options.enabled.get === "function"
          ? Boolean(options.enabled.get())
          : Boolean(options.enabled);

    const spec = typeof endpointOrFn === "function" ? endpointOrFn() : endpointOrFn;
    lastSpec = spec;
    if (enabled && spec) {
      execute(spec);
    }
  });

  const unsubTags = [];
  if (Array.isArray(options.tags)) {
    for (const tag of options.tags) {
      unsubTags.push(subscribeQueryTag(tag, () => lastSpec && execute(lastSpec)));
    }
  }

  return {
    data,
    loading,
    error,
    refetch() {
      return lastSpec ? execute(lastSpec) : Promise.resolve(null);
    },
    dispose() {
      disposed = true;
      if (activeController) {
        activeController.abort(new Error("Query disposed."));
        activeController = null;
      }
      stopEffect();
      for (const unsub of unsubTags) {
        unsub();
      }
      unsubTags.length = 0;
    },
  };
}

/**
 * Reactive mutation bound to a GRAB client endpoint with CSRF enforcement and
 * automatic query tag invalidation on success.
 *
 * @param {ReturnType<typeof createGrabClient>} client
 * @param {string} endpoint
 * @param {{ method?: string, invalidates?: string[] }} [options]
 */
export function useMutation(client, endpoint, options = {}) {
  const data = signal(null);
  const loading = signal(false);
  const error = signal(null);
  const method = String(options.method || "POST").toUpperCase();

  let activeController = null;
  let disposed = false;

  async function mutate(body, callOpts = {}) {
    if (disposed) {
      return null;
    }
    if (activeController) {
      activeController.abort(new Error("Superseded by newer mutation."));
    }
    const controller = new AbortController();
    activeController = controller;

    loading.set(true);
    error.set(null);

    try {
      const result = await client.request({
        method,
        path: endpoint,
        body,
        csrfToken: callOpts.csrfToken,
        signal: controller.signal,
      });
      if (!disposed) {
        data.set(result);
        loading.set(false);
        if (Array.isArray(options.invalidates)) {
          invalidateQueries(options.invalidates);
        }
      }
      return result;
    } catch (err) {
      if (!disposed) {
        error.set(err && err.message ? err.message : String(err));
        loading.set(false);
      }
      throw err;
    }
  }

  return {
    mutate,
    data,
    loading,
    error,
    reset() {
      data.set(null);
      error.set(null);
      loading.set(false);
    },
    dispose() {
      disposed = true;
      if (activeController) {
        activeController.abort(new Error("Mutation disposed."));
        activeController = null;
      }
    },
  };
}

// --- theme.js ---
/**
 * Grex JS v0.4 / v1.0.0 Global Theme & Reusable Class Manager.
 * Compiles deterministic CSS to /static/grex/ (--read-only Docker + server.asset compatible)
 * and supports instant browser-memory --grex-* token updates.
 */


const DEFAULT_FOCUS_RING = "2px solid #0284c7";

function flattenThemeTokens(spec = {}) {
  const out = {};
  const categories = ["tokens", "colors", "typography", "spacing", "radii", "shadows"];
  for (const cat of categories) {
    const group = spec[cat];
    if (group && typeof group === "object") {
      for (const [k, v] of Object.entries(group)) {
        out[normalizeTokenName(k)] = validateTokenValue(v);
      }
    }
  }
  if (spec.focusRing !== undefined) {
    out["--grex-focus-ring"] = validateTokenValue(spec.focusRing);
  }
  return out;
}

function formatThemeBlock(selector, tokenMap, indent = "  ") {
  const entries = Object.entries(tokenMap);
  if (entries.length === 0) {
    return "";
  }
  const lines = entries.map(([k, v]) => `${indent}${k}: ${v};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * Create a global theme manager with light/dark --grex-* tokens and built-in
 * :focus-visible keyboard focus-ring guardrails.
 *
 * @param {{
 *   colors?: Record<string, string>,
 *   typography?: Record<string, string>,
 *   spacing?: Record<string, string>,
 *   radii?: Record<string, string>,
 *   shadows?: Record<string, string>,
 *   tokens?: Record<string, string>,
 *   focusRing?: string,
 *   modes?: Record<string, Record<string, unknown>>,
 *   prefersColorScheme?: boolean
 * }} [config]
 */
export function createTheme(config = {}) {
  const baseTokens = flattenThemeTokens(config);
  if (!("--grex-focus-ring" in baseTokens)) {
    baseTokens["--grex-focus-ring"] = DEFAULT_FOCUS_RING;
  }

  const modeTokens = {};
  if (config.modes && typeof config.modes === "object") {
    for (const [modeName, modeSpec] of Object.entries(config.modes)) {
      if (!/^[a-z0-9_-]+$/i.test(modeName)) {
        throw new GrexSecurityError(`Invalid theme mode name "${modeName}".`);
      }
      const flat =
        modeSpec &&
        typeof modeSpec === "object" &&
        ("colors" in modeSpec || "tokens" in modeSpec || "spacing" in modeSpec)
          ? flattenThemeTokens(modeSpec)
          : flattenThemeTokens({ tokens: modeSpec });
      modeTokens[modeName.toLowerCase()] = flat;
    }
  }

  const prefersColorScheme = Boolean(config.prefersColorScheme);

  function compileCss() {
    const chunks = [];
    const rootBlock = formatThemeBlock(":root", baseTokens);
    if (rootBlock) {
      chunks.push(rootBlock);
    }

    for (const [modeName, tokens] of Object.entries(modeTokens)) {
      const modeBlock = formatThemeBlock(`[data-grex-theme="${modeName}"]`, tokens);
      if (modeBlock) {
        chunks.push(modeBlock);
      }
      if (prefersColorScheme && modeName === "dark") {
        const inner = formatThemeBlock("  :root", tokens, "    ");
        if (inner) {
          chunks.push(`@media (prefers-color-scheme: dark) {\n${inner}\n}`);
        }
      }
    }

    chunks.push(
      `:focus-visible {\n  outline: var(--grex-focus-ring, ${DEFAULT_FOCUS_RING});\n  outline-offset: 2px;\n}`
    );

    return chunks.join("\n\n") + "\n";
  }

  function applyTo(element, mode = null) {
    if (!element || !element.style) {
      throw new TypeError("theme.applyTo(element, mode?) requires a DOM element with .style.");
    }
    applyTokens(element, baseTokens);
    if (mode && modeTokens[String(mode).toLowerCase()]) {
      const cleanMode = String(mode).toLowerCase();
      if (typeof element.setAttribute === "function") {
        element.setAttribute("data-grex-theme", cleanMode);
      }
      applyTokens(element, modeTokens[cleanMode]);
    } else if (mode === null && typeof element.removeAttribute === "function") {
      element.removeAttribute("data-grex-theme");
    }
  }

  return {
    baseTokens: Object.freeze({ ...baseTokens }),
    modeTokens: Object.freeze({ ...modeTokens }),
    compileCss,
    applyTo,
  };
}

function normalizeClassStylesInput(styles) {
  if (!styles || typeof styles !== "object") {
    throw new TypeError("registerClass(name, styles) requires a styles object.");
  }
  const hasBreakpoints = "base" in styles || "tablet" in styles || "mobile" in styles;
  const normalized = {};
  const source = hasBreakpoints ? styles : { base: styles };

  for (const [bp, propMap] of Object.entries(source)) {
    if (!propMap || typeof propMap !== "object") {
      continue;
    }
    const cleanMap = {};
    for (const [prop, val] of Object.entries(propMap)) {
      const cleanProp = normalizeStyleProperty(prop);
      const cleanVal = validateTokenValue(val);
      cleanMap[cleanProp] = cleanVal;
    }
    normalized[bp] = cleanMap;
  }
  return normalized;
}

/**
 * Create a reusable Bricks-style CSS class manager compiling deterministically
 * across base, tablet, and mobile breakpoints for /static/grex/.
 */
export function createClassManager(options = {}) {
  const prefix = options.prefix || "grex-c-";
  const classes = new Map();

  function assertValidClassName(name) {
    if (typeof name !== "string" || !/^[a-z][a-z0-9_-]*$/i.test(name.trim())) {
      throw new GrexSecurityError(`Invalid class name "${String(name)}".`);
    }
    return name.trim();
  }

  function registerClass(name, styles) {
    const clean = assertValidClassName(name);
    const normalized = normalizeClassStylesInput(styles);
    classes.set(clean, normalized);
    return `${prefix}${clean}`;
  }

  function getClassName(name) {
    const clean = assertValidClassName(name);
    if (!classes.has(clean)) {
      throw new Error(`Unregistered Grex class "${clean}".`);
    }
    return `${prefix}${clean}`;
  }

  function hasClass(name) {
    return typeof name === "string" && classes.has(name.trim());
  }

  function unregisterClass(name) {
    return typeof name === "string" ? classes.delete(name.trim()) : false;
  }

  function listClasses() {
    return Array.from(classes.keys());
  }

  function compileCss(compileOpts = {}) {
    const breakpoints = { ...DEFAULT_BREAKPOINTS, ...(compileOpts.breakpoints || {}) };
    const chunks = [];
    const mediaBuckets = new Map();

    for (const [name, deviceMap] of classes.entries()) {
      const selector = `.${prefix}${name}`;
      for (const [bp, propMap] of Object.entries(deviceMap)) {
        if (!(bp in breakpoints)) {
          throw new GrexSecurityError(`Unknown breakpoint "${bp}" in class "${name}".`);
        }
        const entries = Object.entries(propMap);
        if (entries.length === 0) {
          continue;
        }
        const decls = entries.map(([k, v]) => `  ${k}: ${v};`);
        const query = breakpoints[bp];
        if (!query) {
          chunks.push(`${selector} {\n${decls.join("\n")}\n}`);
        } else {
          if (!mediaBuckets.has(query)) {
            mediaBuckets.set(query, []);
          }
          const indented = decls.map((line) => `  ${line}`);
          mediaBuckets.get(query).push(`  ${selector} {\n${indented.join("\n")}\n  }`);
        }
      }
    }

    for (const [query, rules] of mediaBuckets.entries()) {
      chunks.push(`@media ${query} {\n${rules.join("\n")}\n}`);
    }

    return chunks.join("\n\n") + (chunks.length > 0 ? "\n" : "");
  }

  return {
    registerClass,
    getClassName,
    hasClass,
    unregisterClass,
    listClasses,
    compileCss,
  };
}

// --- a11y.js ---
/**
 * Grex JS v0.4 / v1.0.0 Built-In Accessibility Audit & WCAG AA Guardrails.
 * Zero external dependencies. Validates contrast ratios, Image alt text,
 * form <label> associations, heading hierarchy, and focus indicators.
 */

/**
 * Parse a hex (#RGB, #RRGGBB) or rgb()/rgba() color into { r, g, b } (0..255).
 * Returns null for CSS variables or unsupported strings.
 * @param {unknown} color
 * @returns {{ r: number, g: number, b: number } | null}
 */
export function parseCssColor(color) {
  if (typeof color !== "string") {
    return null;
  }
  const s = color.trim();
  const hex3 = /^#([0-9a-f]{3})$/i.exec(s);
  if (hex3) {
    const [r, g, b] = hex3[1].split("").map((ch) => Number.parseInt(ch + ch, 16));
    return { r, g, b };
  }
  const hex6 = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex6) {
    const h = hex6[1];
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
    };
  }
  const rgbMatch = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(s);
  if (rgbMatch) {
    const r = Math.min(255, Number(rgbMatch[1]));
    const g = Math.min(255, Number(rgbMatch[2]));
    const b = Math.min(255, Number(rgbMatch[3]));
    return { r, g, b };
  }
  return null;
}

function linearizeChannel(val255) {
  const c = val255 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ r, g, b }) {
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

/**
 * Compute WCAG 2.1 contrast ratio between two CSS colors (returns 1..21, or null if unparseable).
 * @param {string} fgColor
 * @param {string} bgColor
 * @returns {number | null}
 */
export function computeContrastRatio(fgColor, bgColor) {
  const fg = parseCssColor(fgColor);
  const bg = parseCssColor(bgColor);
  if (!fg || !bg) {
    return null;
  }
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function isLargeTextStyle(baseStyle = {}) {
  const sizeMatch = /^(\d+(?:\.\d+)?)px$/i.exec(String(baseStyle.fontSize || baseStyle["font-size"] || ""));
  if (!sizeMatch) {
    return false;
  }
  const px = Number(sizeMatch[1]);
  const weight = baseStyle.fontWeight || baseStyle["font-weight"];
  const isBold = weight === "bold" || Number(weight) >= 700;
  return px >= 24 || (isBold && px >= 18.66);
}

function getTreeNodeText(node) {
  if (!node || typeof node !== "object") {
    return "";
  }
  const props = node.props || {};
  if (typeof props.text === "string") {
    return props.text;
  }
  if (typeof node.text === "string") {
    return node.text;
  }
  if (typeof props.label === "string") {
    return props.label;
  }
  if (node.attrs && typeof node.attrs["aria-label"] === "string") {
    return node.attrs["aria-label"];
  }
  if (Array.isArray(node.children)) {
    return node.children
      .map((c) => (typeof c === "string" ? c : getTreeNodeText(c)))
      .join("")
      .trim();
  }
  return "";
}

/**
 * Audit a declarative GrexElementNode JSON tree for WCAG AA contrast,
 * Image alt text, form labels, heading hierarchy, and focus indicators.
 *
 * @param {object | Array<object>} tree
 * @param {{ defaultBg?: string }} [options]
 * @returns {{ ok: boolean, issues: Array<{ severity: "error" | "warning", code: string, nodeId?: string, message: string }> }}
 */
export function auditAccessibility(tree, options = {}) {
  const issues = [];
  const list = Array.isArray(tree) ? tree : [tree];
  let lastHeadingLevel = 0;
  let h1Count = 0;

  const visit = (node, inheritedBg) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const nodeId = typeof node.id === "string" ? node.id : undefined;
    const props = node.props || {};
    const attrs = node.attrs || {};
    const baseStyle = (node.styles && (node.styles.base || node.styles)) || {};

    const bgColor = baseStyle.backgroundColor || baseStyle["background-color"] || baseStyle.background || inheritedBg;
    const fgColor = baseStyle.color;

    if (fgColor && bgColor) {
      const ratio = computeContrastRatio(fgColor, bgColor);
      if (ratio !== null) {
        const minRatio = isLargeTextStyle(baseStyle) ? 3.0 : 4.5;
        if (ratio < minRatio) {
          issues.push({
            severity: "error",
            code: "GREX-A11Y-001",
            nodeId,
            message: `Contrast ratio ${ratio}:1 (${fgColor} on ${bgColor}) is below WCAG AA minimum ${minRatio}:1.`,
          });
        }
      }
    }

    if (baseStyle.outline === "none" || baseStyle.outline === 0 || baseStyle.outline === "0") {
      issues.push({
        severity: "error",
        code: "GREX-A11Y-005",
        nodeId,
        message: "Removing focus outline without a replacement focus indicator violates keyboard accessibility.",
      });
    }

    if (node.type === "Image") {
      const hasAlt = typeof props.alt === "string" && props.alt.trim() !== "";
      if (!hasAlt && props.decorative !== true) {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-002",
          nodeId,
          message: "Image must provide descriptive alt text or set decorative: true.",
        });
      }
    }

    if (node.type === "Input" || node.type === "Select") {
      const isHidden = String(props.type || "").toLowerCase() === "hidden";
      const hasLabel =
        (typeof props.label === "string" && props.label.trim() !== "") ||
        (typeof attrs["aria-label"] === "string" && attrs["aria-label"].trim() !== "") ||
        (typeof attrs["aria-labelledby"] === "string" && attrs["aria-labelledby"].trim() !== "");
      if (!isHidden && !hasLabel) {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-003",
          nodeId,
          message: `${node.type} must provide a label, aria-label, or aria-labelledby.`,
        });
      }
    }

    if (node.type === "Heading") {
      const level = props.level === undefined ? 2 : Number(props.level);
      if (level === 1) {
        h1Count += 1;
        if (h1Count > 1) {
          issues.push({
            severity: "warning",
            code: "GREX-A11Y-004",
            nodeId,
            message: "Multiple <h1> headings detected; prefer a single primary <h1> per page.",
          });
        }
      }
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-004",
          nodeId,
          message: `Skipped heading level from <h${lastHeadingLevel}> to <h${level}>.`,
        });
      }
      if (level >= 1 && level <= 6) {
        lastHeadingLevel = level;
      }
    }

    if (node.type === "Button" || node.type === "Link") {
      const accessibleName = getTreeNodeText(node);
      if (accessibleName === "") {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-005",
          nodeId,
          message: `${node.type} must have visible text or an aria-label.`,
        });
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child, bgColor);
      }
    }
    if (Array.isArray(props.tabs)) {
      for (const tab of props.tabs) {
        if (tab && tab.content) {
          const contentArr = Array.isArray(tab.content) ? tab.content : [tab.content];
          contentArr.forEach((c) => visit(c, bgColor));
        }
      }
    }
    if (Array.isArray(props.items)) {
      for (const item of props.items) {
        if (item && item.content) {
          const contentArr = Array.isArray(item.content) ? item.content : [item.content];
          contentArr.forEach((c) => visit(c, bgColor));
        }
      }
    }
  };

  for (const rootNode of list) {
    visit(rootNode, options.defaultBg || null);
  }

  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
  };
}

function hasWrappingLabel(el) {
  let curr = el.parentNode;
  while (curr) {
    if (curr.localName === "label") {
      return true;
    }
    curr = curr.parentNode;
  }
  return false;
}

/**
 * Audit a rendered DOM tree for accessibility compliance (alt text, form labels,
 * heading hierarchy, and interactive accessible names).
 *
 * @param {Document | Element} root
 * @returns {{ ok: boolean, issues: Array<{ severity: "error" | "warning", code: string, nodeId?: string, message: string }> }}
 */
export function auditDom(root) {
  if (!root || typeof root.querySelectorAll !== "function") {
    throw new TypeError("auditDom(root) requires a DOM Document or Element.");
  }

  const issues = [];
  const allNodes = Array.from(root.querySelectorAll("*"));
  let lastHeadingLevel = 0;
  let h1Count = 0;

  for (const el of allNodes) {
    const tag = el.localName || (el.tagName && el.tagName.toLowerCase()) || "";
    const nodeId = el.getAttribute("data-grex-id") || el.getAttribute("id") || undefined;

    if (tag === "img") {
      const alt = el.getAttribute("alt");
      const hidden = el.getAttribute("aria-hidden") === "true";
      if ((alt === null || alt.trim() === "") && !hidden) {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-002",
          nodeId,
          message: "<img> element must have descriptive alt text or aria-hidden=\"true\".",
        });
      }
    }

    if (tag === "input" || tag === "select" || tag === "textarea") {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      if (type !== "hidden") {
        const id = el.getAttribute("id");
        const hasForLabel = id ? Boolean(root.querySelector(`label[for="${id}"]`)) : false;
        const hasAria =
          Boolean(el.getAttribute("aria-label")) || Boolean(el.getAttribute("aria-labelledby"));
        if (!hasForLabel && !hasWrappingLabel(el) && !hasAria) {
          issues.push({
            severity: "error",
            code: "GREX-A11Y-003",
            nodeId,
            message: `<${tag}> element is missing an associated <label> or aria-label.`,
          });
        }
      }
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag.slice(1));
      if (level === 1) {
        h1Count += 1;
        if (h1Count > 1) {
          issues.push({
            severity: "warning",
            code: "GREX-A11Y-004",
            nodeId,
            message: "Multiple <h1> headings detected in DOM.",
          });
        }
      }
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-004",
          nodeId,
          message: `Skipped heading level from <h${lastHeadingLevel}> to <h${level}>.`,
        });
      }
      lastHeadingLevel = level;
    }

    if (tag === "button" || tag === "a") {
      const text = (el.textContent || "").trim();
      const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
      const labelledChild = el.querySelector("[aria-label], img[alt]");
      if (!text && !ariaLabel && !labelledChild) {
        issues.push({
          severity: "error",
          code: "GREX-A11Y-005",
          nodeId,
          message: `<${tag}> element has no accessible name.`,
        });
      }
    }
  }

  return {
    ok: issues.every((i) => i.severity !== "error"),
    issues,
  };
}

// --- catalog.js ---
/**
 * Grex JS v0.4 / v1.0.0 Machine-Readable Element Catalog (grex.elements.json) & Validator.
 * Enables Grex Builder, GrabLab CMS, and Groxy AI (grab mcp + GRAB-DESIGN-SYSTEM.md)
 * to compose validated pages with zero hallucinated props or wrapper <div>s.
 */


const SUPPORTED_STYLE_LIST = Object.freeze(
  Array.from(new Set(Object.values(ALLOWED_STYLE_PROPERTIES)))
);

const CATALOG_ELEMENTS = Object.freeze({
  Section: {
    name: "Section",
    category: "layout",
    defaultTag: "section",
    allowedTags: ["section", "header", "footer", "main", "aside"],
    acceptsChildren: true,
    props: {
      label: { type: "string", required: false },
      labelledBy: { type: "string", required: false },
    },
    a11yDefaults: { landmark: true },
    securityRules: ["no-wrapper-div", "csp-safe"],
  },
  Container: {
    name: "Container",
    category: "layout",
    defaultTag: "section",
    allowedTags: ["section", "article", "main", "header", "footer"],
    acceptsChildren: true,
    props: {
      maxWidth: { type: "string", required: false },
      label: { type: "string", required: false },
      labelledBy: { type: "string", required: false },
    },
    a11yDefaults: { singleNodeMaxWidth: true },
    securityRules: ["no-wrapper-div"],
  },
  Grid: {
    name: "Grid",
    category: "layout",
    defaultTag: "section",
    allowedTags: ["section", "ul", "ol", "article", "nav"],
    acceptsChildren: true,
    props: {
      columns: { type: "string", required: false },
      gap: { type: "string", required: false },
      align: { type: "string", required: false },
      justify: { type: "string", required: false },
      label: { type: "string", required: false },
    },
    a11yDefaults: { cssGridOnRoot: true },
    securityRules: ["no-wrapper-div"],
  },
  Stack: {
    name: "Stack",
    category: "layout",
    defaultTag: "section",
    allowedTags: ["section", "header", "nav", "footer", "ul", "ol", "article"],
    acceptsChildren: true,
    props: {
      direction: { type: "string", enum: ["column", "row"], default: "column" },
      wrap: { type: "string", required: false },
      gap: { type: "string", required: false },
      align: { type: "string", required: false },
      justify: { type: "string", required: false },
      label: { type: "string", required: false },
    },
    a11yDefaults: { flexOnRoot: true },
    securityRules: ["no-wrapper-div"],
  },
  Card: {
    name: "Card",
    category: "layout",
    defaultTag: "article",
    allowedTags: ["article", "section", "aside"],
    acceptsChildren: true,
    props: {
      elevated: { type: "boolean", default: false },
      label: { type: "string", required: false },
    },
    a11yDefaults: { semanticArticle: true },
    securityRules: ["no-wrapper-div"],
  },
  Heading: {
    name: "Heading",
    category: "typography",
    defaultTag: "h2",
    allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6"],
    acceptsChildren: false,
    props: {
      level: { type: "integer", min: 1, max: 6, default: 2 },
      text: { type: "string", required: true },
    },
    a11yDefaults: { validHeadingLevel: true },
    securityRules: ["textContent-only"],
  },
  Text: {
    name: "Text",
    category: "typography",
    defaultTag: "p",
    allowedTags: ["p", "span", "small", "strong", "em", "blockquote", "time", "code"],
    acceptsChildren: false,
    props: {
      text: { type: "string", required: true },
      dateTime: { type: "string", required: false },
    },
    a11yDefaults: { preserveExactGrabDecimalString: true },
    securityRules: ["textContent-only", "no-float-coercion"],
  },
  RichText: {
    name: "RichText",
    category: "typography",
    defaultTag: "p",
    allowedTags: ["p", "article", "section", "span"],
    acceptsChildren: false,
    props: {
      nodes: { type: "array", required: false },
      html: { type: "string", required: false },
      text: { type: "string", required: false },
    },
    a11yDefaults: { safeExternalLinks: true },
    securityRules: ["zero-innerHTML", "inline-tag-allowlist"],
  },
  Link: {
    name: "Link",
    category: "action",
    defaultTag: "a",
    allowedTags: ["a"],
    acceptsChildren: true,
    props: {
      href: { type: "url", required: true },
      text: { type: "string", required: false },
      target: { type: "string", required: false },
      rel: { type: "string", required: false },
      external: { type: "boolean", default: false },
      label: { type: "string", required: false },
    },
    a11yDefaults: { relNoopenerOnExternal: true },
    securityRules: ["url-protocol-check"],
  },
  Button: {
    name: "Button",
    category: "action",
    defaultTag: "button",
    allowedTags: ["button"],
    acceptsChildren: false,
    props: {
      text: { type: "string", required: false },
      type: { type: "string", enum: ["button", "submit", "reset"], default: "button" },
      disabled: { type: "boolean", default: false },
      pressed: { type: "boolean", required: false },
      expanded: { type: "boolean", required: false },
      label: { type: "string", required: false },
      onClick: { type: "function", required: false },
    },
    a11yDefaults: { safeDefaultTypeButton: true },
    securityRules: ["addEventListener-only", "no-inline-onclick"],
  },
  Image: {
    name: "Image",
    category: "media",
    defaultTag: "img",
    allowedTags: ["img"],
    acceptsChildren: false,
    props: {
      src: { type: "url", required: true },
      alt: { type: "string", required: false },
      decorative: { type: "boolean", default: false },
      width: { type: "number|string", required: false },
      height: { type: "number|string", required: false },
      srcset: { type: "string", required: false },
      sizes: { type: "string", required: false },
      loading: { type: "string", enum: ["lazy", "eager"], default: "lazy" },
      decoding: { type: "string", enum: ["async", "sync", "auto"], default: "async" },
    },
    a11yDefaults: { requireAltOrDecorative: true, clsDimensionsRecommended: true },
    securityRules: ["url-protocol-check", "srcset-url-check"],
  },
  Icon: {
    name: "Icon",
    category: "media",
    defaultTag: "svg",
    allowedTags: ["svg"],
    acceptsChildren: false,
    props: {
      viewBox: { type: "string", default: "0 0 24 24" },
      size: { type: "number|string", default: "24" },
      fill: { type: "string", default: "none" },
      paths: { type: "array", required: false },
      symbolId: { type: "string", required: false },
      label: { type: "string", required: false },
      decorative: { type: "boolean", default: true },
    },
    a11yDefaults: { ariaHiddenWhenDecorative: true, roleImgWithLabel: true },
    securityRules: ["zero-innerHTML", "svg-createElementNS-allowlist"],
  },
  Form: {
    name: "Form",
    category: "interactive",
    defaultTag: "form",
    allowedTags: ["form"],
    acceptsChildren: true,
    props: {
      action: { type: "url", required: false },
      method: { type: "string", enum: ["post", "get"], default: "post" },
      csrfToken: { type: "string|signal", required: false },
      csrfHeader: { type: "string", default: "X-CSRF-Token" },
      csrfField: { type: "string", required: false },
      requireCsrf: { type: "boolean", default: true },
      onSubmit: { type: "function", required: false },
    },
    a11yDefaults: { ariaBusyOnSubmit: true, doubleSubmitGuard: true },
    securityRules: ["url-protocol-check", "csrf-enforcement"],
  },
  Input: {
    name: "Input",
    category: "interactive",
    defaultTag: "label",
    allowedTags: ["label", "input", "textarea"],
    acceptsChildren: false,
    props: {
      name: { type: "string", required: false },
      label: { type: "string", required: false },
      type: {
        type: "string",
        enum: ["text", "email", "password", "search", "tel", "url", "number", "hidden", "textarea"],
        default: "text",
      },
      value: { type: "string|signal", required: false },
      grabType: { type: "string", enum: ["GrabDecimal", "GrabInteger"], required: false },
      required: { type: "boolean|string", default: false },
      minLength: { type: "number", required: false },
      maxLength: { type: "number", required: false },
      pattern: { type: "string", required: false },
      placeholder: { type: "string", required: false },
      disabled: { type: "boolean", default: false },
      bare: { type: "boolean", default: false },
    },
    a11yDefaults: { labelForAssociation: true, roleAlertErrors: true },
    securityRules: ["no-float-coercion"],
  },
  Select: {
    name: "Select",
    category: "interactive",
    defaultTag: "label",
    allowedTags: ["label", "select"],
    acceptsChildren: false,
    props: {
      name: { type: "string", required: false },
      label: { type: "string", required: false },
      value: { type: "string|signal", required: false },
      options: { type: "array", required: true },
      required: { type: "boolean", default: false },
      disabled: { type: "boolean", default: false },
      bare: { type: "boolean", default: false },
    },
    a11yDefaults: { labelForAssociation: true },
    securityRules: ["textContent-only"],
  },
  Tabs: {
    name: "Tabs",
    category: "interactive",
    defaultTag: "section",
    allowedTags: ["section"],
    acceptsChildren: false,
    props: {
      label: { type: "string", required: false },
      activeId: { type: "string|signal", required: false },
      tabs: { type: "array", required: true },
    },
    a11yDefaults: { roleTablist: true, arrowHomeEndKeyboardNav: true, rovingTabindex: true },
    securityRules: ["no-wrapper-div"],
  },
  Accordion: {
    name: "Accordion",
    category: "interactive",
    defaultTag: "section",
    allowedTags: ["section"],
    acceptsChildren: false,
    props: {
      items: { type: "array", required: true },
      singleOpen: { type: "boolean", default: false },
      openIds: { type: "array|signal", required: false },
    },
    a11yDefaults: { nativeDetailsSummary: true },
    securityRules: ["no-wrapper-div"],
  },
  Modal: {
    name: "Modal",
    category: "interactive",
    defaultTag: "dialog",
    allowedTags: ["dialog"],
    acceptsChildren: true,
    props: {
      open: { type: "boolean|signal", required: true },
      title: { type: "string", required: false },
      onClose: { type: "function", required: false },
    },
    a11yDefaults: { nativeDialogShowModal: true, focusTrap: true, escapeDismiss: true, focusRestore: true },
    securityRules: ["no-wrapper-div"],
  },
  Nav: {
    name: "Nav",
    category: "interactive",
    defaultTag: "nav",
    allowedTags: ["nav"],
    acceptsChildren: false,
    props: {
      label: { type: "string", required: false },
      items: { type: "array", required: true },
      activePath: { type: "string|signal", required: false },
      collapsible: { type: "boolean", default: false },
      toggleLabel: { type: "string", default: "Menu" },
      open: { type: "boolean|signal", required: false },
    },
    a11yDefaults: { ariaCurrentPage: true, ariaExpandedToggle: true },
    securityRules: ["url-protocol-check", "relNoopenerOnExternal"],
  },
  ForEach: {
    name: "ForEach",
    category: "repeater",
    defaultTag: "ul",
    allowedTags: ["ul", "ol", "section", "tbody"],
    acceptsChildren: false,
    props: {
      parent: { type: "object", required: false },
      items: { type: "array|signal", required: true },
      key: { type: "function", required: true },
      render: { type: "function", required: true },
      empty: { type: "function", required: false },
    },
    a11yDefaults: { stableKeyIdentity: true },
    securityRules: ["auto-dispose-removed"],
  },
});

/**
 * Export the deterministic v1.0.0 machine-readable element catalog (grex.elements.json)
 * describing all 20 Grex JS elements for Grex Builder, GrabLab CMS, and Groxy AI.
 */
export function exportElementCatalog() {
  const elements = {};
  for (const [key, def] of Object.entries(CATALOG_ELEMENTS)) {
    elements[key] = {
      ...def,
      supportedStyleProps: SUPPORTED_STYLE_LIST,
    };
  }
  return {
    schemaVersion: "1.0.0",
    framework: "grex-js",
    elementCount: Object.keys(elements).length,
    elements,
  };
}

/**
 * Validate a declarative GrexElementNode JSON object (and its children) against
 * the grex.elements.json catalog, catching hallucinated types, disallowed tags,
 * unknown props, unsafe URLs/attrs, and unsafe CSS properties before rendering.
 *
 * @param {object} node
 * @param {{ strictProps?: boolean }} [options]
 * @returns {{ valid: true }}
 */
export function validateElementNode(node, options = {}) {
  const strictProps = options.strictProps !== false;
  if (!node || typeof node !== "object") {
    throw new GrexSecurityError("Element node must be a non-null object.");
  }

  const def = CATALOG_ELEMENTS[node.type];
  if (!def) {
    throw new GrexSecurityError(`Unknown Grex element type "${String(node.type)}".`);
  }

  if (node.tag !== undefined) {
    const cleanTag = String(node.tag).trim().toLowerCase();
    if (!def.allowedTags.includes(cleanTag)) {
      throw new GrexSecurityError(
        `Tag "${cleanTag}" is not allowed on ${def.name} (allowed: ${def.allowedTags.join(", ")}).`
      );
    }
  }

  const props = node.props || {};
  if (typeof props !== "object") {
    throw new GrexSecurityError(`${def.name}.props must be an object.`);
  }

  if (strictProps) {
    for (const key of Object.keys(props)) {
      if (!(key in def.props)) {
        throw new GrexSecurityError(`Unknown prop "${key}" on ${def.name} element.`);
      }
    }
  }

  if (def.name === "Heading" && props.level !== undefined) {
    if (!Number.isInteger(props.level) || props.level < 1 || props.level > 6) {
      throw new GrexSecurityError(`Heading level must be an integer 1..6; got "${String(props.level)}".`);
    }
  }

  for (const urlProp of ["href", "src", "action"]) {
    if (typeof props[urlProp] === "string" && !isSafeUrl(props[urlProp])) {
      throw new GrexSecurityError(`Unsafe URL on ${def.name}.props.${urlProp}.`);
    }
  }

  if (node.attrs && typeof node.attrs === "object") {
    for (const [k, v] of Object.entries(node.attrs)) {
      sanitizeAttributeValue(k, v);
    }
  }

  if (node.styles && typeof node.styles === "object") {
    const bpMap =
      "base" in node.styles || "tablet" in node.styles || "mobile" in node.styles
        ? node.styles
        : { base: node.styles };
    for (const styleObj of Object.values(bpMap)) {
      if (styleObj && typeof styleObj === "object") {
        for (const [prop, val] of Object.entries(styleObj)) {
          normalizeStyleProperty(prop);
          validateTokenValue(val);
        }
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child === "object" && "type" in child) {
        validateElementNode(child, options);
      }
    }
  }

  return { valid: true };
}

// --- bridge.js ---
/**
 * Grex JS v0.1 Origin-Checked Split-Screen Preview Bridge (GrexPreviewBridge).
 * Patches in-memory signals, attributes, text, and --grex-* CSS custom properties
 * with zero Grisp restarts and strict postMessage origin & schema validation.
 */


export const PREVIEW_CHANNEL = "grex-preview-v1";

function normalizeAllowedOrigins(allowedOrigins) {
  if (!allowedOrigins) {
    throw new GrexSecurityError("GrexPreviewBridge requires a non-empty allowedOrigins allowlist.");
  }
  const list = Array.isArray(allowedOrigins) ? allowedOrigins : Array.from(allowedOrigins);
  if (list.length === 0) {
    throw new GrexSecurityError("GrexPreviewBridge allowedOrigins allowlist cannot be empty.");
  }
  const normalized = new Set();
  for (const origin of list) {
    if (typeof origin !== "string" || origin.trim() === "" || origin.trim() === "*") {
      throw new GrexSecurityError(`Invalid or wildcard origin "${String(origin)}" rejected by GrexPreviewBridge.`);
    }
    normalized.add(origin.trim());
  }
  return normalized;
}

function resolveTargetElement(targetId, elements, root) {
  if (!targetId) {
    return root && root.documentElement ? root.documentElement : root;
  }
  if (elements && elements[targetId]) {
    return elements[targetId];
  }
  if (root && typeof root.querySelector === "function") {
    const safeId = String(targetId).replace(/["\\]/g, "\\$&");
    return root.querySelector(`[data-grex-id="${safeId}"]`);
  }
  return null;
}

/**
 * Create an origin-checked GrexPreviewBridge instance.
 *
 * @param {{
 *   allowedOrigins: string[] | Set<string>,
 *   targetWindow?: Window,
 *   root?: Document | Element,
 *   signals?: Record<string, { set(v: unknown): void }>,
 *   elements?: Record<string, Element>,
 *   onError?: (err: Error, event: MessageEvent) => void
 * }} options
 */
export function createPreviewBridge(options) {
  if (!options || typeof options !== "object") {
    throw new TypeError("createPreviewBridge(options) requires an options object.");
  }

  const allowedOrigins = normalizeAllowedOrigins(options.allowedOrigins);
  const targetWindow = options.targetWindow || globalThis.window;
  const root = options.root || globalThis.document;
  const signals = options.signals || {};
  const elements = options.elements || {};
  const onError = typeof options.onError === "function" ? options.onError : null;

  let listening = false;

  function applyOperation(op) {
    if (!op || typeof op !== "object") {
      throw new GrexSecurityError("Malformed preview bridge operation.");
    }

    switch (op.type) {
      case "patch-signal": {
        if (typeof op.key !== "string" || !(op.key in signals)) {
          throw new GrexSecurityError(`Unknown signal key "${String(op.key)}".`);
        }
        signals[op.key].set(op.value);
        return true;
      }

      case "patch-token": {
        const el = resolveTargetElement(op.targetId, elements, root);
        if (!el || !el.style) {
          throw new GrexSecurityError(`Target element "${String(op.targetId)}" not found for patch-token.`);
        }
        const tokenName = normalizeTokenName(op.token);
        const tokenValue = validateTokenValue(op.value);
        if (tokenValue === "") {
          el.style.removeProperty(tokenName);
        } else {
          el.style.setProperty(tokenName, tokenValue);
        }
        return true;
      }

      case "patch-style": {
        const el = resolveTargetElement(op.targetId, elements, root);
        if (!el || !el.style) {
          throw new GrexSecurityError(`Target element "${String(op.targetId)}" not found for patch-style.`);
        }
        const cssProp = normalizeStyleProperty(op.prop);
        const cssValue = validateTokenValue(op.value);
        if (cssValue === "") {
          el.style.removeProperty(cssProp);
        } else {
          el.style.setProperty(cssProp, cssValue);
        }
        return true;
      }

      case "patch-attr": {
        const el = resolveTargetElement(op.targetId, elements, root);
        if (!el) {
          throw new GrexSecurityError(`Target element "${String(op.targetId)}" not found for patch-attr.`);
        }
        if (op.value === false || op.value == null) {
          sanitizeAttributeValue(op.attr, "");
          el.removeAttribute(op.attr);
        } else {
          const safeVal = op.value === true ? "" : sanitizeAttributeValue(op.attr, op.value);
          el.setAttribute(op.attr, safeVal);
        }
        return true;
      }

      case "patch-text": {
        const el = resolveTargetElement(op.targetId, elements, root);
        if (!el) {
          throw new GrexSecurityError(`Target element "${String(op.targetId)}" not found for patch-text.`);
        }
        setSafeText(el, op.value);
        return true;
      }

      default:
        throw new GrexSecurityError(`Unsupported preview bridge operation type "${String(op.type)}".`);
    }
  }

  /**
   * Validate and process a postMessage event.
   * Returns true if applied, false if rejected (fail-closed).
   * @param {MessageEvent} event
   * @returns {boolean}
   */
  function handleMessage(event) {
    try {
      if (!event || typeof event.origin !== "string" || !allowedOrigins.has(event.origin)) {
        throw new GrexSecurityError(`Rejected preview message from untrusted origin "${String(event && event.origin)}".`);
      }

      const payload = event.data;
      if (!payload || typeof payload !== "object" || payload.channel !== PREVIEW_CHANNEL) {
        throw new GrexSecurityError("Rejected preview message with invalid channel or payload.");
      }

      if (payload.type === "batch") {
        if (!Array.isArray(payload.ops)) {
          throw new GrexSecurityError("Batch preview payload requires an ops array.");
        }
        batch(() => {
          for (const op of payload.ops) {
            applyOperation(op);
          }
        });
        return true;
      }

      return applyOperation(payload);
    } catch (err) {
      if (onError) {
        onError(err, event);
      }
      return false;
    }
  }

  function start() {
    if (listening || !targetWindow || typeof targetWindow.addEventListener !== "function") {
      return;
    }
    targetWindow.addEventListener("message", handleMessage);
    listening = true;
  }

  function stop() {
    if (!listening || !targetWindow || typeof targetWindow.removeEventListener !== "function") {
      return;
    }
    targetWindow.removeEventListener("message", handleMessage);
    listening = false;
  }

  return {
    handleMessage,
    start,
    stop,
    dispose: stop,
  };
}
