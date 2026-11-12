"""Arma gracias.html (página de gracias para laboratorios) con las secciones de index.html.
Respeta los dos videos de la página original: "Demo laboratorios" arriba y "Qué hacemos en Mandarina" en servicios.
Uso: python3 tools/build_gracias.py   (desde la carpeta Web)
"""
import re
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
src = (WEB / "index.html").read_text()

def section(name):
    return re.search(rf"<!-- DIVI:{name} -->.*?<!-- /DIVI:{name} -->", src, re.S).group(0)

WA = "https://wa.me/5493755621875?text=Hola%20Mandarina%2C%20ya%20agend%C3%A9%20mi%20llamada"
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'

def video(yt, title, tag, extra_class="", eager=False):
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return f'''<div class="mnd-video-frame {extra_class}">
      <button class="mnd-video-play" data-yt="{yt}" aria-label="Reproducir video: {title}">
        <img src="https://i.ytimg.com/vi/{yt}/maxresdefault.jpg" alt="" width="1280" height="720" {load}>
        <span class="mnd-play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg></span>
        <span class="mnd-video-tag">{tag}</span>
      </button>
    </div>'''

header = section("header")
header = re.sub(r'<nav class="mnd-nav".*?</nav>', f'''<nav class="mnd-nav" aria-label="Principal">
        <a href="#demo">Demo</a>
        <a href="#servicios">Qué hacemos</a>
        <a href="#proceso">Proceso</a>
        <a href="#faq">Preguntas</a>
        <a class="mnd-btn" href="#contacto">Contactar un experto</a>
      </nav>''', header, flags=re.S)

hero = f'''<!-- DIVI:hero -->
<section class="mnd mnd-hero mnd-lp-hero mnd-thanks-hero" id="demo">
  <canvas data-mnd-3d="hero" data-layout="landing" aria-label="Rodaja de mandarina en 3D: hacé clic para desarmarla"></canvas>
  <div class="mnd-wrap">
    <span class="mnd-thanks-badge"><i aria-hidden="true">✓</i> ¡Gracias! Tu llamada quedó agendada</span>
    <h1>
      <span class="mnd-line"><span>Conocé nuestra solución</span></span>
      <span class="mnd-line"><span><em>por dentro.</em></span></span>
    </h1>
    <p class="mnd-lead"><strong>¡Miralo antes de la llamada!</strong> Así funciona Mandarina en un laboratorio de análisis clínicos.</p>
    {video("qwwl5jSdbkA", "Demo laboratorios", "Demo laboratorios", "mnd-lp-video", eager=True)}
    <div class="mnd-hero-cta">
      <a class="mnd-btn mnd-btn--ghost" href="#por-que">Seguí leyendo {DOWN}</a>
    </div>
  </div>
</section>
<!-- /DIVI:hero -->'''

intro = '''<!-- DIVI:intro -->
<section class="mnd mnd-section mnd-thanks-intro" id="por-que">
  <div class="mnd-wrap">
    <p class="mnd-statement" data-reveal>La IA dejó de ser el futuro. Es <em>lo básico del presente</em> de un laboratorio que crece.</p>
    <div class="mnd-statement-cols">
      <p data-reveal style="--d:.05s">Los laboratorios que la adoptan hoy ya están escalando su productividad, mejorando la atención al paciente, sus procesos y reduciendo costos.</p>
      <p data-reveal style="--d:.1s">En Mandarina implementamos soluciones de IA para laboratorios de análisis clínicos con foco en infraestructura robusta, integración fluida y resultados escalables.</p>
    </div>
  </div>
</section>
<!-- /DIVI:intro -->'''

# Servicios con el segundo video entre el título y las tarjetas
servicios = section("servicios").replace(
    '<div class="mnd-bento">',
    '<div class="mnd-services-video" data-reveal>\n      '
    + video("4WRMRwKr08g", "Qué hacemos en Mandarina", "Qué hacemos en Mandarina")
    + '\n    </div>\n\n    <div class="mnd-bento">', 1)

contacto = f'''<!-- DIVI:cta -->
<section class="mnd mnd-section mnd-cta" id="contacto">
  <div class="mnd-wrap">
    <div class="mnd-cta-box mnd-thanks-cta" data-reveal>
      <canvas data-mnd-bubbles aria-hidden="true"></canvas>
      <div class="mnd-cta-copy">
        <span class="mnd-eyebrow" style="color:#ffd9b8">Contactá a un experto</span>
        <h2>¿Listo para empezar tu proyecto de IA en tu <em style="color:var(--mnd-amber)">laboratorio</em>?</h2>
        <p class="mnd-lead">Te acompañamos en todo el proceso: diagnóstico, implementación y soporte. Si querés adelantarnos algo antes de la llamada o necesitás cambiar el horario, escribinos.</p>
        <div class="mnd-hero-cta" style="margin-top:34px">
          <a class="mnd-btn" href="{WA}" target="_blank" rel="noopener">Escribinos por WhatsApp {ARROW}</a>
        </div>
      </div>
    </div>
  </div>
</section>
<!-- /DIVI:cta -->'''

info = "\n\n".join(section(n) for n in ["proceso", "beneficios", "integraciones", "a-medida", "faq"])
page = src[: src.index("<!-- DIVI:header -->")] + "\n\n".join(
    [header, hero, intro, servicios, info, contacto, section("footer")]
) + "\n\n" + src[src.index("<!-- DIVI-SCRIPTS -->"):]
# en esta página ya agendaron: los CTA internos llevan al contacto
page = page.replace('href="#agendar"', 'href="#contacto"').replace('#contacto">Agendar llamada</a></li>', '#contacto">Contacto</a></li>')
page = page.replace("<title>Mandarina | Infraestructura de IA para laboratorios</title>",
                    '<title>Mandarina | ¡Gracias! Mirá la demo antes de la llamada</title>\n<meta name="robots" content="noindex">')

(WEB / "gracias.html").write_text(page)
print("gracias.html lista")
