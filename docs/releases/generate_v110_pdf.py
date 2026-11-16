"""Generate the Groxy AI v1.1.0 Screenshot-to-Grex walkthrough PDF."""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs" / "releases" / "pdf" / "Groxy-AI-v1.1.0-Guide.pdf"
NAVY = colors.HexColor("#0B1220")
GREEN = colors.HexColor("#10B981")
PALE = colors.HexColor("#ECFDF5")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#526176")
LINE = colors.HexColor("#D9E2EC")


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(str(filename), pagesize=letter, rightMargin=0.7 * inch, leftMargin=0.7 * inch, topMargin=0.72 * inch, bottomMargin=0.65 * inch, title="Groxy AI v1.1.0 - Screenshot-to-Grex Visual Replica Guide", author="Plotific Press")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="main")
        self.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=self.draw_chrome)])

    def draw_chrome(self, canvas, doc):
        canvas.saveState()
        width, height = letter
        canvas.setFillColor(NAVY)
        canvas.rect(0, height - 0.18 * inch, width, 0.18 * inch, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.line(doc.leftMargin, 0.48 * inch, width - doc.rightMargin, 0.48 * inch)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, 0.31 * inch, "GROXY AI  |  v1.1.0 Screenshot-to-Grex Visual Replica")
        canvas.drawRightString(width - doc.rightMargin, 0.31 * inch, f"Page {doc.page}")
        canvas.restoreState()


