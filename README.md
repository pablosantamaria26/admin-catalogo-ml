# Admin Catálogo — Mercado Limpio

Panel para administrar precios del catálogo (`catalogo_visual_productos` en
Supabase) que también usa la app de pedidos de los vendedores. Un solo
panel (`docs/index.html`), dos formas de abrirlo:

- **Celular / cualquier navegador**: https://pablosantamaria26.github.io/admin-catalogo-ml/
  — instalable como PWA ("Agregar a pantalla de inicio" en iPhone).
- **PC**: app de escritorio (`desktop/`), instalador `.exe` publicado como
  Release de este mismo repo.

## Cómo actualizar el panel (precios, reglas, lo que sea del día a día)

El `.exe` de escritorio **no tiene lógica propia** — es una ventana que
carga la URL de GitHub Pages de arriba. Por eso, para el 99% de los
cambios (nueva marca, ajuste de fórmula, un fix visual, una función
nueva del importador) alcanza con:

```bash
git add docs/
git commit -m "..."
git push
```

GitHub Pages se actualiza solo en 1-2 minutos. La próxima vez que se abra
el panel (en el celular o en la PC), ya está actualizado — no hace falta
reinstalar nada.

**Importante**: si el cambio toca cualquier archivo de `docs/`, bumpear el
número de versión en `docs/sw.js` (`const CACHE = "admin-catalogo-ml-vN"`)
como parte del mismo commit. El Service Worker cachea el shell y el
navegador solo nota que hay una versión nueva cuando `sw.js` cambia byte a
byte — si no se bumpea, el cambio puede tardar en llegar incluso con
recarga forzada.

## Cuándo hace falta tocar el `.exe`

Solo si cambia algo del "marco" en sí: tamaño de ventana por defecto,
ícono, menú, comportamiento nativo (`desktop/src/main.js`). Para eso:

```bash
cd desktop
npm install        # solo la primera vez
npm start           # probar en modo desarrollo (no correr desde una
                     # terminal de agente/IDE con ELECTRON_RUN_AS_NODE=1
                     # fijado — Electron arranca como Node puro y no
                     # abre ventana; usar una PowerShell normal)
```

Publicar una actualización del `.exe` (sube la versión en `package.json`
primero, siempre):

```bash
npm run release
```

Compila el instalador y lo sube como Release a este repo — de ahí en más,
todas las PCs con el `.exe` instalado lo detectan solas al abrir la app,
lo descargan en segundo plano y preguntan si reiniciar ya o más tarde.

Al no estar firmado digitalmente, Windows/Defender puede mostrar el aviso
de SmartScreen la primera vez ("Más información" → "Ejecutar de todas
formas").

## Estructura

```
docs/           ← el panel en sí (servido por GitHub Pages)
  index.html
  manifest.json
  sw.js
  icon-192.png, icon-512.png
desktop/        ← wrapper de Electron (ventana + auto-update del marco)
  src/main.js
  package.json
```

PIN de acceso al panel: mismo que el resto de las apps de Mercado Limpio
(ver `docs/index.html`, constante `PIN`).
