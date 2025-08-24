from io import BytesIO
from reportlab.lib.pagesizes import A4, letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from typing import Iterable, Dict, Any, Optional
from datetime import datetime
import os

def generate_submissions_pdf(submissions: Iterable[dict]) -> BytesIO:
    """Generate PDF report for form submissions (legacy function)"""
    buf = BytesIO()
    p = canvas.Canvas(buf, pagesize=A4)
    y = 820
    p.setFont("Helvetica", 11)
    p.drawString(40, 840, "Form Submissions Report")
    p.setFont("Helvetica", 9)

    for s in submissions:
        line1 = f"#{s['id']} | {s['full_name']} | {s['email']}"
        line2 = f"Notes: {s.get('notes','')}"
        line3 = f"Geo: lat={s.get('latitude')} lon={s.get('longitude')} acc={s.get('geo_accuracy_m')}m at {s.get('captured_at')}"
        for line in (line1, line2, line3, " "):
            p.drawString(40, y, line[:110])
            y -= 16
            if y < 60:
                p.showPage(); p.setFont("Helvetica", 9); y = 820
    p.save()
    buf.seek(0)
    return buf

def generate_claim_verification_report(
    claim_data: Dict[str, Any],
    meeting_data: Dict[str, Any],
    recording_data: Optional[Dict[str, Any]] = None,
    form_data: Optional[Dict[str, Any]] = None
) -> BytesIO:
    """Generate comprehensive claim verification report with video recording and geolocation"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1,  # Center alignment
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    # Title
    title = Paragraph("VerifyCall - Claim Verification Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    # Report metadata
    report_info = [
        ['Report Generated:', datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")],
        ['Report ID:', f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}"],
        ['Verification Status:', 'COMPLETED' if recording_data else 'PENDING']
    ]
    
    report_table = Table(report_info, colWidths=[2*inch, 4*inch])
    report_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(report_table)
    elements.append(Spacer(1, 20))
    
    # Claim Information Section
    elements.append(Paragraph("Claim Information", heading_style))
    
    claim_info = [
        ['Claim Number:', claim_data.get('claim_number', 'N/A')],
        ['Patient Mobile:', claim_data.get('patient_mobile', 'N/A')],
        ['Hospital Location:', f"{claim_data.get('hospital_city', 'N/A')}, {claim_data.get('hospital_state', 'N/A')}"],
        ['Language:', claim_data.get('language', 'N/A')],
        ['Claim Status:', claim_data.get('status', 'N/A')],
        ['Created Date:', claim_data.get('created_at', 'N/A')]
    ]
    
    claim_table = Table(claim_info, colWidths=[2*inch, 4*inch])
    claim_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(claim_table)
    elements.append(Spacer(1, 20))
    
    # Video Verification Section
    elements.append(Paragraph("Video Verification Details", heading_style))
    
    meeting_info = [
        ['Session ID:', meeting_data.get('session_id', 'N/A')],
        ['Room Name:', meeting_data.get('room_name', 'N/A')],
        ['Patient Name:', meeting_data.get('patient_name', 'N/A')],
        ['Procedure:', meeting_data.get('procedure', 'N/A')],
        ['Meeting Status:', meeting_data.get('status', 'N/A')],
        ['Meeting Created:', meeting_data.get('created_at', 'N/A')]
    ]
    
    meeting_table = Table(meeting_info, colWidths=[2*inch, 4*inch])
    meeting_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgreen),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(meeting_table)
    elements.append(Spacer(1, 20))
    
    # Recording Information Section
    if recording_data:
        elements.append(Paragraph("Recording Information", heading_style))
        
        recording_info = [
            ['Recording ID:', str(recording_data.get('id', 'N/A'))],
            ['S3 Key:', recording_data.get('s3_key', 'N/A')],
            ['Recording URL:', recording_data.get('s3_url', 'N/A')],
            ['Duration (seconds):', str(recording_data.get('duration_sec', 'N/A'))],
            ['File Type:', recording_data.get('mime_type', 'N/A')],
            ['Recorded At:', recording_data.get('created_at', 'N/A')]
        ]
        
        recording_table = Table(recording_info, colWidths=[2*inch, 4*inch])
        recording_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightyellow),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(recording_table)
        elements.append(Spacer(1, 20))
        
        # Geolocation Information
        if recording_data.get('latitude') and recording_data.get('longitude'):
            elements.append(Paragraph("Geolocation Information", heading_style))
            
            geo_info = [
                ['Latitude:', str(recording_data.get('latitude', 'N/A'))],
                ['Longitude:', str(recording_data.get('longitude', 'N/A'))],
                ['Accuracy (meters):', str(recording_data.get('geo_accuracy_m', 'N/A'))],
                ['Location Verified:', 'YES' if recording_data.get('latitude') else 'NO']
            ]
            
            geo_table = Table(geo_info, colWidths=[2*inch, 4*inch])
            geo_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightcoral),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(geo_table)
            elements.append(Spacer(1, 20))
    
    # Form Submission Information
    if form_data:
        elements.append(Paragraph("Patient Information", heading_style))
        
        form_info = [
            ['Full Name:', form_data.get('full_name', 'N/A')],
            ['Email:', form_data.get('email', 'N/A')],
            ['Phone:', form_data.get('phone', 'N/A')],
            ['Policy Number:', form_data.get('policyNumber', 'N/A')],
            ['Additional Notes:', form_data.get('message', 'N/A')]
        ]
        
        form_table = Table(form_info, colWidths=[2*inch, 4*inch])
        form_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightsteelblue),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(form_table)
        elements.append(Spacer(1, 20))
    
    # Verification Summary
    elements.append(Paragraph("Verification Summary", heading_style))
    
    verification_status = "VERIFIED" if recording_data else "PENDING VERIFICATION"
    verification_color = colors.green if recording_data else colors.orange
    
    summary_text = f"""
    <para>
    <b>Status:</b> <font color="{verification_color.hexval()}">{verification_status}</font><br/>
    <b>Video Recording:</b> {'Available' if recording_data else 'Not Available'}<br/>
    <b>Geolocation:</b> {'Captured' if recording_data and recording_data.get('latitude') else 'Not Captured'}<br/>
    <b>Compliance:</b> {'COMPLIANT' if recording_data else 'PENDING'}<br/>
    </para>
    """
    
    elements.append(Paragraph(summary_text, styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Footer
    footer_text = """
    <para>
    <i>This report was generated automatically by VerifyCall system. 
    All information is confidential and should be handled according to HIPAA guidelines.</i>
    </para>
    """
    elements.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def save_pdf_to_file(pdf_buffer: BytesIO, filename: str) -> str:
    """Save PDF buffer to file and return the file path"""
    # Create reports directory if it doesn't exist
    reports_dir = "reports"
    os.makedirs(reports_dir, exist_ok=True)
    
    file_path = os.path.join(reports_dir, filename)
    
    with open(file_path, 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    return file_path
