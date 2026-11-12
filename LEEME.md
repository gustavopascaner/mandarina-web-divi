# Mandarina · rediseño web (WordPress + Divi)

Home nueva para mandarina.dev, con fondo oscuro, el naranja de la marca (#FF7300) y la rodaja de mandarina del logo hecha en 3D interactivo (Three.js).

## Qué hay en esta carpeta

Hay tres páginas con el mismo diseño:
- **Home** (`index.html`): la web institucional completa.
- **Landing** (`landing.html`): primero el video, después la agenda, después toda la info y al final la agenda de nuevo.
- **Gracias** (`gracias.html`, para /gracias-laboratorios/): confirma la llamada, muestra el video "Demo laboratorios" para ver antes de la llamada, el video "Qué hacemos en Mandarina" en servicios, toda la info y contacto por WhatsApp. Lleva `noindex` para que Google no la muestre.

| Archivo | Para qué sirve |
|---|---|
| `divi/mandarina-home-divi.json` | Home lista para importar en Divi (todo adentro: fuentes, CSS, scripts e imágenes) |
| `divi/mandarina-landing-divi.json` | Landing lista para importar en Divi |
| `divi/mandarina-gracias-divi.json` | Página de gracias lista para importar en Divi |
| `divi/*-todo-en-un-modulo.html` | Lo mismo, para pegar en un solo módulo Código |
| `divi/_prueba-*.html` | Vistas locales que imitan cómo lo arma Divi |
| `index.html` + `assets/` | Fuente de todo |
| `tools/build_landing.py` / `tools/build_gracias.py` | Arman `landing.html` y `gracias.html` con las secciones de `index.html` |
| `tools/build_divi.py` | Regenera la carpeta `divi/` |

Después de cambiar algo en `index.html` o en `assets/`, corré:

```
python3 tools/build_landing.py
python3 tools/build_gracias.py
python3 tools/build_divi.py
```

## Cómo cargarla en Divi

1. Creá una página nueva (o editá la home) → **Atributos de página → Plantilla → Página en blanco** (Blank Page), así no aparecen el header y el footer viejos.
2. Abrí el Divi Builder → ícono de **Portabilidad** (flechas arriba/abajo) → **Importar** → `mandarina-home-divi.json` (o `mandarina-landing-divi.json` para la landing). Guardá.

En la página de gracias, el `noindex` va dentro del HTML del prototipo; en WordPress marcalo también desde tu plugin de SEO (Yoast / Rank Math → "No indexar").

Listo: no hay que tocar Opciones del tema ni subir imágenes. El CSS va en la primera sección (header) y los scripts en la última (footer); no borres esas dos. Si usás Theme Builder con header/footer global, desactivalo para esta página.

Los scripts van codificados en base64 a propósito: WordPress a veces cambia `&&` por `&#038;&#038;` dentro de los módulos Código y rompe el JavaScript.

## Si usás caché u optimización (WP Rocket, LiteSpeed, Divi "Rendimiento")

Excluí de la minificación y del "retrasar JS" el script `type="module"` que trae `cdn.jsdelivr.net/npm/three@0.160.0`. Si no se excluye, la mandarina 3D puede no aparecer.

## Contenido

La agenda (reservar.misterrobot.net) solo se puede incrustar en mandarina.dev y misterrobot.net: en una vista local o en otro dominio aparece en blanco.

Textos tomados de mandarina.dev (laboratorios de análisis clínicos). WhatsApp de los CTA: +54 9 3755 621875. Para cambiar un texto: editás `index.html`, corrés `python3 tools/build_divi.py` y volvés a importar, o lo cambiás directo en el módulo Código de esa sección en Divi.
