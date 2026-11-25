const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1100, height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  ventana.loadFile('index.html');
}

ipcMain.handle('api:request', async (_evento, peticion) => {
  const { metodo, recurso, datos } = peticion;
  const permitidos = ['GET', 'POST', 'PUT', 'DELETE'];
  if (!permitidos.includes(metodo)) throw new Error('Metodo no permitido');
  if (!/^\/(users|posts)(\/\d+)?(\?userId=\d+)?$/.test(recurso)) {
    throw new Error('Ruta no permitida');
  }
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (datos && ['POST', 'PUT'].includes(metodo)) {
    opciones.body = JSON.stringify(datos);
  }
  const respuesta = await fetch(BASE_URL + recurso, opciones);
  const texto = await respuesta.text();
  let contenido = null;
  if (texto) {
    try { contenido = JSON.parse(texto); }
    catch { contenido = texto; }
  }
  return { ok: respuesta.ok, estado: respuesta.status, contenido };
});

app.whenReady().then(() => {
  crearVentana();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});