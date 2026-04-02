// =====================================================
// TUSUERTE.PE — Google Apps Script para recibir registros
// y consultar participantes para la ruleta
// =====================================================
// INSTRUCCIONES DE USO:
// 1. Abre tu Google Sheet en https://sheets.google.com
// 2. Ve a Extensiones → Apps Script
// 3. Borra todo el código existente y pega este código
// 4. Haz clic en "Guardar" (ícono del disco)
// 5. Haz clic en "Implementar" → "Nueva implementación"
// 6. Tipo: "Aplicación web"
// 7. Ejecutar como: "Yo"
// 8. Quién tiene acceso: "Cualquier usuario"
// 9. Haz clic en "Implementar" y copia la URL generada
// 10. Pega esa URL en el index.html donde dice PEGA_TU_URL_AQUI
// =====================================================
// IMPORTANTE: Si ya tenías una implementación anterior,
// debes crear una NUEVA implementación para que los
// cambios del doGet se apliquen.
// =====================================================

function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);
    var action = (datos.action || 'registro').toLowerCase();

    // Fecha y hora Lima (GMT-5)
    var ahora = new Date();
    var fechaLima = Utilities.formatDate(ahora, 'America/Lima', 'dd/MM/yyyy HH:mm:ss');

    // ── REGISTRAR GANADOR ──
    if (action === 'registrarganador') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ganadorSheet = ss.getSheetByName('Ganadores');
      if (!ganadorSheet) {
        ganadorSheet = ss.insertSheet('Ganadores');
        ganadorSheet.appendRow([
          'FECHA Y HORA',
          'SORTEO',
          'SORTEO ID',
          'NOMBRES',
          'APELLIDOS',
          'DNI',
          'CELULAR',
          'CORREO',
          'DISTRITO',
          'CODIGO'
        ]);
        var headerRange = ganadorSheet.getRange(1, 1, 1, 10);
        headerRange.setBackground('#1a0a2a');
        headerRange.setFontColor('#ffd700');
        headerRange.setFontWeight('bold');
      }

      // Buscar datos completos del ganador en la hoja de registros
      var regSheet = ss.getActiveSheet();
      var regData = regSheet.getDataRange().getValues();
      var celular = '', correo = '', distrito = '', codigo = '';
      var dniGanador = (datos.dni || '').trim();
      for (var i = 1; i < regData.length; i++) {
        if (String(regData[i][4] || '').trim() === dniGanador) {
          celular = String(regData[i][5] || '');
          correo = String(regData[i][6] || '');
          distrito = String(regData[i][7] || '');
          codigo = String(regData[i][9] || '');
          break;
        }
      }

      ganadorSheet.appendRow([
        fechaLima,
        datos.sorteo || '',
        datos.sorteoId || '',
        datos.nombres || '',
        datos.apellidos || '',
        datos.dni || '',
        celular,
        correo,
        distrito,
        codigo
      ]);

      // Marcar como ganador en la hoja de registros (columna K = "GANADOR")
      if (regSheet.getLastColumn() < 11) {
        regSheet.getRange(1, 11).setValue('GANADOR');
        regSheet.getRange(1, 11).setBackground('#0d0d1f');
        regSheet.getRange(1, 11).setFontColor('#ffd700');
        regSheet.getRange(1, 11).setFontWeight('bold');
      }
      for (var j = 1; j < regData.length; j++) {
        if (String(regData[j][4] || '').trim() === dniGanador) {
          regSheet.getRange(j + 1, 11).setValue('SI');
          regSheet.getRange(j + 1, 11).setBackground('#1a4a1a');
          regSheet.getRange(j + 1, 11).setFontColor('#ffd700');
          regSheet.getRange(j + 1, 11).setFontWeight('bold');
          break;
        }
      }

      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', mensaje: 'Ganador registrado' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── REGISTRO NORMAL DE PARTICIPANTE ──
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'FECHA Y HORA',
        'SORTEO',
        'NOMBRES',
        'APELLIDOS',
        'DNI',
        'CELULAR',
        'CORREO',
        'DISTRITO',
        'TIKTOK',
        'CODIGO'
      ]);
      var headerRange = sheet.getRange(1, 1, 1, 10);
      headerRange.setBackground('#0d0d1f');
      headerRange.setFontColor('#ffe600');
      headerRange.setFontWeight('bold');
    }

    // Agregar la fila con los datos del registro
    sheet.appendRow([
      fechaLima,
      datos.sorteo || '',
      datos.nombres || '',
      datos.apellidos || '',
      datos.dni || '',
      datos.celular || '',
      datos.correo || '',
      datos.distrito || '',
      datos.tiktok || '',
      datos.codigo || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', mensaje: 'Registro guardado' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =====================================================
// doGet — Consultar participantes de un sorteo
// Uso: GET ?action=participantes&sorteo=Yape%20pa%20el%20Pollito
// Devuelve: { status:'ok', participantes: [{nombres, apellidos, dni}, ...] }
// =====================================================
function doGet(e) {
  try {
    var action = (e.parameter.action || '').toLowerCase();

    if (action === 'participantes') {
      var sorteoFiltro = (e.parameter.sorteo || '').trim();
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var participantes = [];

      // Columnas: 0=Fecha, 1=Sorteo, 2=Nombres, 3=Apellidos, 4=DNI, ...
      for (var i = 1; i < data.length; i++) {
        var sorteoCell = String(data[i][1] || '').trim();
        // Buscar coincidencia parcial (el nombre del sorteo puede variar ligeramente)
        if (sorteoFiltro && sorteoCell.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) === -1) {
          continue;
        }
        participantes.push({
          nombres: String(data[i][2] || '').trim(),
          apellidos: String(data[i][3] || '').trim(),
          dni: String(data[i][4] || '').trim()
        });
      }

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          total: participantes.length,
          participantes: participantes
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ══════════════════════════════════════════════════════════════
    // ── SELECCIONAR GANADOR (server-side) ──
    // Si ya existe un ganador para este sorteo, lo devuelve.
    // Si no existe, selecciona uno al azar, lo guarda y lo devuelve.
    // Esto garantiza que TODOS los dispositivos vean el MISMO ganador.
    // Uso: GET ?action=seleccionarganador&sorteo=NOMBRE&sorteoId=ID
    // ══════════════════════════════════════════════════════════════
    if (action === 'seleccionarganador') {
      var sorteoFiltro = (e.parameter.sorteo || '').trim();
      var sorteoId = (e.parameter.sorteoId || '').trim();
      var ss = SpreadsheetApp.getActiveSpreadsheet();

      // 1) Verificar si ya hay un ganador registrado para este sorteo
      var ganadorSheet = ss.getSheetByName('Ganadores');
      if (ganadorSheet) {
        var gData = ganadorSheet.getDataRange().getValues();
        for (var gi = gData.length - 1; gi >= 1; gi--) {
          var gSorteoId = String(gData[gi][2] || '').trim();
          var gSorteo = String(gData[gi][1] || '').trim();
          if ((sorteoId && gSorteoId === sorteoId) ||
              (sorteoFiltro && gSorteo.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) !== -1)) {
            // Ya existe ganador — devolver el mismo
            return ContentService
              .createTextOutput(JSON.stringify({
                status: 'ok',
                yaExistia: true,
                ganador: {
                  nombres: String(gData[gi][3] || '').trim(),
                  apellidos: String(gData[gi][4] || '').trim(),
                  dni: String(gData[gi][5] || '').trim(),
                  sorteoId: gSorteoId,
                  sorteo: gSorteo
                }
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      // 2) No hay ganador aún — obtener participantes y elegir uno al azar
      var regSheet = ss.getActiveSheet();
      var regData = regSheet.getDataRange().getValues();
      var participantes = [];
      for (var pi = 1; pi < regData.length; pi++) {
        var sorteoCell = String(regData[pi][1] || '').trim();
        if (sorteoFiltro && sorteoCell.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) === -1) {
          continue;
        }
        participantes.push({
          nombres: String(regData[pi][2] || '').trim(),
          apellidos: String(regData[pi][3] || '').trim(),
          dni: String(regData[pi][4] || '').trim(),
          celular: String(regData[pi][5] || ''),
          correo: String(regData[pi][6] || ''),
          distrito: String(regData[pi][7] || ''),
          codigo: String(regData[pi][9] || '')
        });
      }

      if (participantes.length === 0) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'ok',
            ganador: null,
            mensaje: 'No hay participantes registrados para este sorteo'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // 3) Selección aleatoria SERVER-SIDE
      var idx = Math.floor(Math.random() * participantes.length);
      var ganador = participantes[idx];

      // 4) Guardar ganador en hoja Ganadores
      if (!ganadorSheet) {
        ganadorSheet = ss.insertSheet('Ganadores');
        ganadorSheet.appendRow([
          'FECHA Y HORA', 'SORTEO', 'SORTEO ID', 'NOMBRES', 'APELLIDOS',
          'DNI', 'CELULAR', 'CORREO', 'DISTRITO', 'CODIGO'
        ]);
        var headerRange = ganadorSheet.getRange(1, 1, 1, 10);
        headerRange.setBackground('#1a0a2a');
        headerRange.setFontColor('#ffd700');
        headerRange.setFontWeight('bold');
      }

      var ahora = new Date();
      var fechaLima = Utilities.formatDate(ahora, 'America/Lima', 'dd/MM/yyyy HH:mm:ss');
      ganadorSheet.appendRow([
        fechaLima,
        sorteoFiltro || '',
        sorteoId || '',
        ganador.nombres,
        ganador.apellidos,
        ganador.dni,
        ganador.celular || '',
        ganador.correo || '',
        ganador.distrito || '',
        ganador.codigo || ''
      ]);

      // 5) Marcar como ganador en hoja de registros (columna K)
      if (regSheet.getLastColumn() < 11) {
        regSheet.getRange(1, 11).setValue('GANADOR');
        regSheet.getRange(1, 11).setBackground('#0d0d1f');
        regSheet.getRange(1, 11).setFontColor('#ffd700');
        regSheet.getRange(1, 11).setFontWeight('bold');
      }
      var dniGanador = ganador.dni;
      for (var mj = 1; mj < regData.length; mj++) {
        if (String(regData[mj][4] || '').trim() === dniGanador) {
          regSheet.getRange(mj + 1, 11).setValue('SI');
          regSheet.getRange(mj + 1, 11).setBackground('#1a4a1a');
          regSheet.getRange(mj + 1, 11).setFontColor('#ffd700');
          regSheet.getRange(mj + 1, 11).setFontWeight('bold');
          break;
        }
      }

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          yaExistia: false,
          ganador: {
            nombres: ganador.nombres,
            apellidos: ganador.apellidos,
            dni: ganador.dni,
            sorteoId: sorteoId,
            sorteo: sorteoFiltro
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Obtener TODOS los ganadores (desde hoja Ganadores) ──
    // Lee directamente de la hoja Ganadores donde seleccionarGanador guarda los datos
    // Columnas Ganadores: 0=Fecha, 1=Sorteo, 2=SorteoId, 3=Nombres, 4=Apellidos, 5=DNI, 6=Celular, 7=Correo, 8=Distrito, 9=Codigo
    if (action === 'obtenertodosganadores') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ganadorSheet = ss.getSheetByName('Ganadores');
      var ganadores = [];
      if (ganadorSheet) {
        var data = ganadorSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          var nombres = String(data[i][3] || '').trim();
          var apellidos = String(data[i][4] || '').trim();
          if (!nombres && !apellidos) continue;
          ganadores.push({
            sorteo: String(data[i][1] || '').trim(),
            sorteoId: String(data[i][2] || '').trim(),
            nombres: nombres,
            apellidos: apellidos,
            dni: String(data[i][5] || '').trim(),
            fecha: String(data[i][0] || '').trim()
          });
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', ganadores: ganadores }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Obtener ganador de un sorteo (desde hoja Ganadores) ──
    // Columnas Ganadores: 0=Fecha, 1=Sorteo, 2=SorteoId, 3=Nombres, 4=Apellidos, 5=DNI, 6=Celular, 7=Correo, 8=Distrito, 9=Codigo
    if (action === 'obtenerganador') {
      var sorteoFiltro = (e.parameter.sorteo || '').trim();
      var sorteoIdParam = (e.parameter.sorteoId || '').trim();
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ganadorSheet = ss.getSheetByName('Ganadores');
      var ganadorEncontrado = null;
      if (ganadorSheet) {
        var data = ganadorSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          var gSorteoId = String(data[i][2] || '').trim();
          var gSorteo = String(data[i][1] || '').trim();
          var match = false;
          if (sorteoIdParam && gSorteoId === sorteoIdParam) match = true;
          if (!match && sorteoFiltro && gSorteo.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) !== -1) match = true;
          if (match) {
            ganadorEncontrado = {
              nombres: String(data[i][3] || '').trim(),
              apellidos: String(data[i][4] || '').trim(),
              dni: String(data[i][5] || '').trim(),
              sorteo: gSorteo,
              sorteoId: gSorteoId,
              fecha: String(data[i][0] || '').trim()
            };
            break;
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', ganador: ganadorEncontrado }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Verificar si un DNI ya está registrado en un sorteo ──
    if (action === 'verificardni') {
      var dni = (e.parameter.dni || '').trim();
      var sorteoCheck = (e.parameter.sorteo || '').trim();
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var yaRegistrado = false;

      for (var i = 1; i < data.length; i++) {
        var dniCell = String(data[i][4] || '').trim();
        var sorteoCell = String(data[i][1] || '').trim();
        if (dni && dniCell === dni && sorteoCheck && sorteoCell.toLowerCase().indexOf(sorteoCheck.toLowerCase()) !== -1) {
          yaRegistrado = true;
          break;
        }
      }

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          yaRegistrado: yaRegistrado
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Liberar: el admin marca timestamp para que todos puedan registrarse de nuevo ──
    if (action === 'liberar') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var configSheet = ss.getSheetByName('Config');
      if (!configSheet) {
        configSheet = ss.insertSheet('Config');
        configSheet.getRange('A1').setValue('LIBERACION_TIMESTAMP');
        configSheet.getRange('A1').setFontWeight('bold');
      }
      var ahora = new Date().toISOString();
      configSheet.getRange('A2').setValue(ahora);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', liberado: ahora }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Consultar último timestamp de liberación ──
    if (action === 'checklib') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var configSheet = ss.getSheetByName('Config');
      var timestamp = '';
      if (configSheet) {
        timestamp = String(configSheet.getRange('A2').getValue() || '');
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', liberacion: timestamp }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Action no reconocida
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        mensaje: 'Action no reconocida. Usa ?action=participantes&sorteo=NOMBRE'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Función de prueba (opcional) — puedes ejecutarla manualmente para verificar
function probarScript() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  Logger.log('Hoja activa: ' + sheet.getName());
  Logger.log('Total filas: ' + sheet.getLastRow());
  Logger.log('Script funcionando correctamente ✓');
}
