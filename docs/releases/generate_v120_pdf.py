from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs" / "releases" / "pdf" / "Groxy-AI-v1.2.0-Guide.pdf"


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        rightMargin=0.68 * inch,
        leftMargin=0.68 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.62 * inch,
        title="Groxy AI v1.2.0 Brand DNA and Batch Campaign Guide",
        author="Urban's Press",
    )
    base = getSampleStyleSheet()
    base.add(ParagraphStyle(name="TitleBlue", parent=base["Title"], textColor=colors.HexColor("#12306b"), fontSize=25, leading=30, alignment=TA_CENTER, spaceAfter=5))
    base.add(ParagraphStyle(name="Subtitle", parent=base["Normal"], textColor=colors.HexColor("#334155"), fontSize=12, leading=16, alignment=TA_CENTER, spaceAfter=8))
    base.add(ParagraphStyle(name="SectionBlue", parent=base["Heading2"], textColor=colors.HexColor("#12306b"), fontSize=15, leading=18, spaceBefore=10, spaceAfter=5, keepWithNext=True))
    base.add(ParagraphStyle(name="BodyCompact", parent=base["BodyText"], fontSize=9.5, leading=14, spaceAfter=6))
    base.add(ParagraphStyle(name="Small", parent=base["BodyText"], fontSize=8, leading=10))
    story = [
        Paragraph("Groxy AI v1.2.0", base["TitleBlue"]),
        Paragraph("Brand DNA and Voice Setup Wizard + Batch Content and Product Campaigns", base["Subtitle"]),
        Paragraph("Implementation verified; dual-repository publication pending. SemVer: backwards-compatible MINOR release.", base["Small"]),
        Spacer(1, 10),
        Paragraph("What this release adds", base["SectionBlue"]),
        Paragraph("Groxy AI learns a business's audience, voice, local search focus, offers, exact pricing, guarantees, and design tokens once. Teams can then prepare up to 40 related blog posts or product drafts from a short brief. Every candidate is audited and reviewed before it can be sent to GrabLab CMS.", base["BodyCompact"]),
        Paragraph("1. Set up Brand DNA once", base["SectionBlue"]),
        Paragraph("Answer ten short, step-by-step questions covering business identity, customer needs, local service area and search terms, voice balance, forbidden phrases, preferred calls to action, offers, prices, guarantees, and Design Style Pack tokens. Saving requires an explicit submit.", base["BodyCompact"]),
        Paragraph("The profile is stored in storage/brand-dna.v1.json with a readable storage/BRAND-DNA.md copy. Revision checks protect newer guidance from stale browser sessions. Prices stay decimal strings; JavaScript floating-point values are rejected.", base["BodyCompact"]),
        Paragraph("2. Prepare a campaign preview", base["SectionBlue"]),
        Paragraph("Choose blog posts or products, enter a one-sentence brief, and select deterministic built-in generation, local Ollama, or a configured allowlisted BYOK provider. Deterministic generation has no API fee. Ollama uses loopback and falls back when offline. BYOK destinations must match the configured outbound allowlist.", base["BodyCompact"]),
        Paragraph("Groxy checks title and slug duplicates, produces semantic content and escaped Article or Product JSON-LD, and audits each candidate with the 22-rule four-pillar auditor. Every item must score at least 90 (Grade A or A+). Product prices retain their exact decimal-string representation.", base["BodyCompact"]),
        Paragraph("3. Review and approve drafts", base["SectionBlue"]),
        Paragraph("The staged preview is bound to a one-time approval token and SHA-256 digest covering the batch ID, item count, and contents. Applying requires the CSRF token and matching approval token. Invalid or mismatched tokens return 403; replay returns 409.", base["BodyCompact"]),
        Paragraph("After approval, Groxy sends each item to GrabLab CMS using create_entry_draft with status_enforced set to draft. The feature never publishes live content automatically.", base["BodyCompact"]),
        Paragraph("4. API routes", base["SectionBlue"]),
    ]
    route_data = [
        [Paragraph("Route", base["Small"]), Paragraph("Purpose and guard", base["Small"])],
        [Paragraph("GET /api/groxy/brand-dna", base["Small"]), Paragraph("Read the saved profile and revision.", base["Small"])],
        [Paragraph("POST /api/groxy/brand-dna/wizard", base["Small"]), Paragraph("CSRF-protected profile save with exact prices and revision checks.", base["Small"])],
        [Paragraph("POST /api/groxy/batch-create", base["Small"]), Paragraph("Audit and stage 1-40 post or product drafts.", base["Small"])],
        [Paragraph("POST /api/groxy/batch-create/apply", base["Small"]), Paragraph("Validate one-use approval and create CMS drafts only.", base["Small"])],
    ]
    table = Table(route_data, colWidths=[2.45 * inch, 4.65 * inch], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbeafe")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#94a3b8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.extend([table, Paragraph("5. Verification and ecosystem compatibility", base["SectionBlue"]), Paragraph("Implementation verification passed: GRAB check and canonical format parity; 54 of 54 Node tests; and live Gate 3B integration for Brand DNA persistence, Site DNA export, audit scoring, invalid-token rejection, draft creation, and replay rejection. All eight frozen sibling repositories remained clean. GitHub release publication is pending restored credentials.", base["BodyCompact"])])
    compat_data = [
        ["Ecosystem layer", "Required range", "Touched", "Upgrade"],
        ["GRAB language, VM and Grisp", ">=1.1.0 <2.0.0", "No", "No"],
        ["Grex JS runtime", ">=1.0.0 <2.0.0", "No", "No"],
        ["GrabLab CMS", ">=1.0.1 <2.0.0", "No", "No"],
        ["Grex Theme Builder", ">=1.0.0 <2.0.0", "No", "No"],
        ["Groxy AI", ">=0.1.0", "Yes, v1.2.0", "No"],
    ]
    compat = Table(compat_data, colWidths=[2.55 * inch, 1.8 * inch, 1.2 * inch, 1.25 * inch], repeatRows=1, hAlign="LEFT")
    compat.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbeafe")),
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#94a3b8")),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(compat)

    def page_footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#cbd5e1"))
        canvas.line(0.68 * inch, 0.48 * inch, 7.82 * inch, 0.48 * inch)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#475569"))
        canvas.drawString(0.68 * inch, 0.32 * inch, "Groxy AI v1.2.0 - Urban's Press / GRAB Ecosystem")
        canvas.drawRightString(7.82 * inch, 0.32 * inch, f"Page {document.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    return OUTPUT


if __name__ == "__main__":
    print(build_pdf())
