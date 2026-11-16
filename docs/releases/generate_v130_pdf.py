from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "docs" / "releases" / "pdf" / "Groxy-AI-v1.3.0-Guide.pdf"


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=letter, rightMargin=.68*inch, leftMargin=.68*inch, topMargin=.62*inch, bottomMargin=.62*inch, title="Groxy AI v1.3.0 Post-Purchase Email Flow Guide", author="Urban's Press")
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleBlue", parent=styles["Title"], textColor=colors.HexColor("#12306b"), fontSize=24, leading=29, alignment=TA_CENTER, spaceAfter=5))
    styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], textColor=colors.HexColor("#334155"), fontSize=12, leading=16, alignment=TA_CENTER, spaceAfter=8))
    styles.add(ParagraphStyle(name="SectionBlue", parent=styles["Heading2"], textColor=colors.HexColor("#12306b"), fontSize=14, leading=18, spaceBefore=10, spaceAfter=5, keepWithNext=True))
    styles.add(ParagraphStyle(name="BodyCompact", parent=styles["BodyText"], fontSize=9.5, leading=14, spaceAfter=6))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8, leading=10))
    story = [
        Paragraph("Groxy AI v1.3.0", styles["TitleBlue"]),
        Paragraph("Autonomous Post-Purchase Email Flow Designer &amp; Copywriter", styles["Subtitle"]),
        Paragraph("Release status: Approved & Frozen — Complete. Static checks, 61/61 Node tests, and the live four-layer integration gate passed, including recursive canonical digest parity, provider fallback and SSRF checks, and concurrent single-winner approval.", styles["Small"]),
        Spacer(1, 10),
        Paragraph("1. Design four grounded messages", styles["SectionBlue"]),
        Paragraph("POST /api/groxy/email-flows/design reads Brand DNA, Site Context, and live Grex design tokens. It stages four ordered messages: Order Receipt &amp; Welcome, Quick-Start / Setup Guide, Check-In &amp; Review Request, and Targeted Cross-Sell / Reorder. Missing customer and sender facts remain explicit placeholders. Monetary values remain exact decimal strings, including trailing zeroes.", styles["BodyCompact"]),
        Paragraph("Every message has a plain-text body, semantic layout, suggested timing metadata, and unsubscribe and physical-address placeholders. Timing is only a suggestion; this release does not schedule delivery.", styles["BodyCompact"]),
        Paragraph("2. Review and save one CMS draft", styles["SectionBlue"]),
        Paragraph("The dashboard presents the preview and requires a separate Approve &amp; Save Draft Flow action. Its one-use approval token is bound to the staged flow ID, step count, digest, CMS destination, and operator. An atomic consumption gate allows one concurrent winner; invalid target attempts return 403 and duplicate or replay attempts return 409. Approval creates one new GrabLab CMS draft through create_entry_draft. It does not send or activate email.", styles["BodyCompact"]),
        Paragraph("Unsubscribe, sender-address, consent, suppression, and unresolved merge-field requirements remain activation blockers for any future delivery system.", styles["BodyCompact"]),
        Paragraph("3. API routes", styles["SectionBlue"]),
    ]
    rows = [
        [Paragraph("Route", styles["Small"]), Paragraph("Purpose", styles["Small"])],
        [Paragraph("POST /api/groxy/email-flows/design", styles["Small"]), Paragraph("Validate inputs, ground and stage a four-step preview.", styles["Small"])],
        [Paragraph("POST /api/groxy/email-flows/apply", styles["Small"]), Paragraph("Check CSRF and target binding, then create a draft only.", styles["Small"])],
    ]
    table = Table(rows, colWidths=[2.8*inch, 4.3*inch], repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#dbeafe")), ("GRID", (0,0), (-1,-1), .45, colors.HexColor("#94a3b8")), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 6), ("RIGHTPADDING", (0,0), (-1,-1), 6), ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5)]))
    story.extend([table, Paragraph("4. Verification and compatibility", styles["SectionBlue"]), Paragraph("Verified in this workspace: GRAB syntax and byte-for-byte canonical source formatting; 61/61 Node tests; Gates 1, 2, 3A, and live 3B. Live coverage verifies recursive UTF-8 digest parity, Ollama offline fallback, GRAB-E402 BYOK SSRF rejection, exact-price CMS draft readback, and concurrent duplicate approval with one 201 winner and one 409 response. Frozen upstream repositories were not modified.", styles["BodyCompact"])])
    compat = [["Ecosystem layer", "Required range", "Touched", "Upgrade"], ["GRAB language, VM and Grisp", ">=1.1.0 <2.0.0", "No", "No"], ["Grex JS runtime", ">=1.0.0 <2.0.0", "No", "No"], ["GrabLab CMS", ">=1.0.1 <2.0.0", "No", "No"], ["Grex Theme Builder", ">=1.0.0 <2.0.0", "No", "No"], ["Groxy AI", ">=0.1.0", "Yes, v1.3.0", "No"]]
    matrix = Table(compat, colWidths=[2.5*inch, 1.6*inch, 1.45*inch, 1.55*inch], repeatRows=1)
    matrix.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#dbeafe")), ("GRID", (0,0), (-1,-1), .4, colors.HexColor("#94a3b8")), ("VALIGN", (0,0), (-1,-1), "TOP"), ("FONTSIZE", (0,0), (-1,-1), 8), ("LEFTPADDING", (0,0), (-1,-1), 4), ("RIGHTPADDING", (0,0), (-1,-1), 4), ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4)]))
    story.append(matrix)
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
