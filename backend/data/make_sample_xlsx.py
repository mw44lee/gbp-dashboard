"""One-off generator for seed-gbp-urls.sample.xlsx.

Not part of the app's runtime — this just produces the dummy Excel file that
stands in for what the future GBP-scraping AI agent will eventually output.
Run once: `python make_sample_xlsx.py`.
"""
import json
from pathlib import Path
from openpyxl import Workbook

here = Path(__file__).parent
stores = json.loads((here / "seed-dummy.json").read_text(encoding="utf-8"))["stores"]

wb = Workbook()
ws = wb.active
ws.title = "gbp_urls"
ws.append(["store_name", "region", "country", "gbp_url", "category"])
for s in stores:
    ws.append([s["name"], s["region"], s["country"], s["gbpUrl"], s["category"]])

out = here / "seed-gbp-urls.sample.xlsx"
wb.save(out)
print(f"wrote {out}")
