# Massachusetts Court Financial Statement Form Filler

## Overview
This application helps users fill out the Massachusetts Court Financial Statement form by extracting data from uploaded documents (pay stubs, tax returns, bank statements) using Google Gemini AI. The system automatically populates form fields and allows manual editing before generating the final filled PDF.

## Current State
- Multi-file document upload with AI-powered extraction
- 70+ form fields organized into 8 sections (case info, personal, employment, income, deductions, expenses, assets, signature)
- Real-time processing status and completion tracking
- AI chat assistant for clarifications
- PDF generation via Python/reportlab script

## Project Architecture

### Backend (server/)
- `routes.ts` - API endpoints for jobs, documents, messages, PDF generation
- `extraction.ts` - Gemini AI document extraction pipeline
- `pdfGenerator.ts` - Node.js wrapper for Python PDF script
- `fill_form.py` - Python script using reportlab to fill PDF forms
- `storage.ts` - Database storage interface

### Frontend (client/src/)
- `pages/home.tsx` - Job list and creation
- `pages/job.tsx` - Document upload, form editing, chat interface
- Uses Shadcn UI components with accordion-based form sections

### Shared (shared/)
- `schema.ts` - Drizzle database schema for jobs, documents, messages
- `formSchema.ts` - Financial statement form field definitions with PDF coordinates
- `routes.ts` - API route definitions and Zod schemas

## Important Files
- `attached_assets/fields_1766789225454.json` - Original form field coordinates
- `attached_assets/Financial_statement_TEMPLATE.pdf` - **Required** blank PDF template (must be added)

## Setup Requirements
1. Database is auto-configured via Replit PostgreSQL
2. Gemini AI is configured via Replit AI integrations
3. Object storage is configured for file uploads
4. **PDF Template**: Upload the Massachusetts Court Financial Statement blank PDF as `attached_assets/Financial_statement_TEMPLATE.pdf`

## User Preferences
- None recorded yet

## Recent Changes
- Dec 26, 2025: Converted from generic document extraction to specific financial statement form filler
- Added Python PDF filling integration
- Created form schema with 70+ fields and PDF coordinates
- Added accordion-based form UI with completion tracking
