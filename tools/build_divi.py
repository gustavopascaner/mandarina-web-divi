"""Genera el paquete para WordPress + Divi a partir de index.html, landing.html y assets/.
Uso: python3 tools/build_divi.py   (desde la carpeta Web)
"""
import base64, json, re
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
OUT = WEB / "divi"
OUT.mkdir(exist_ok=True)

css = (WEB / "assets/css/mandarina.css").read_text()
ui_js = (WEB / "assets/js/mandarina-ui.js").read_text()
gl_js = (WEB / "assets/js/mandarina-3d.js").read_text()

# Imágenes embebidas: no hay que subir nada a la biblioteca de medios
def data_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode((WEB / path).read_bytes()).decode()

IMAGES = {
    "assets/img/logo-mandarina-horizontal.png": data_uri("assets/img/logo-mandarina-horizontal.png", "image/png"),
    "assets/img/isotipo.svg": data_uri("assets/img/isotipo.svg", "image/svg+xml"),
}

def fix_assets(s):
    for k, v in IMAGES.items():
        s = s.replace(k, v)
    return s

def compact(s):
    # sin líneas vacías: Divi a veces mete <p> en los saltos dobles
    return "\n".join(l.rstrip() for l in s.splitlines() if l.strip())

# Los JS van en base64: WordPress a veces convierte "&&" en "&#038;&#038;" dentro de los
# módulos Código y rompe el script. Así llegan intactos.
def b64(code):
    return base64.b64encode(code.encode()).decode()

def decoder(var):
    return f"new TextDecoder().decode(Uint8Array.from(atob({var}),function(c){{return c.charCodeAt(0)}}))"

SCRIPTS = (
    "<script>(function(){var ui='" + b64(ui_js) + "',gl='" + b64(gl_js) + "';"
    "var s=document.createElement('script');s.text=" + decoder("ui") + ";document.body.appendChild(s);"
    "var m=document.createElement('script');m.type='module';m.text=" + decoder("gl") + ";document.body.appendChild(m);"
    "})();</script>"
)
STYLE = "<style>\n" + css + "\n</style>"

def build(page, slug):
    html = (WEB / page).read_text()
    head = re.search(r"<!-- DIVI-HEAD -->(.*?)<!-- /DIVI-HEAD -->", html, re.S).group(1).strip()
    sections = re.findall(r"<!-- DIVI:([\w-]+) -->(.*?)<!-- /DIVI:\1 -->", html, re.S)

    blocks = []
    for name, body in sections:
        body = compact(fix_assets(body))
        if name == "header":
            body = head + "\n" + STYLE + "\n" + body
        if name == "footer":
            body = body + "\n" + SCRIPTS
        blocks.append((name, body))

    # 1) Layout importable de Divi: trae todo (fuentes, CSS, HTML y JS)
    def divi_code(s):
        s = s.replace("[", "&#91;").replace("]", "&#93;")
        return s.replace("\n", "<!-- [et_pb_line_break_holder] -->")

    ZERO = 'custom_padding="0px|0px|0px|0px|false|false" custom_margin="0px|0px|0px|0px|false|false"'
    shortcodes = []
    for name, body in blocks:
        shortcodes.append(
            f'[et_pb_section fb_built="1" admin_label="{name}" _builder_version="4.27.4" background_color="#0b0806" {ZERO}]'
            f'[et_pb_row admin_label="{name}" width="100%" max_width="100%" module_class="mnd-row" _builder_version="4.27.4" {ZERO}]'
            f'[et_pb_column type="4_4" _builder_version="4.27.4"]'
            f'[et_pb_code admin_label="{name}" _builder_version="4.27.4"]{divi_code(body)}[/et_pb_code]'
            f'[/et_pb_column][/et_pb_row][/et_pb_section]'
        )
    layout = {"context": "et_builder", "data": {"1": "".join(shortcodes)},
              "presets": [], "global_colors": [], "images": [], "thumbnails": []}
    (OUT / f"{slug}-divi.json").write_text(json.dumps(layout, ensure_ascii=False))

    # 2) Alternativa: lo mismo en un solo bloque para pegar en un módulo Código
    allinone = "\n".join(b for _, b in blocks)
    (OUT / f"{slug}-todo-en-un-modulo.html").write_text(allinone)

    # 3) Prueba local que imita la estructura de Divi
    (OUT / f"_prueba-{slug}.html").write_text(
        '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        '<style>body{margin:0}</style></head><body><div id="page-container"><div class="et_pb_section"><div class="et_pb_row"><div class="et_pb_code">'
        + allinone + "</div></div></div></div></body></html>"
    )

    print(slug, "→", ", ".join(n for n, _ in blocks))

for page, slug in (("index.html", "mandarina-home"), ("landing.html", "mandarina-landing"), ("gracias.html", "mandarina-gracias")):
    build(page, slug)

for old in ("todo-en-un-modulo-codigo.html", "_prueba-local.html"):
    (OUT / old).unlink(missing_ok=True)

for f in sorted(OUT.iterdir()):
    print(f"  {f.name:34s} {f.stat().st_size/1024:7.1f} KB")
