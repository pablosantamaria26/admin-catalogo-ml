/* ═══════════════════════════════════════════════════════════════════
   PROCESO PRINCIPAL — ventana dedicada sobre el panel admin.

   Esta app NO tiene lógica propia: es una ventana de Electron que carga
   el mismo panel que se ve en el celular (GitHub Pages), para poder
   usarlo en la PC sin depender de una pestaña del navegador. Como
   consecuencia, actualizar el contenido/reglas/lógica del panel NO
   requiere una nueva versión de este .exe — alcanza con publicar el
   cambio en docs/ (ver README). El auto-update de acá abajo es solo
   para cambios del "marco" (tamaño de ventana, ícono, menú, etc.), que
   en la práctica van a ser raros.
   ═══════════════════════════════════════════════════════════════════ */
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Log a archivo desde el arranque mismo — un exe empaquetado "windows" no
// tiene consola, así que console.error se pierde en la nada. Si la ventana
// no llega a abrirse, este archivo es la única forma de saber por qué.
const LOG_PATH = path.join(app.getPath('userData'), 'arranque.log');
function log(msg) {
  try { fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) {}
}
process.on('uncaughtException', (err) => log('uncaughtException: ' + (err && err.stack || err)));
process.on('unhandledRejection', (reason) => log('unhandledRejection: ' + (reason && reason.stack || reason)));
log(`arranque — versión ${app.getVersion()}, packaged=${app.isPackaged}`);

const { autoUpdater } = require('electron-updater');

const PANEL_URL = process.env.ADMIN_CATALOGO_URL || 'https://pablosantamaria26.github.io/admin-catalogo-ml/';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Actualización lista',
    message: 'Hay una versión nueva de Admin Catálogo ya descargada.',
    detail: '¿Reiniciar ahora para instalarla, o lo hace sola al cerrar la app?',
    buttons: ['Reiniciar ahora', 'Más tarde'],
    defaultId: 0,
    cancelId: 1,
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});
autoUpdater.on('error', (err) => {
  console.error('autoUpdater:', err == null ? 'error' : (err.stack || err).toString());
});

function crearVentana() {
  log('crearVentana()');
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#0B2E33',
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox:true rompe el renderer acá: la página registra un Service
      // Worker con Cache Storage (necesario para el auto-update de docs/),
      // y en esta versión de Electron el renderer sandboxeado manda un
      // mensaje Mojo inválido a blink.mojom.CacheStorage que el proceso
      // browser rechaza — mata el renderer al toque, la ventana ni llega a
      // pintar nada. contextIsolation + nodeIntegration:false ya alcanzan
      // como aislamiento (no hay preload ni IPC propio en esta app).
      sandbox: false,
    },
  });
  log('BrowserWindow creada');
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => { require('electron').shell.openExternal(url); return { action: 'deny' }; });

  const cargar = () => {
    log('cargando ' + PANEL_URL);
    win.loadURL(PANEL_URL).then(() => log('loadURL ok')).catch((err) => {
      log('loadURL falló: ' + (err && err.message));
      win.loadURL(`data:text/html,${encodeURIComponent(
        '<body style="font-family:sans-serif;background:#0B2E33;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>Sin conexión</h2><p>No se pudo cargar el panel. Revisá tu internet y reintentá.</p></div></body>'
      )}`);
    });
  };
  cargar();

  win.webContents.on('did-fail-load', (_e, code, desc) => { log(`did-fail-load: ${code} ${desc}`); setTimeout(cargar, 3000); });
  win.webContents.on('render-process-gone', (_e, details) => log('render-process-gone: ' + JSON.stringify(details)));
  win.on('unresponsive', () => log('ventana no responde'));
  win.on('closed', () => log('ventana cerrada'));
}

app.on('render-process-gone', (_e, _wc, details) => log('app render-process-gone: ' + JSON.stringify(details)));
app.on('child-process-gone', (_e, details) => log('child-process-gone: ' + JSON.stringify(details)));

app.whenReady().then(() => {
  log('app.whenReady');
  crearVentana();
  if (app.isPackaged) {
    autoUpdater.checkForUpdates().then(() => log('checkForUpdates ok')).catch((err) => log('checkForUpdates falló: ' + (err && err.message)));
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
}).catch((err) => log('whenReady rechazado: ' + (err && err.stack || err)));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
