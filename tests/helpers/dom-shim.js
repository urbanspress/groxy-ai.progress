/**
 * Zero-dependency DOM shim for Groxy AI Node DOM & WCAG AA verification tests.
 * Traps any attempt to assign `.innerHTML` so zero-innerHTML compliance is guaranteed.
 */

export class DomTextNode {
  constructor(text, ownerDocument) {
    this.nodeType = 3;
    this.nodeName = "#text";
    this.textContent = String(text ?? "");
    this.parentNode = null;
    this.ownerDocument = ownerDocument || null;
  }
}

function matchesSimpleSelector(el, part) {
  const token = part.trim();
  if (!token) return false;

  // Extract optional tag before # or . or [
  let rest = token;
  let expectedTag = "";
  const tagMatch = /^([a-zA-Z0-9_-]+)/.exec(rest);
  if (tagMatch) {
    expectedTag = tagMatch[1].toLowerCase();
    rest = rest.slice(tagMatch[0].length);
  }
  if (expectedTag && el.tagName !== expectedTag) {
    return false;
  }

  while (rest.length > 0) {
    if (rest[0] === "#") {
      const m = /^#([a-zA-Z0-9_-]+)/.exec(rest);
      if (!m || el.getAttribute("id") !== m[1]) return false;
      rest = rest.slice(m[0].length);
    } else if (rest[0] === ".") {
      const m = /^\.([a-zA-Z0-9_-]+)/.exec(rest);
      if (!m) return false;
      const classes = String(el.getAttribute("class") || "")
        .split(/\s+/)
        .filter(Boolean);
      if (!classes.includes(m[1])) return false;
      rest = rest.slice(m[0].length);
    } else if (rest[0] === "[") {
      const m = /^\[([a-zA-Z0-9_:-]+)(?:="([^"]*)")?\]/.exec(rest);
      if (!m) return false;
      const attrName = m[1].toLowerCase();
      if (!el.hasAttribute(attrName)) return false;
      if (m[2] !== undefined && String(el.getAttribute(attrName)) !== m[2]) return false;
      rest = rest.slice(m[0].length);
    } else {
      return false;
    }
  }
  return true;
}

