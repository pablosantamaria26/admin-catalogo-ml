/* Convierte docs/icon-192.png (mismo logo circular "Mercado Limpio" que ya
   usa la PWA) a build/icon.ico para el instalador de Windows. Se corre
   solo (npm run icon / antes de npm run dist) — no hace falta un .ico
   a mano ni otra herramienta. */
const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

const ORIGEN = path.join(__dirname, '..', '..', 'docs', 'icon-192.png');
const DESTINO = path.join(__dirname, '..', 'build', 'icon.ico');

pngToIco(ORIGEN)
  .then(buf => {
    fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
    fs.writeFileSync(DESTINO, buf);
    console.log('✔ icon.ico generado desde', ORIGEN);
  })
  .catch(err => {
    console.error('✗ No se pudo generar el ícono:', err.message);
    process.exit(1);
  });
