#!/usr/bin/env python3
import io
import json
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter

def create_overlay(data, schema):
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    pages = {}
    for field in schema["fields"]:
        page_idx = field["pdfMapping"]["page"]
        if page_idx not in pages:
            pages[page_idx] = []
        pages[page_idx].append(field)

    if not pages:
        return packet
        
    max_page = max(pages.keys())
    
    for i in range(max_page + 1):
        if i in pages:
            for field in pages[i]:
                key = field["id"]
                if key in data and data[key]:
                    can.setFont("Helvetica", 9)
                    
                    mapping = field["pdfMapping"]
                    x = mapping["x"]
                    y = mapping["y"]
                    
                    if field.get("type") == "checkbox":
                        val = str(data[key]).lower()
                        if val in ["true", "yes", "1", "x", "checked"]:
                            can.drawString(x, y, "X")
                    else:
                        if mapping.get("align") == "center":
                            can.drawCentredString(x, y, str(data[key]))
                        else:
                            can.drawString(x, y, str(data[key]))
        
        can.showPage()
    
    can.save()
    packet.seek(0)
    return packet

def fill_pdf(original_pdf_path, output_pdf_path, data, schema):
    existing_pdf = PdfReader(open(original_pdf_path, "rb"))
    output = PdfWriter()
    
    overlay_packet = create_overlay(data, schema)
    overlay_pdf = PdfReader(overlay_packet)
    
    for i in range(len(existing_pdf.pages)):
        page = existing_pdf.pages[i]
        if i < len(overlay_pdf.pages):
            page.merge_page(overlay_pdf.pages[i])
        output.add_page(page)
        
    with open(output_pdf_path, "wb") as outputStream:
        output.write(outputStream)
    
    return output_pdf_path

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python fill_form.py <template_pdf> <output_pdf> <data_json>", file=sys.stderr)
        sys.exit(1)
    
    template_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    data_json = sys.argv[3]
    
    with open(data_json, "r") as f:
        input_data = json.load(f)
    
    data = input_data.get("data", {})
    schema = input_data.get("schema", {})
    
    result = fill_pdf(template_pdf, output_pdf, data, schema)
    print(json.dumps({"success": True, "outputPath": result}))