def build_pdf():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=27, leading=31, alignment=TA_LEFT, textColor=NAVY, spaceAfter=10))
    styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=17, textColor=MUTED, spaceAfter=16))
    styles.add(ParagraphStyle(name="H1Green", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=NAVY, spaceBefore=8, spaceAfter=8))
    styles.add(ParagraphStyle(name="H2Green", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=GREEN, spaceBefore=9, spaceAfter=4))
    styles.add(ParagraphStyle(name="BodyCompact", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.1, leading=13, textColor=INK, spaceAfter=5))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontName="Helvetica", fontSize=8, leading=10.5, textColor=MUTED))
    styles.add(ParagraphStyle(name="Cell", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.1, leading=10.5, textColor=INK))
    styles.add(ParagraphStyle(name="CellHead", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8.2, leading=10.5, textColor=colors.white))
    styles.add(ParagraphStyle(name="Callout", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.4, leading=13.5, textColor=NAVY))

    def P(text, style="BodyCompact"):
        return Paragraph(text, styles[style])

    def make_table(rows, widths):
        table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.45, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
        ]))
        return table

    story = [
        Spacer(1, 0.35 * inch),
        P("GROXY AI  /  RELEASE WALKTHROUGH", "H2Green"),
        P("v1.1.0 - Screenshot-to-Grex Visual Replica", "CoverTitle"),
        P("A practical guide to verifying a reference screenshot, staging an accessible Grex layout, and approving a reversible Builder update.", "CoverSub"),
    ]
    callout = Table([[P("<b>Release status:</b> Approved &amp; Frozen - Complete. Static, byte-for-byte canonical-format, 45/45 Node, and live 4-layer integration gates all pass. The v1.1.0 guide, bundle, checksums, ecosystem snapshot, and synchronized origin/stable releases are complete.", "Callout")]], colWidths=[7.05 * inch])
    callout.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), PALE), ("BOX", (0, 0), (-1, -1), 1, GREEN), ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    story += [callout, Spacer(1, 0.18 * inch), P("What this adds", "H1Green"), P("Groxy AI accepts bounded PNG, JPEG, and WebP screenshots, checks their actual binary signatures, extracts visual hints locally, and compiles a candidate layout using the existing Grex JS v1.0.0 catalog. The candidate remains staged until a person approves its target-bound token.")]

    story += [P("1. The screenshot-to-Grex workflow", "H1Green")]
    workflow = [
        [P("Stage", "CellHead"), P("What happens", "CellHead"), P("Safety gate", "CellHead")],
        [P("1. Upload", "Cell"), P("Choose a PNG, JPEG, or WebP reference screenshot. The browser sends bounded hex and base64 representations.", "Cell"), P("Magic-byte and MIME verification; 5 MiB decoded limit; active-content marker rejection.", "Cell")],
        [P("2. Analyze", "Cell"), P("Deterministic mode is the default. Optional Ollama uses 127.0.0.1:11434; BYOK requires an explicitly allowlisted HTTPS endpoint.", "Cell"), P("Ollama falls back to deterministic extraction when offline. BYOK is constrained by GRAB-E402 and an environment-provided secret.", "Cell")],
        [P("3. Preview", "Cell"), P("Review hierarchy, columns, 8pt spacing tokens, typography scale, palette repairs, and the four-pillar score.", "Cell"), P("20 Grex elements, zero wrapper divs, no innerHTML, accessibility checks, exact ADR-025c strings, Grade A or A+.", "Cell")],
        [P("4. Approve", "Cell"), P("Click Approve to send the staged tree to Grex Theme Builder. Discard clears the preview locally.", "Cell"), P("Single-use token bound to clone_id, slot, and layout SHA-256. Builder action is undoable; optional CMS content stays draft-only.", "Cell")],
    ]
    story += [make_table(workflow, [0.78 * inch, 3.04 * inch, 3.23 * inch]), Spacer(1, 0.12 * inch)]

    route_heading = P("2. API routes and expected errors", "H1Green")
    routes = [
        [P("Route", "CellHead"), P("Purpose", "CellHead"), P("Key responses", "CellHead")],
        [P("POST /api/groxy/vision-clone", "Cell"), P("Verify screenshot, compile a Grex candidate, run audits, and stage a one-use token.", "Cell"), P("200 staged; 403 CSRF/path; 413 over 5 MiB; 422 invalid image or numeric wire value.", "Cell")],
        [P("POST /api/groxy/vision-clone/apply", "Cell"), P("Verify approval binding and dispatch the approved layout to Builder; optionally create a CMS draft.", "Cell"), P("200 approved; 403 invalid token/target; 409 replay; 503 Builder unavailable.", "Cell")],
    ]
    route_table = make_table(routes, [2.2 * inch, 2.65 * inch, 2.2 * inch])
    route_note = P("Image files are rejected unless the declared MIME matches PNG, JPEG, or WebP magic bytes. Local reference paths must remain under storage/reference_uploads/. Prices, SKUs, and item counts use exact base-10 strings.")
    story += [KeepTogether([route_heading, route_table, route_note])]

    story += [P("3. What the replica keeps", "H1Green")]
    safeguards = [
        [P("Area", "CellHead"), P("Implementation", "CellHead")],
        [P("Structure", "Cell"), P("Semantic Grex nodes represent navigation, hero, feature, pricing, collection, and FAQ sections. Layout hints are bounded and model output is treated as untrusted metadata.", "Cell")],
        [P("Design system", "Cell"), P("Generated trees reuse live --grex-* tokens and registered .grex-c-* classes. Color candidates are checked in Light and Dark modes and low-contrast text pairs are repaired.", "Cell")],
        [P("Accessibility", "Cell"), P("validateElementNode() and auditAccessibility() run before a candidate is staged. The existing 22-rule, four-pillar auditor requires Grade A or A+ and publish_safe: true.", "Cell")],
        [P("Numeric fidelity", "Cell"), P("GrabDecimal and GrabInteger values remain strings. Raw JavaScript floating-point prices or counts receive HTTP 422.", "Cell")],
        [P("Human approval", "Cell"), P("The preview does not mutate Builder or CMS state. Apply checks CSRF and a token bound to clone_id, slot, and layout SHA-256. Replays return 409.", "Cell")],
        [P("CMS", "Cell"), P("When create_draft is enabled, Groxy calls create_entry_draft with status set to draft. It never sets an entry to published.", "Cell")],
    ]
    story += [make_table(safeguards, [1.35 * inch, 5.7 * inch]), P("4. Verification and release sequence", "H1Green")]
    gates = [
        [P("Gate", "CellHead"), P("Command / evidence", "CellHead"), P("Current result", "CellHead")],
        [P("GRAB static and format", "Cell"), P("grab check --platform-config grab.platform.json src/groxy.grab; compare grab format stdout byte-for-byte.", "Cell"), P("Passed locally.", "Cell")],
        [P("Node unit and DOM", "Cell"), P("node --test tests/*.test.js, including image signatures, caps, contrast, decimals, DOM safety, and digest binding.", "Cell"), P("45/45 passed locally.", "Cell")],
        [P("Live cross-layer", "Cell"), P("python tests/integration_e2e.py against GRAB, GrabLab, Grex Builder, and Groxy AI.", "Cell"), P("Passed: Gates 1, 2, 3A, and live 3B.", "Cell")],
        [P("Promotion", "Cell"), P("Generate artifacts, run ecosystem snapshot/handoff sync, commit, tag, push both remotes, publish matching releases.", "Cell"), P("Complete on origin and stable.", "Cell")],
    ]
    story += [make_table(gates, [1.35 * inch, 3.9 * inch, 1.8 * inch]), Spacer(1, 0.1 * inch), P("Frozen compatibility baselines: GRAB v1.1.0, Grex JS v1.0.0, GrabLab CMS v1.0.1, and Grex Theme Builder v1.0.0. The v1.1.0 feature is additive and does not require changes to those repositories.", "Small")]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = GuideDoc(OUTPUT)
    doc.build(story)
    print(f"Generated {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build_pdf()
