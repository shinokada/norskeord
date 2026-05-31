#!/usr/bin/env python3
"""Quick diagnostic: what does pdfplumber extract from the b1 PDFs?"""
import sys, os

try:
    import pdfplumber
except ImportError:
    print("pdfplumber not installed")
    sys.exit(1)

pdf_dir = os.path.join(os.path.dirname(__file__), '..', 'vocab', 'b1')
pdf_dir = os.path.abspath(pdf_dir)

for fname in sorted(os.listdir(pdf_dir)):
    if not fname.endswith('.pdf'):
        continue
    fpath = os.path.join(pdf_dir, fname)
    with pdfplumber.open(fpath) as pdf:
        print(f"\n=== {fname} ({len(pdf.pages)} pages) ===")
        for i, page in enumerate(pdf.pages[:2]):  # first 2 pages only
            text = page.extract_text()
            print(f"  Page {i+1}: {len(text) if text else 0} chars extracted")
            if text:
                print("  SAMPLE:", text[:300].replace('\n', ' | '))
            else:
                print("  (no text layer — likely scanned/image PDF)")
            # Also try words
            words = page.extract_words()
            print(f"  Words found: {len(words)}")
            if words:
                print("  First 5 words:", [w['text'] for w in words[:5]])
