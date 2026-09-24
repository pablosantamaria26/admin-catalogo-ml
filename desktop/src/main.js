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
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#0B2E33',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => { require('electron').shell.openExternal(url); return { action: 'deny' }; });

  const cargar = () => win.loadURL(PANEL_URL).catch(() => {
    win.loadURL(`data:text/html,${encodeURIComponent(
      '<body style="font-family:sans-serif;background:#0B2E33;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>Sin conexión</h2><p>No se pudo cargar el panel. Revisá tu internet y reintentá.</p></div></body>'
    )}`);
  });
  cargar();

  win.webContents.on('did-fail-load', () => setTimeout(cargar, 3000));
}

app.whenReady().then(() => {
  crearVentana();
  if (app.isPackaged) autoUpdater.checkForUpdates().catch(() => {});
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
