import base64
import io
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)

BRAND_LIGHT = colors.HexColor("#fefce8")   # light yellow tint
BRAND_GRAY  = colors.HexColor("#6b7280")

W, H = A4


LOGO_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logo.jpeg")
BRAND_BLACK  = colors.HexColor("#1a1a1a")
BRAND_YELLOW = colors.HexColor("#F5C800")


def _header_table(logo_path: str | None = None) -> Table:
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title", fontSize=18, fontName="Helvetica-Bold",
        textColor=BRAND_BLACK, leading=22,
    )
    sub_style = ParagraphStyle(
        "sub", fontSize=9, fontName="Helvetica",
        textColor=BRAND_GRAY,
    )
    left = [
        Paragraph("Service Monks Integrated Solutions Private Limited", title_style),
        Paragraph("Your Pest Management Partner", sub_style),
        Paragraph("www.servicemonks.com", sub_style),
    ]
    right_content = []
    lp = logo_path or LOGO_PATH
    if lp and os.path.exists(lp):
        right_content.append(Image(lp, width=28 * mm, height=28 * mm))

    data = [[left, right_content or ""]]
    t = Table(data, colWidths=[120 * mm, 60 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    return t


def _info_table(label_vals: list[tuple[str, str]]) -> Table:
    style = ParagraphStyle("cell", fontSize=9, fontName="Helvetica", leading=14)
    bold_style = ParagraphStyle("bold", fontSize=9, fontName="Helvetica-Bold", leading=14)
    rows = []
    for label, val in label_vals:
        rows.append([Paragraph(label, bold_style), Paragraph(str(val) if val else "—", style)])
    t = Table(rows, colWidths=[50 * mm, 120 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BRAND_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fef08a")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def generate_completion_pdf(
    *,
    job_id: int,
    customer_name: str,
    customer_address: str,
    customer_email: str,
    service_name: str,
    technician_name: str,
    checkin_time: datetime | None,
    checkout_time: datetime | None,
    products_used: str,
    remarks: str,
    signature_base64: str,
    output_dir: str = "uploads/pdfs",
) -> str:
    os.makedirs(output_dir, exist_ok=True)
    filename = f"job_{job_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    heading = ParagraphStyle(
        "heading", fontSize=13, fontName="Helvetica-Bold",
        textColor=BRAND_BLACK, spaceAfter=4,
    )
    normal = ParagraphStyle("n", fontSize=9, fontName="Helvetica", leading=14)

    story = []

    story.append(_header_table(None))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width="100%", thickness=3, color=BRAND_YELLOW))
    story.append(Spacer(1, 4 * mm))

    cert_style = ParagraphStyle(
        "cert", fontSize=14, fontName="Helvetica-Bold",
        alignment=1, textColor=BRAND_BLACK,
    )
    story.append(Paragraph("SERVICE COMPLETION CERTIFICATE", cert_style))
    story.append(Spacer(1, 2 * mm))
    story.append(HRFlowable(width="100%", thickness=3, color=BRAND_YELLOW))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Customer Details", heading))
    story.append(_info_table([
        ("Customer Name", customer_name),
        ("Address", customer_address),
        ("Email", customer_email),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Service Details", heading))
    checkin_str = checkin_time.strftime("%d %b %Y  %I:%M %p") if checkin_time else "—"
    checkout_str = checkout_time.strftime("%d %b %Y  %I:%M %p") if checkout_time else "—"
    story.append(_info_table([
        ("Service", service_name),
        ("Technician", technician_name),
        ("Check-in Time", checkin_str),
        ("Completion Time", checkout_str),
        ("Products / Chemicals Used", products_used or "—"),
    ]))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Observations & Remarks", heading))
    story.append(Paragraph(remarks or "No remarks.", normal))
    story.append(Spacer(1, 8 * mm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_GRAY))
    story.append(Spacer(1, 5 * mm))

    sig_style = ParagraphStyle(
        "sig", fontSize=9, fontName="Helvetica-Bold", textColor=BRAND_GRAY
    )

    sig_img = None
    if signature_base64:
        try:
            raw = signature_base64.split(",")[-1]
            sig_bytes = base64.b64decode(raw)
            buf = io.BytesIO(sig_bytes)
            sig_img = Image(buf, width=60 * mm, height=25 * mm)
        except Exception:
            pass

    sig_data = [
        [sig_img or Paragraph("(Signature not captured)", normal),
         Paragraph(
             f"Generated: {datetime.now().strftime('%d %b %Y %I:%M %p')}<br/>Job Reference: #JOB-{job_id:04d}",
             ParagraphStyle("ts", fontSize=8, fontName="Helvetica", textColor=BRAND_GRAY, alignment=2)
         )],
        [Paragraph("Customer Signature", sig_style),
         Paragraph("This is a system-generated certificate.", ParagraphStyle(
             "foot", fontSize=7, fontName="Helvetica", textColor=BRAND_GRAY, alignment=2
         ))],
    ]
    sig_table = Table(sig_data, colWidths=[90 * mm, 90 * mm])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
    ]))
    story.append(sig_table)

    doc.build(story)
    return filepath
