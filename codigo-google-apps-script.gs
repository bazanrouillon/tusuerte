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
