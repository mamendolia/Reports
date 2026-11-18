#!/usr/bin/env python3
"""Build the single-file offline report tool.

Concatenates src/ and inlines the vendored libraries into
dist/knowbe4-training-report.html. No network access, no dependencies
beyond the Python standard library.

Usage:  python3 build.py
"""
from pathlib import Path

VERSION = "1.0.0"
ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
JS = SRC / "js"
OUT = ROOT / "dist" / "knowbe4-training-report.html"

VENDOR = {
    "/*__SHEETJS__*/": ("xlsx-0.18.5.full.min.js", "SheetJS Community Edition 0.18.5 - Apache-2.0"),
    "/*__EXCELJS__*/": ("exceljs-4.4.0.min.js", "ExcelJS 4.4.0 - MIT"),
}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> None:
    app = read(JS / "04-app.js")
    app = app.replace("/*__QUALITY__*/", read(JS / "quality.inc.js"))
    app = app.replace("/*__SAMPLE__*/", read(JS / "sample-data.inc.js"))

    script = "\n".join([
        "<script>", "(function(){", '"use strict";',
        read(JS / "01-parse.js"), read(JS / "02-plan.js"), read(JS / "03-excel-report.js"), app,
        "})();", "</script>", "</body>", "</html>", "",
    ])
    html = read(SRC / "head.html") + "\n</head>\n" + read(SRC / "body.html").replace("__VERSION__", VERSION) + script

    for marker, (fname, credit) in VENDOR.items():
        assert html.count(marker) == 1, f"marker {marker} missing or duplicated"
        lib = read(ROOT / "vendor" / fname).replace("</script", "<\\/script")
        html = html.replace(marker, f"/* {credit} - inlined for offline use */\n{lib}")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"built {OUT.relative_to(ROOT)} v{VERSION} ({OUT.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
