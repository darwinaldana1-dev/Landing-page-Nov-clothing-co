/* =============================================================================
   Copia data/content.json dentro de index.html, entre los marcadores
   CONTENT:START / CONTENT:END.

   Sirve como respaldo para cuando la página se abre con doble clic (file://),
   porque ahí el navegador bloquea fetch y no puede leer el .json.
   La fuente sigue siendo data/content.json: se edita ese archivo y se ejecuta

       node tools/sync-content.js

   Uso: node tools/sync-content.js [--check]
        --check no escribe nada; sale con código 1 si la copia está desfasada.
   ============================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'data', 'content.json');
const htmlPath = path.join(root, 'index.html');

const START = '<!-- CONTENT:START -->';
const END = '<!-- CONTENT:END -->';

const raw = fs.readFileSync(jsonPath, 'utf8');
JSON.parse(raw); // falla temprano si el JSON tiene un error de sintaxis

const html = fs.readFileSync(htmlPath, 'utf8');
const from = html.indexOf(START);
const to = html.indexOf(END);

if (from === -1 || to === -1) {
  console.error('index.html no tiene los marcadores ' + START + ' / ' + END);
  process.exit(1);
}

// Se indenta el JSON para que el HTML siga legible y se neutraliza cualquier
// "</script>" que pudiera aparecer dentro de un texto del contenido.
const block =
  START + '\n' +
  '<script type="application/json" id="content-fallback">\n' +
  raw.trim().replace(/<\//g, '<\\/') + '\n' +
  '</script>\n' +
  END;

const next = html.slice(0, from) + block + html.slice(to + END.length);

if (next === html) {
  console.log('Sin cambios: la copia incrustada ya está al día.');
  process.exit(0);
}

if (process.argv.includes('--check')) {
  console.error('La copia incrustada en index.html está desfasada. Ejecuta: node tools/sync-content.js');
  process.exit(1);
}

fs.writeFileSync(htmlPath, next);
console.log('index.html actualizado con ' + raw.trim().length + ' bytes de contenido.');
