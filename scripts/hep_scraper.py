#!/usr/bin/env python3
"""
HEP Scraper za nestanke struje - Elektra Zadar
"""
import re, os, json
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
from urllib.error import URLError

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://yxfaovaigwdbziewnppx.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def fetch_hep_page(date_str):
    url = f"https://www.hep.hr/ods/bez-struje/19?dp=zadar&el=ZD&datum={date_str}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urlopen(req, timeout=10) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except URLError as e:
        print(f"  Greška: {e}")
        return None

def parse_outages(html, date_iso):
    outages = []
    blocks = re.split(r'<hr>', html)
    for block in blocks:
        mjesto = re.search(r'class="grad"><strong>Mjesto:</strong>\s*(.+?)</div>', block)
        ulica = re.search(r'class="ulica"><strong>Ulica:</strong>\s*(.+?)</div>', block)
        kada = re.search(r'class="kada">(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})<', block)
        napomena = re.search(r'<strong>Napomena:</strong>\s*(.+?)</div>', block)
        if mjesto and ulica:
            area = f"{mjesto.group(1).strip()} — {ulica.group(1).strip()}"
            if napomena:
                area += f" ({napomena.group(1).strip()})"
            outages.append({
                "area": area,
                "outage_date": date_iso,
                "time_from": kada.group(1) if kada else None,
                "time_until": kada.group(2) if kada else None,
            })
    return outages

def supabase_request(method, path, data=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req, timeout=10) as resp:
            return resp.read().decode()
    except Exception as e:
        print(f"  Supabase greška: {e}")
        return None

def main():
    print(f"HEP Scraper - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    all_outages = []
    for i in range(7):
        date = datetime.now() + timedelta(days=i)
        date_str = date.strftime("%d.%m.%Y")
        date_iso = date.strftime("%Y-%m-%d")
        print(f"\n{date_str}")
        html = fetch_hep_page(date_str)
        if html:
            outages = parse_outages(html, date_iso)
            print(f"  {len(outages)} nestanaka")
            for o in outages:
                print(f"    - {o['area']} ({o.get('time_from','?')}-{o.get('time_until','?')})")
            all_outages.extend(outages)
    print(f"\nUkupno: {len(all_outages)} nestanaka")
    if SUPABASE_KEY:
        today = datetime.now().strftime("%Y-%m-%d")
        supabase_request("DELETE", f"power_outages?outage_date=gte.{today}")
        if all_outages:
            supabase_request("POST", "power_outages", all_outages)
            print(f"✅ Upisano {len(all_outages)} nestanaka!")
    else:
        print("⚠️  Testni mod - postavi SUPABASE_KEY za upis u bazu")

if __name__ == "__main__":
    main()
