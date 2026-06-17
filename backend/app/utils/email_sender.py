from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging

import aiosmtplib

from ..config import settings

logger = logging.getLogger(__name__)


async def send_completion_email(
    *,
    customer_name: str,
    customer_email: str,
    service_name: str,
    technician_name: str,
    scheduled_date: str,
    job_id: int,
    pdf_path: str,
) -> bool:
    # Check SMTP configuration
    if not settings.smtp_user:
        logger.warning(f"[EMAIL] SMTP_USER not configured - email not sent for job {job_id}")
        return False
    if not settings.smtp_password:
        logger.warning(f"[EMAIL] SMTP_PASSWORD not configured - email not sent for job {job_id}")
        return False
    if not settings.notification_email:
        logger.warning(f"[EMAIL] NOTIFICATION_EMAIL not configured - email not sent for job {job_id}")
        return False

    logger.info(f"[EMAIL] Starting email send for job {job_id} to {settings.notification_email}")

    msg = MIMEMultipart()
    msg["From"]    = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    msg["To"]      = settings.notification_email
    msg["Subject"] = f"[Service Sheet] {customer_name} – {service_name} | Job #{job_id:04d}"

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a1a1a;padding:20px;text-align:center;border-top:4px solid #F5C800">
        <h1 style="color:#fff;margin:0;font-size:20px">Service Monks</h1>
        <p style="color:#F5C800;margin:4px 0 0;font-size:12px">Integrated Solutions Private Limited</p>
        <p style="color:#9ca3af;margin:4px 0 0;font-size:11px">Internal — Service Completion Sheet</p>
      </div>

      <div style="padding:24px">
        <p style="color:#374151;margin:0 0 16px">
          A service has been completed and signed off. The completion certificate is attached.<br/>
          <strong>Please forward to the customer at the address below.</strong>
        </p>

        <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
          <tr style="background:#fefce8">
            <td style="padding:8px 12px;border:1px solid #fef08a;font-weight:bold;width:40%">Job Reference</td>
            <td style="padding:8px 12px;border:1px solid #fef08a">#JOB-{job_id:04d}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #fef08a;font-weight:bold">Customer</td>
            <td style="padding:8px 12px;border:1px solid #fef08a">{customer_name}</td>
          </tr>
          <tr style="background:#fefce8">
            <td style="padding:8px 12px;border:1px solid #fef08a;font-weight:bold">Customer Email</td>
            <td style="padding:8px 12px;border:1px solid #fef08a">
              <a href="mailto:{customer_email}" style="color:#1a1a1a">{customer_email or "—"}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #fef08a;font-weight:bold">Service</td>
            <td style="padding:8px 12px;border:1px solid #fef08a">{service_name}</td>
          </tr>
          <tr style="background:#fefce8">
            <td style="padding:8px 12px;border:1px solid #fef08a;font-weight:bold">Technician</td>
            <td style="padding:8px 12px;border:1px solid #fef08a">{technician_name}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #fef08a;font-weight:bold">Date</td>
            <td style="padding:8px 12px;border:1px solid #fef08a">{scheduled_date}</td>
          </tr>
        </table>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px;font-size:13px;color:#166534">
          ✅ Customer signature captured on technician device. Certificate attached as PDF.
        </div>
      </div>

      <div style="background:#f9fafb;padding:14px;text-align:center;color:#9ca3af;font-size:11px;border-top:2px solid #F5C800">
        Service Monks Integrated Solutions Private Limited — Internal System Notification
      </div>
    </div>
    """
    msg.attach(MIMEText(html_body, "html"))

    with open(pdf_path, "rb") as f:
        attachment = MIMEApplication(f.read(), _subtype="pdf")
        attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=f"ServiceCompletion_JOB{job_id:04d}_{customer_name.replace(' ', '_')}.pdf",
        )
        msg.attach(attachment)

    try:
        logger.info(f"[EMAIL] Connecting to SMTP {settings.smtp_host}:{settings.smtp_port}")
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=settings.smtp_port == 465,
            start_tls=settings.smtp_port == 587,
        )
        logger.info(f"[EMAIL] ✓ Email sent successfully for job {job_id} to {settings.notification_email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL] ✗ Failed to send email for job {job_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        return False
