"""Adapter: normalizes the Samsung Experience Store master directory
(Korean headers, vendor-specific shape) into the column contract
POST /api/import/gbp-urls expects (English snake_case).

A source file almost never matches your internal schema exactly, so this is
the one place that knows the source's column names. Usage:
  python convert_real_dataset.py [input.xlsx]
Defaults to Samsung_Experience_Store_Global_Directory_Expanded.xlsx next to
this script. The store sheet is found by its header row (contains 매장명),
so a summary tab alongside it is ignored.
"""
import re
import sys
from pathlib import Path
from openpyxl import Workbook, load_workbook

here = Path(__file__).parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else here / "Samsung_Experience_Store_Global_Directory_Expanded.xlsx"

wb_in = load_workbook(src, data_only=True)
ws_in = next(
    (ws for ws in wb_in if any(c.value == "매장명" for c in ws[1])),
    None,
)
if ws_in is None:
    sys.exit(f"No sheet with a 매장명 header row found in {src}")

rows = list(ws_in.iter_rows(min_row=2, values_only=True))  # skip header

def clean(v):
    # "-" is the source's "no value"; "#ERROR!" etc. are spreadsheet formula
    # failures (e.g. a phone number starting with "+") — neither is real data.
    if v is None:
        return None
    s = str(v).strip()
    return None if s in ("", "-") or s.startswith("#") and s.endswith("!") else s

def country_code(country_raw):
    m = re.search(r"\(([A-Za-z]{2,3})\)", country_raw or "")
    return m.group(1) if m else None

wb_out = Workbook()
ws_out = wb_out.active
ws_out.title = "gbp_urls"
ws_out.append([
    "store_name", "region", "country", "gbp_url", "category",
    "region_group", "country_code", "address", "phone",
    "operating_status", "website_url", "rating", "review_count",
])

for row in rows:
    (_no, region_group, country, city, store_name, address, phone,
     rating, review_count, status, maps_url, website_url) = row
    if not store_name or not maps_url:
        continue
    ws_out.append([
        store_name,
        city,
        country,
        maps_url,
        "Samsung Experience Store",
        region_group,
        country_code(country),
        address,
        clean(phone),
        status,
        clean(website_url),
        rating,
        int(review_count) if review_count is not None else None,
    ])

out = here / "gbp-urls.real.xlsx"
wb_out.save(out)
print(f"wrote {out} ({ws_out.max_row - 1} stores) from {src.name} / sheet '{ws_in.title}'")
