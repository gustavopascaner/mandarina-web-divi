"""Arma landing.html reutilizando las secciones de index.html.
Orden: video → agenda → toda la info → agenda de nuevo.
Uso: python3 tools/build_landing.py   (desde la carpeta Web)
"""
import re
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
src = (WEB / "index.html").read_text()

def section(name):
    return re.search(rf"<!-- DIVI:{name} -->.*?<!-- /DIVI:{name} -->", src, re.S).group(0)

BOOKING = '<iframe src="https://reservar.misterrobot.net/book/llamada-descubrimiento-mandarina-ia" title="Llamada descubrimiento Mandarina - IA" style="width:100%;height:620px;border:0" loading="lazy"></iframe>'
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'

header = section("header")
header = re.sub(r'<nav class="mnd-nav".*?</nav>', '''<nav class="mnd-nav" aria-label="Principal">
        <a href="#video">Video</a>
        <a href="#servicios">Qué hacemos</a>
        <a href="#proceso">Proceso</a>
        <a href="#faq">Preguntas</a>
        <a class="mnd-btn" href="#agendar">Agendar demo</a>
      </nav>''', header, flags=re.S)

hero = f'''<!-- DIVI:hero -->
<section class="mnd mnd-hero mnd-lp-hero" id="video">
  <canvas data-mnd-3d="hero" data-layout="landing" aria-label="Rodaja de mandarina en 3D: hacé clic para desarmarla"></canvas>
  <div class="mnd-wrap">
    <span class="mnd-eyebrow">Paso 1 · 2 minutos</span>
    <h1>
      <span class="mnd-line"><span>Mirá el <em>video</em>,</span></span>
      <span class="mnd-line"><span>después agendá.</span></span>
    </h1>
    <p class="mnd-lead">Así atiende Mandarina el WhatsApp de un laboratorio de análisis clínicos: responde, agenda turnos y lee órdenes, solo.</p>
    <div class="mnd-video-frame mnd-lp-video">
      <button class="mnd-video-play" data-yt="lP2JSzbePko" aria-label="Reproducir video: Mandarina, automatización de WhatsApp para laboratorios de análisis clínicos">
        <img src="https://i.ytimg.com/vi/lP2JSzbePko/maxresdefault.jpg" alt="" width="1280" height="720" fetchpriority="high">
        <span class="mnd-play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg></span>
        <span class="mnd-video-tag">Automatización de WhatsApp para laboratorios</span>
      </button>
    </div>
    <div class="mnd-hero-cta">
      <a class="mnd-btn" href="#agendar">Ya lo vi, quiero agendar {DOWN}</a>
    </div>
  </div>
</section>
<!-- /DIVI:hero -->'''

agenda = f'''<!-- DIVI:agenda -->
<section class="mnd mnd-section mnd-cta mnd-lp-agenda" id="agendar">
  <div class="mnd-wrap">
    <div class="mnd-cta-box" data-reveal>
      <canvas data-mnd-bubbles aria-hidden="true"></canvas>
      <div class="mnd-cta-copy">
        <span class="mnd-eyebrow" style="color:#ffd9b8">Paso 2 · Cupo limitado</span>
        <h2>Agendá tu <em style="color:var(--mnd-amber)">demo.</em></h2>
        <p class="mnd-lead">Una llamada de descubrimiento: vemos cómo trabaja tu laboratorio y te mostramos la IA funcionando con casos como los tuyos.</p>
        <ul class="mnd-cta-list">
          <li>Llamada sin costo</li>
          <li>Demo en vivo por WhatsApp</li>
          <li>Diagnóstico y propuesta a medida</li>
        </ul>
        <p class="mnd-cta-note">Solo tomamos 3 laboratorios nuevos por mes.</p>
      </div>
      <div class="mnd-booking">
        {BOOKING}
      </div>
    </div>
  </div>
</section>
<!-- /DIVI:agenda -->'''

cta = section("cta").replace('id="agendar"', 'id="agendar-final"')
cta = cta.replace("Cupo limitado · 3 labs por mes", "Último paso")
cta = re.sub(r"<h2>.*?</h2>", '<h2>¿Lo hablamos? <em style="color:var(--mnd-amber)">Agendá</em> tu demo.</h2>', cta, flags=re.S)

info = "\n\n".join(section(n) for n in ["servicios", "proceso", "beneficios", "integraciones", "a-medida", "faq"])

page = src[: src.index("<!-- DIVI:header -->")] + "\n\n".join(
    [header, hero, agenda, info, cta, section("footer")]
) + "\n\n" + src[src.index("<!-- DIVI-SCRIPTS -->"):]
page = page.replace("<title>Mandarina | Infraestructura de IA para laboratorios</title>",
                    "<title>Mandarina | Mirá el video y agendá tu demo</title>")

(WEB / "landing.html").write_text(page)
print("landing.html lista")
