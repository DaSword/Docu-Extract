import io
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pypdf import PdfReader, PdfWriter

def create_overlay(data, schema):
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Group fields by page from the new schema
    pages = {}
    for field in schema["fields"]:
        page_idx = field["pdf_mapping"]["page"]
        if page_idx not in pages:
            pages[page_idx] = []
        pages[page_idx].append(field)

    # Iterate through pages
    if not pages:
        return packet
        
    max_page = max(pages.keys())
    
    for i in range(max_page + 1):
        if i in pages:
            for field in pages[i]:
                key = field["id"]
                if key in data:
                    # Draw the text
                    # Use a small font
                    can.setFont("Helvetica", 10)
                    
                    mapping = field["pdf_mapping"]
                    x = mapping["x"]
                    y = mapping["y"]
                    
                    # Handle Checkboxes
                    if field.get("type") == "checkbox":
                        val = str(data[key]).lower()
                        if val in ["true", "yes", "1", "x", "checked"]:
                            can.drawString(x, y, "X")
                    else:
                        # x, y are already in reportlab coordinates
                        if mapping.get("align") == "center":
                            can.drawCentredString(x, y, str(data[key]))
                        else:
                            can.drawString(x, y, str(data[key]))
        
        can.showPage()
    
    can.save()
    packet.seek(0)
    return packet

def fill_pdf(original_pdf_path, output_pdf_path, data, schema_path):
    # Load schema
    with open(schema_path, "r") as f:
        schema = json.load(f)
        
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
    print(f"Created {output_pdf_path}")

if __name__ == "__main__":
    # Load schema to generate sample data keys
    with open("form_schema.json", "r") as f:
        schema = json.load(f)
    
    # Generate sample data with empty strings for all keys
    sample_data = {}
    print("Available Keys:")
    for field in schema["fields"]:
        sample_data[field["id"]] = field['description']
        if field.get("type") == "checkbox":
            sample_data[field["id"]] = "yes"
            
    original_pdf = "Financial statement TEMPLATE.pdf"
    output_pdf = "Financial_statement_filled.pdf"
    
    fill_pdf(original_pdf, output_pdf, sample_data, "form_schema.json")