export class DomElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName || "").toLowerCase();
    this.nodeName = this.tagName.toUpperCase();
    this.ownerDocument = ownerDocument || null;
    this.parentNode = null;
    this.childNodes = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this._value = "";
  }

  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }

  get firstChild() {
    return this.childNodes.length > 0 ? this.childNodes[0] : null;
  }

  get id() {
    return this.getAttribute("id") || "";
  }

  set id(val) {
    this.setAttribute("id", String(val));
  }

  get className() {
    return this.getAttribute("class") || "";
  }

  set className(val) {
    this.setAttribute("class", String(val));
  }

  get value() {
    if (this.tagName === "textarea" && this._value === "") {
      return this.textContent;
    }
    return this._value;
  }

  set value(val) {
    this._value = String(val ?? "");
    if (this.tagName === "input") {
      this.attributes.set("value", this._value);
    } else if (this.tagName === "textarea") {
      this.textContent = this._value;
    }
  }

  get textContent() {
    let out = "";
    for (const child of this.childNodes) {
      out += child.textContent || "";
    }
    return out;
  }

  set textContent(val) {
    this.childNodes = [];
    const str = String(val ?? "");
    if (str.length > 0) {
      const txt = new DomTextNode(str, this.ownerDocument);
      txt.parentNode = this;
      this.childNodes.push(txt);
    }
  }

  get innerHTML() {
    return "";
  }

  set innerHTML(_val) {
    if (this.ownerDocument) {
      this.ownerDocument.innerHTMLWriteCount += 1;
    }
    throw new Error("innerHTML assignment is strictly forbidden by Groxy AI zero-innerHTML policy.");
  }

  setAttribute(name, value) {
    const key = String(name).toLowerCase();
    const valStr = String(value);
    this.attributes.set(key, valStr);
    if (key === "value" && (this.tagName === "input" || this.tagName === "option")) {
      this._value = valStr;
    }
  }

  getAttribute(name) {
    const key = String(name).toLowerCase();
    return this.attributes.has(key) ? this.attributes.get(key) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(String(name).toLowerCase());
  }

  removeAttribute(name) {
    this.attributes.delete(String(name).toLowerCase());
  }

  appendChild(child) {
    if (!child) return child;
    if (child.parentNode && typeof child.parentNode.removeChild === "function") {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument;
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.childNodes.indexOf(child);
    if (idx === -1) {
      throw new Error("Node to remove is not a child of this element.");
    }
    this.childNodes.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  addEventListener(type, listener) {
    const key = String(type).toLowerCase();
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(listener);
  }

  removeEventListener(type, listener) {
    const key = String(type).toLowerCase();
    const list = this.listeners.get(key);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx !== -1) list.splice(idx, 1);
  }

  dispatchEvent(eventObj) {
    const ev =
      typeof eventObj === "string"
        ? { type: eventObj }
        : eventObj && typeof eventObj === "object"
          ? eventObj
          : { type: "event" };
    const type = String(ev.type || "").toLowerCase();
    ev.target = ev.target || this;
    ev.currentTarget = this;
    ev.defaultPrevented = false;
    ev.preventDefault = () => {
      ev.defaultPrevented = true;
    };
    const list = this.listeners.get(type) || [];
    for (const fn of [...list]) {
      fn.call(this, ev);
    }
    return !ev.defaultPrevented;
  }

  _collectDescendants(out = []) {
    for (const child of this.childNodes) {
      if (child.nodeType === 1) {
        out.push(child);
        child._collectDescendants(out);
      }
    }
    return out;
  }

  querySelectorAll(selector) {
    const parts = String(selector || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const descendants = this._collectDescendants([]);
    const matches = [];
    for (const el of descendants) {
      if (parts.some((sel) => matchesSimpleSelector(el, sel))) {
        matches.push(el);
      }
    }
    return matches;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }
}

export class DomDocument {
  constructor() {
    this.nodeType = 9;
    this.innerHTMLWriteCount = 0;
    this.documentElement = new DomElement("html", this);
    this.documentElement.setAttribute("lang", "en");
    this.head = new DomElement("head", this);
    this.body = new DomElement("body", this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
  }

  createElement(tagName) {
    return new DomElement(tagName, this);
  }

  createTextNode(text) {
    return new DomTextNode(text, this);
  }

  getElementById(id) {
    return this.documentElement.querySelector(`#${String(id)}`);
  }

  querySelector(selector) {
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.documentElement.querySelectorAll(selector);
  }
}

export function createDomDocument({ csrfToken = "test-csrf-token" } = {}) {
  const doc = new DomDocument();
  const metaCharset = doc.createElement("meta");
  metaCharset.setAttribute("charset", "utf-8");
  const metaCsrf = doc.createElement("meta");
  metaCsrf.setAttribute("name", "groxy-csrf");
  metaCsrf.setAttribute("content", csrfToken);
  doc.head.appendChild(metaCharset);
  doc.head.appendChild(metaCsrf);

  const header = doc.createElement("header");
  const main = doc.createElement("main");
  main.setAttribute("id", "groxy-inspector-root");
  main.setAttribute("aria-label", "Groxy AI Audit and Playbook Inspector");
  const footer = doc.createElement("footer");

  doc.body.appendChild(header);
  doc.body.appendChild(main);
  doc.body.appendChild(footer);

  return { doc, root: main };
}

export function auditDom(root, doc = root?.ownerDocument) {
  const divs = root.querySelectorAll("div");
  const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let prevLevel = 0;
  let headingOrderOk = true;
  for (const h of headings) {
    const level = Number(h.tagName.slice(1));
    if (prevLevel > 0 && level > prevLevel + 1) {
      headingOrderOk = false;
    }
    prevLevel = level;
  }

  const labels = root.querySelectorAll("label");
  const labelForSet = new Set(
    labels.map((l) => l.getAttribute("for")).filter((v) => v && v.trim() !== "")
  );

  const controls = root.querySelectorAll("input, select, textarea");
  const unlabeledControls = [];
  for (const ctrl of controls) {
    const id = ctrl.getAttribute("id") || "";
    const aria = ctrl.getAttribute("aria-label") || "";
    if (!labelForSet.has(id) && aria.trim() === "") {
      unlabeledControls.push(`${ctrl.tagName}#${id || "anonymous"}`);
    }
  }

  const imgs = root.querySelectorAll("img");
  const missingAltImages = imgs.filter((img) => {
    const alt = img.getAttribute("alt");
    return !alt || alt.trim() === "";
  }).length;

  const allElements = [root, ...root._collectDescendants([])];
  const unsafeUrls = [];
  const inlineHandlers = [];
  for (const el of allElements) {
    for (const [attr, val] of el.attributes.entries()) {
      if (attr.startsWith("on")) {
        inlineHandlers.push(`${el.tagName}[${attr}]`);
      }
      if (attr === "href" || attr === "src" || attr === "action") {
        const lower = String(val).trim().toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
          unsafeUrls.push(`${el.tagName}[${attr}]=${val}`);
        }
      }
    }
  }

  return {
    divCount: divs.length,
    innerHTMLWriteCount: doc ? doc.innerHTMLWriteCount : 0,
    headingCount: headings.length,
    headingOrderOk,
    unlabeledControls,
    missingAltImages,
    scriptElements: root.querySelectorAll("script").length,
    unsafeUrls,
    inlineHandlers,
  };
}
