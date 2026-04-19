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
// ── Nombre fijo de la hoja de registros ──
// NUNCA usar getActiveSheet() porque depende de cuál
// hoja estaba viendo el usuario en Google Sheets.
var HOJA_REGISTROS = 'Registros TuSuerte';

// ── Helper: obtener o crear hoja por nombre ──
function obtenerOCrearHoja(nombre, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0d0d1f');
      headerRange.setFontColor('#ffe600');
      headerRange.setFontWeight('bold');
    }
  }
  return sheet;
}

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
      var ganadorSheet = obtenerOCrearHoja('Ganadores', ['FECHA Y HORA','SORTEO','SORTEO ID','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','CODIGO']);
      // Cabeceras esperadas (orden fijo):
      // 0=FECHA Y HORA, 1=SORTEO, 2=SORTEO ID, 3=NOMBRES, 4=APELLIDOS,
      // 5=DNI, 6=CELULAR, 7=CORREO, 8=DISTRITO, 9=CODIGO
      var GANADOR_HEADERS = [
        'FECHA Y HORA', 'SORTEO', 'SORTEO ID', 'NOMBRES', 'APELLIDOS',
        'DNI', 'CELULAR', 'CORREO', 'DISTRITO', 'CODIGO'
      ];
      if (!ganadorSheet) {
        ganadorSheet = ss.insertSheet('Ganadores');
        ganadorSheet.appendRow(GANADOR_HEADERS);
        var headerRange = ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length);
        headerRange.setBackground('#1a0a2a');
        headerRange.setFontColor('#ffd700');
        headerRange.setFontWeight('bold');
      } else {
        // Validar cabeceras existentes
        var existingHeaders = ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length).getValues()[0];
        var headersOk = true;
        for (var hh = 0; hh < GANADOR_HEADERS.length; hh++) {
          if (String(existingHeaders[hh] || '').trim().toUpperCase() !== GANADOR_HEADERS[hh]) {
            headersOk = false; break;
          }
        }
        if (!headersOk) {
          ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length).setValues([GANADOR_HEADERS]);
          var headerRange2 = ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length);
          headerRange2.setBackground('#1a0a2a');
          headerRange2.setFontColor('#ffd700');
          headerRange2.setFontWeight('bold');
        }
      }

      // Buscar datos completos del ganador en la hoja de registros
      // Registros: 0=FECHA, 1=SORTEO, 2=NOMBRES, 3=APELLIDOS, 4=DNI,
      //            5=CELULAR, 6=CORREO, 7=DISTRITO, 8=TIKTOK, 9=CODIGO,
      //            10=GANADOR, 11=SORTEO ID
      var regSheet = obtenerOCrearHoja(HOJA_REGISTROS, ['FECHA Y HORA','SORTEO','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','TIKTOK','CODIGO','GANADOR','SORTEO ID']);
      var regData = regSheet.getDataRange().getValues();
      var celular = '', correo = '', distrito = '', codigo = '';
      var dniGanador = (datos.dni || '').trim();
      for (var i = 1; i < regData.length; i++) {
        if (String(regData[i][4] || '').trim() === dniGanador) {
          celular = String(regData[i][5] || '');  // col 5 = CELULAR
          correo = String(regData[i][6] || '');   // col 6 = CORREO
          distrito = String(regData[i][7] || ''); // col 7 = DISTRITO
          codigo = String(regData[i][9] || '');   // col 9 = CODIGO (col 8 es TIKTOK)
          break;
        }
      }

      // appendRow en MISMO orden que GANADOR_HEADERS
      ganadorSheet.appendRow([
        fechaLima,              // 0: FECHA Y HORA
        datos.sorteo || '',     // 1: SORTEO
        datos.sorteoId || '',   // 2: SORTEO ID
        datos.nombres || '',    // 3: NOMBRES
        datos.apellidos || '',  // 4: APELLIDOS
        datos.dni || '',        // 5: DNI
        celular,                // 6: CELULAR
        correo,                 // 7: CORREO
        distrito,               // 8: DISTRITO
        codigo                  // 9: CODIGO
      ]);

      // Marcar como ganador en la hoja de registros (columna K = "GANADOR")
      var ganadorHeader = String(regSheet.getRange(1, 11).getValue() || '').trim();
      if (ganadorHeader !== 'GANADOR') {
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
    // Columnas Registros:
    // 0=FECHA Y HORA(A), 1=SORTEO(B), 2=NOMBRES(C), 3=APELLIDOS(D), 4=DNI(E),
    // 5=CELULAR(F), 6=CORREO(G), 7=DISTRITO(H), 8=TIKTOK(I), 9=CODIGO(J),
    // 10=GANADOR(K) [se llena al seleccionar ganador], 11=SORTEO ID(L)
    var REG_HEADERS = [
      'FECHA Y HORA', 'SORTEO', 'NOMBRES', 'APELLIDOS', 'DNI',
      'CELULAR', 'CORREO', 'DISTRITO', 'TIKTOK', 'CODIGO',
      'GANADOR', 'SORTEO ID'
    ];
    var sheet = obtenerOCrearHoja(HOJA_REGISTROS, REG_HEADERS);

    // Crear encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(REG_HEADERS);
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setBackground('#0d0d1f');
      headerRange.setFontColor('#ffe600');
      headerRange.setFontWeight('bold');
    } else {
      // Asegurar que exista la cabecera SORTEO ID en columna L (12)
      var colL = String(sheet.getRange(1, 12).getValue() || '').trim();
      if (colL !== 'SORTEO ID') {
        sheet.getRange(1, 12).setValue('SORTEO ID');
        sheet.getRange(1, 12).setBackground('#0d0d1f');
        sheet.getRange(1, 12).setFontColor('#ffe600');
        sheet.getRange(1, 12).setFontWeight('bold');
      }
      // Asegurar que exista la cabecera GANADOR en columna K (11)
      var colK = String(sheet.getRange(1, 11).getValue() || '').trim();
      if (colK !== 'GANADOR') {
        sheet.getRange(1, 11).setValue('GANADOR');
        sheet.getRange(1, 11).setBackground('#0d0d1f');
        sheet.getRange(1, 11).setFontColor('#ffd700');
        sheet.getRange(1, 11).setFontWeight('bold');
      }
    }

    // ── VALIDACIÓN ANTI-DUPLICADOS EN SERVIDOR ──
    // Verificar que el mismo DNI no esté registrado para el mismo sorteoId
    var dniRegistro = (datos.dni || '').trim();
    var sorteoIdRegistro = (datos.sorteoId || '').trim();
    if (dniRegistro && sorteoIdRegistro) {
      var existingData = sheet.getDataRange().getValues();
      for (var di = 1; di < existingData.length; di++) {
        var existDni = String(existingData[di][4] || '').trim();
        var existSorteoId = String(existingData[di][11] || '').trim();
        if (existDni === dniRegistro && existSorteoId === sorteoIdRegistro) {
          return ContentService
            .createTextOutput(JSON.stringify({ status: 'duplicado', mensaje: 'Ya estás registrado en este sorteo' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    } else if (dniRegistro) {
      // Fallback sin sorteoId: verificar por nombre de sorteo
      var sorteoRegistro = (datos.sorteo || '').trim().toLowerCase();
      var existingData2 = sheet.getDataRange().getValues();
      for (var di2 = 1; di2 < existingData2.length; di2++) {
        var existDni2 = String(existingData2[di2][4] || '').trim();
        var existSorteo2 = String(existingData2[di2][1] || '').trim().toLowerCase();
        if (existDni2 === dniRegistro && sorteoRegistro && existSorteo2.indexOf(sorteoRegistro) !== -1) {
          return ContentService
            .createTextOutput(JSON.stringify({ status: 'duplicado', mensaje: 'Ya estás registrado en este sorteo' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Agregar la fila con los datos del registro
    // Columna K (GANADOR) vacía — se llena al seleccionar ganador
    sheet.appendRow([
      fechaLima,               // A: FECHA Y HORA
      datos.sorteo || '',      // B: SORTEO
      datos.nombres || '',     // C: NOMBRES
      datos.apellidos || '',   // D: APELLIDOS
      datos.dni || '',         // E: DNI
      datos.celular || '',     // F: CELULAR
      datos.correo || '',      // G: CORREO
      datos.distrito || '',    // H: DISTRITO
      datos.tiktok || '',      // I: TIKTOK
      datos.codigo || '',      // J: CODIGO
      '',                      // K: GANADOR (vacío)
      datos.sorteoId || ''     // L: SORTEO ID
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
      var sorteoIdParam = (e.parameter.sorteoId || '').trim();
      var sheet = obtenerOCrearHoja(HOJA_REGISTROS, [
        'FECHA Y HORA', 'SORTEO', 'NOMBRES', 'APELLIDOS', 'DNI',
        'CELULAR', 'CORREO', 'DISTRITO', 'TIKTOK', 'CODIGO',
        'GANADOR', 'SORTEO ID'
      ]);
      var data = sheet.getDataRange().getValues();
      var participantes = [];

      // Extraer palabra clave principal del sorteo (ej: "chicle", "quinua", "pollito")
      var palabraClave = '';
      if (sorteoFiltro) {
        var palabras = sorteoFiltro.toLowerCase().replace(/yape|pa|pal|la|el|de|los|las/gi, '').trim().split(/\s+/);
        palabraClave = palabras[palabras.length - 1] || '';
      }

      // Columnas: 0=Fecha, 1=Sorteo, 2=Nombres, 3=Apellidos, 4=DNI, ..., 11=SorteoId(L)
      for (var i = 1; i < data.length; i++) {
        var sorteoCell = String(data[i][1] || '').trim().toLowerCase();
        var sorteoIdCell = String(data[i][11] || '').trim(); // columna L: SORTEO ID

        // ── Filtrar por sorteoId (prioritario, diferencia ciclos semanales) ──
        if (sorteoIdParam) {
          if (sorteoIdCell !== sorteoIdParam) continue;
        } else if (sorteoFiltro) {
          // Fallback: coincidencia por nombre (compatibilidad con datos antiguos)
          var match = false;
          if (sorteoCell.indexOf(sorteoFiltro.toLowerCase()) !== -1) match = true;
          if (!match && palabraClave && sorteoCell.indexOf(palabraClave) !== -1) match = true;
          if (!match) continue;
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

      // ═══ LOCK: impedir que 2 dispositivos elijan ganadores distintos ═══
      // LockService garantiza que solo UNA ejecución entre a la sección
      // crítica a la vez. Si otro dispositivo llama al mismo tiempo,
      // esperará hasta 15 segundos a que se libere el lock.
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(15000); // esperar hasta 15s si otro proceso tiene el lock
      } catch (eLock) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'error',
            mensaje: 'Servidor ocupado seleccionando ganador, intenta de nuevo'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();

        // 1) Verificar si ya hay un ganador registrado para este sorteo
        // IMPORTANTE: Cuando hay sorteoId (incluye fecha, ej: "1-20260406"),
        // SOLO buscar por sorteoId exacto. El fallback por nombre se usa
        // ÚNICAMENTE cuando no hay sorteoId (datos antiguos).
        // Esto evita confundir sorteos del mismo nombre en semanas distintas.
        var ganadorSheet = obtenerOCrearHoja('Ganadores', ['FECHA Y HORA','SORTEO','SORTEO ID','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','CODIGO']);
        if (ganadorSheet) {
          var gData = ganadorSheet.getDataRange().getValues();
          for (var gi = gData.length - 1; gi >= 1; gi--) {
            var gSorteoId = String(gData[gi][2] || '').trim();
            var gSorteo = String(gData[gi][1] || '').trim();
            var esMatch = false;
            if (sorteoId) {
              // Con sorteoId: SOLO match exacto por sorteoId (incluye fecha)
              esMatch = (gSorteoId === sorteoId);
            } else if (sorteoFiltro) {
              // Sin sorteoId (fallback datos antiguos): match por nombre
              esMatch = (gSorteo.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) !== -1);
            }
            if (esMatch) {
              // Ya existe ganador para este sorteo+fecha — devolver el mismo
              lock.releaseLock();
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
        // Columnas Registros: ..., 9=CODIGO(J), 10=GANADOR(K), 11=SORTEO ID(L)
        var regSheet = obtenerOCrearHoja(HOJA_REGISTROS, ['FECHA Y HORA','SORTEO','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','TIKTOK','CODIGO','GANADOR','SORTEO ID']);
        var regData = regSheet.getDataRange().getValues();
        var participantes = [];
        for (var pi = 1; pi < regData.length; pi++) {
          var sorteoIdCell = String(regData[pi][11] || '').trim(); // columna L: SORTEO ID

          // Filtrar por sorteoId (prioritario) o por nombre (fallback)
          if (sorteoId) {
            if (sorteoIdCell !== sorteoId) continue;
          } else if (sorteoFiltro) {
            var sorteoCell = String(regData[pi][1] || '').trim();
            if (sorteoCell.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) === -1) continue;
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
          lock.releaseLock();
          return ContentService
            .createTextOutput(JSON.stringify({
              status: 'ok',
              ganador: null,
              mensaje: 'No hay participantes registrados para este sorteo'
            }))
            .setMimeType(ContentService.MimeType.JSON);
        }

        // 3) Selección aleatoria SERVER-SIDE (dentro del lock = atómica)
        var idx = Math.floor(Math.random() * participantes.length);
        var ganador = participantes[idx];

        // 4) Guardar ganador en hoja Ganadores
        // Cabeceras esperadas (orden fijo — DEBE coincidir con los índices de lectura):
        // 0=FECHA Y HORA, 1=SORTEO, 2=SORTEO ID, 3=NOMBRES, 4=APELLIDOS,
        // 5=DNI, 6=CELULAR, 7=CORREO, 8=DISTRITO, 9=CODIGO
        var GANADOR_HEADERS = [
          'FECHA Y HORA', 'SORTEO', 'SORTEO ID', 'NOMBRES', 'APELLIDOS',
          'DNI', 'CELULAR', 'CORREO', 'DISTRITO', 'CODIGO'
        ];

        if (!ganadorSheet) {
          ganadorSheet = ss.insertSheet('Ganadores');
          ganadorSheet.appendRow(GANADOR_HEADERS);
          var headerRange = ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length);
          headerRange.setBackground('#1a0a2a');
          headerRange.setFontColor('#ffd700');
          headerRange.setFontWeight('bold');
        } else {
          // ── Validar que las cabeceras existentes coincidan ──
          var existingHeaders = ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length).getValues()[0];
          var headersOk = true;
          for (var hi = 0; hi < GANADOR_HEADERS.length; hi++) {
            if (String(existingHeaders[hi] || '').trim().toUpperCase() !== GANADOR_HEADERS[hi]) {
              headersOk = false;
              break;
            }
          }
          if (!headersOk) {
            // Sobrescribir cabeceras para corregir desalineación
            ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length).setValues([GANADOR_HEADERS]);
            var headerRange2 = ganadorSheet.getRange(1, 1, 1, GANADOR_HEADERS.length);
            headerRange2.setBackground('#1a0a2a');
            headerRange2.setFontColor('#ffd700');
            headerRange2.setFontWeight('bold');
          }
        }

        var ahora = new Date();
        var fechaLima = Utilities.formatDate(ahora, 'America/Lima', 'dd/MM/yyyy HH:mm:ss');
        // ── appendRow en MISMO orden que GANADOR_HEADERS ──
        ganadorSheet.appendRow([
          fechaLima,              // 0: FECHA Y HORA
          sorteoFiltro || '',     // 1: SORTEO
          sorteoId || '',         // 2: SORTEO ID
          ganador.nombres,        // 3: NOMBRES
          ganador.apellidos,      // 4: APELLIDOS
          ganador.dni,            // 5: DNI
          ganador.celular || '',  // 6: CELULAR
          ganador.correo || '',   // 7: CORREO
          ganador.distrito || '', // 8: DISTRITO
          ganador.codigo || ''    // 9: CODIGO
        ]);
        // Forzar escritura inmediata antes de liberar el lock
        SpreadsheetApp.flush();

        // 5) Marcar como ganador en hoja de registros (columna K = GANADOR)
        var ganadorHeader = String(regSheet.getRange(1, 11).getValue() || '').trim();
        if (ganadorHeader !== 'GANADOR') {
          regSheet.getRange(1, 11).setValue('GANADOR');
          regSheet.getRange(1, 11).setBackground('#0d0d1f');
          regSheet.getRange(1, 11).setFontColor('#ffd700');
          regSheet.getRange(1, 11).setFontWeight('bold');
        }
        var dniGanador = ganador.dni;
        for (var mj = 1; mj < regData.length; mj++) {
          var mjSorteoId = String(regData[mj][11] || '').trim();
          // Marcar solo el registro del mismo sorteoId (o por DNI si es dato antiguo)
          if (String(regData[mj][4] || '').trim() === dniGanador) {
            if (sorteoId && mjSorteoId && mjSorteoId !== sorteoId) continue;
            regSheet.getRange(mj + 1, 11).setValue('SI');
            regSheet.getRange(mj + 1, 11).setBackground('#1a4a1a');
            regSheet.getRange(mj + 1, 11).setFontColor('#ffd700');
            regSheet.getRange(mj + 1, 11).setFontWeight('bold');
            break;
          }
        }
        SpreadsheetApp.flush();

        lock.releaseLock();
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

      } catch (errLock) {
        lock.releaseLock();
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'error',
            mensaje: 'Error al seleccionar ganador: ' + errLock.message
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ── Obtener TODOS los ganadores (desde hoja Ganadores) ──
    // Lee directamente de la hoja Ganadores donde seleccionarGanador guarda los datos
    // Columnas Ganadores: 0=Fecha, 1=Sorteo, 2=SorteoId, 3=Nombres, 4=Apellidos, 5=DNI, 6=Celular, 7=Correo, 8=Distrito, 9=Codigo
    if (action === 'obtenertodosganadores') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var ganadorSheet = obtenerOCrearHoja('Ganadores', ['FECHA Y HORA','SORTEO','SORTEO ID','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','CODIGO']);
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
      var ganadorSheet = obtenerOCrearHoja('Ganadores', ['FECHA Y HORA','SORTEO','SORTEO ID','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','CODIGO']);
      var ganadorEncontrado = null;
      if (ganadorSheet) {
        var data = ganadorSheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          var gSorteoId = String(data[i][2] || '').trim();
          var gSorteo = String(data[i][1] || '').trim();
          var match = false;
          if (sorteoIdParam) {
            // Con sorteoId: SOLO match exacto (evita confundir semanas)
            match = (gSorteoId === sorteoIdParam);
          } else if (sorteoFiltro) {
            // Sin sorteoId (fallback datos antiguos): match por nombre
            match = (gSorteo.toLowerCase().indexOf(sorteoFiltro.toLowerCase()) !== -1);
          }
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
    // Acepta sorteoId para diferenciar ciclos semanales
    if (action === 'verificardni') {
      var dni = (e.parameter.dni || '').trim();
      var sorteoCheck = (e.parameter.sorteo || '').trim();
      var sorteoIdCheck = (e.parameter.sorteoId || '').trim();
      var sheet = obtenerOCrearHoja(HOJA_REGISTROS, ['FECHA Y HORA','SORTEO','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','TIKTOK','CODIGO','GANADOR','SORTEO ID']);
      var data = sheet.getDataRange().getValues();
      var yaRegistrado = false;

      for (var i = 1; i < data.length; i++) {
        var dniCell = String(data[i][4] || '').trim();
        if (dni && dniCell === dni) {
          if (sorteoIdCheck) {
            // Nuevo sistema: verificar por sorteoId (columna L, índice 11)
            var sorteoIdCell = String(data[i][11] || '').trim();
            if (sorteoIdCell === sorteoIdCheck) { yaRegistrado = true; break; }
          } else if (sorteoCheck) {
            // Fallback: verificar por nombre (compatibilidad datos antiguos)
            var sorteoCell = String(data[i][1] || '').trim();
            if (sorteoCell.toLowerCase().indexOf(sorteoCheck.toLowerCase()) !== -1) { yaRegistrado = true; break; }
          }
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

    // ── Listar fotos de pagos desde carpeta de Google Drive (como base64) ──
    if (action === 'fotospagos') {
      var FOLDER_ID = '16mJtFWcIoBVn-Xp78ZNlgnoac9Y8ZP_X';
      var fotos = [];
      var errores = [];
      try {
        var folder = DriveApp.getFolderById(FOLDER_ID);
        var files = folder.getFiles();
        var count = 0;
        while (files.hasNext()) {
          var file = files.next();
          count++;
          var mimeType = file.getMimeType() || '';
          if (mimeType.indexOf('image') !== -1) {
            try {
              // Obtener la imagen como blob y convertir a base64
              var blob = file.getBlob();
              var base64 = Utilities.base64Encode(blob.getBytes());
              var dataUrl = 'data:' + mimeType + ';base64,' + base64;
              fotos.push({
                nombre: file.getName(),
                thumb: dataUrl,
                fecha: Utilities.formatDate(file.getDateCreated(), 'America/Lima', 'dd/MM/yyyy')
              });
            } catch(imgErr) {
              errores.push('Error imagen ' + file.getName() + ': ' + imgErr.toString());
            }
          }
        }
        if (count === 0) {
          errores.push('La carpeta está vacía o no se encontraron archivos');
        }
      } catch (err) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'error',
            mensaje: 'Error accediendo a la carpeta de Drive: ' + err.toString(),
            tip: 'Asegúrate de que el script tenga permisos de Drive. Ve a Apps Script → Servicios → agrega Google Drive API'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', fotos: fotos, totalArchivos: fotos.length, errores: errores }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Registrar ganador manualmente (admin) ──
    // Uso: GET ?action=registrarganadormanual&sorteo=NOMBRE&sorteoId=ID&dni=DNI
    // Busca al participante por DNI en la hoja de registros y lo registra como ganador
    if (action === 'registrarganadormanual') {
      var sorteoFiltro = (e.parameter.sorteo || '').trim();
      var sorteoId = (e.parameter.sorteoId || '').trim();
      var dniManual = (e.parameter.dni || '').trim();

      if (!dniManual) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', mensaje: 'Falta el parámetro dni' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();

      // Verificar si ya hay un ganador para este sorteo
      var ganadorSheet = obtenerOCrearHoja('Ganadores', ['FECHA Y HORA','SORTEO','SORTEO ID','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','CODIGO']);
      if (ganadorSheet) {
        var gData = ganadorSheet.getDataRange().getValues();
        for (var gi = gData.length - 1; gi >= 1; gi--) {
          var gSorteoId = String(gData[gi][2] || '').trim();
          if (sorteoId && gSorteoId === sorteoId) {
            return ContentService
              .createTextOutput(JSON.stringify({
                status: 'error',
                mensaje: 'Ya existe un ganador para este sorteo: ' + String(gData[gi][3] || '') + ' ' + String(gData[gi][4] || '')
              }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      // Buscar participante por DNI en registros
      var regSheet = obtenerOCrearHoja(HOJA_REGISTROS, ['FECHA Y HORA','SORTEO','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','TIKTOK','CODIGO','GANADOR','SORTEO ID']);
      var regData = regSheet.getDataRange().getValues();
      var ganador = null;
      var filaGanador = -1;
      for (var pi = 1; pi < regData.length; pi++) {
        var dniCell = String(regData[pi][4] || '').trim();
        var sorteoIdCell = String(regData[pi][11] || '').trim();
        if (dniCell === dniManual && (!sorteoId || sorteoIdCell === sorteoId)) {
          ganador = {
            nombres: String(regData[pi][2] || '').trim(),
            apellidos: String(regData[pi][3] || '').trim(),
            dni: dniCell,
            celular: String(regData[pi][5] || ''),
            correo: String(regData[pi][6] || ''),
            distrito: String(regData[pi][7] || ''),
            codigo: String(regData[pi][9] || '')
          };
          filaGanador = pi;
          break;
        }
      }

      if (!ganador) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', mensaje: 'No se encontró participante con DNI ' + dniManual + ' en el sorteo ' + sorteoId }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Guardar en hoja Ganadores
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
      SpreadsheetApp.flush();

      // Marcar como ganador en registros
      if (filaGanador > 0) {
        regSheet.getRange(filaGanador + 1, 11).setValue('SI');
        regSheet.getRange(filaGanador + 1, 11).setBackground('#1a4a1a');
        regSheet.getRange(filaGanador + 1, 11).setFontColor('#ffd700');
        regSheet.getRange(filaGanador + 1, 11).setFontWeight('bold');
        SpreadsheetApp.flush();
      }

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          mensaje: 'Ganador registrado manualmente',
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
  var sheet = obtenerOCrearHoja(HOJA_REGISTROS, ['FECHA Y HORA','SORTEO','NOMBRES','APELLIDOS','DNI','CELULAR','CORREO','DISTRITO','TIKTOK','CODIGO','GANADOR','SORTEO ID']);
  Logger.log('Hoja de registros: ' + sheet.getName());
  Logger.log('Total filas: ' + sheet.getLastRow());
  Logger.log('Script funcionando correctamente ✓');
}

// =====================================================
// ── TRIGGER AUTOMÁTICO DIARIO (4pm Lima) ──
// Elige al ganador aunque NO haya nadie en la web.
//
// CONFIGURACIÓN (se hace UNA sola vez):
// 1. En Apps Script, abre el menú del reloj ⏰ ("Activadores")
// 2. Clic en "+ Añadir activador" (abajo a la derecha)
// 3. Configura así:
//    - Función: seleccionarGanadorDelDia
//    - Implementación: Head
//    - Origen: Basado en tiempo
//    - Tipo de activador: Temporizador por día
//    - Hora del día: De 16:00 a 17:00  (Lima)
//      ⚠️ Si tu cuenta de Google usa otra zona horaria, ajusta
//         la zona en Apps Script → Proyecto (⚙️) → Zona horaria
//         = "(GMT-05:00) Lima"
// 4. Guardar y autorizar
//
// Google ejecuta el trigger en un momento aleatorio dentro
// de esa hora, así que lo típico es que elija ganador entre
// las 4:00 y las 4:10 pm. La ruleta en la web reconoce al
// ganador ya elegido (via yaExistia:true) y muestra el mismo.
// =====================================================

// Mapeo Día-de-la-semana → número de sorteo (según SORTEOS_BASE del index.html)
// Index del array = getDay() de JS (0=Dom, 1=Lun, ..., 6=Sáb)
var SORTEOS_POR_DIA = [
  { num: 7, nombre: 'Yape pal Pollito',    monto: 'S/15' }, // 0 Domingo
  { num: 1, nombre: 'Yape pal Chicle',     monto: 'S/1'  }, // 1 Lunes
  { num: 2, nombre: 'Yape pa la Quinua',   monto: 'S/2'  }, // 2 Martes
  { num: 3, nombre: 'Yape pa la Gaseosa',  monto: 'S/5'  }, // 3 Miércoles
  { num: 4, nombre: 'Yape pa la Chelita',  monto: 'S/6'  }, // 4 Jueves
  { num: 5, nombre: 'Yape pa la Recarga',  monto: 'S/7'  }, // 5 Viernes
  { num: 6, nombre: 'Yape pa la Canchita', monto: 'S/10' }  // 6 Sábado
];

function seleccionarGanadorDelDia() {
  // ── Calcular fecha/día en hora Lima (GMT-5) ──
  var ahoraUtc = new Date();
  var limaMs = ahoraUtc.getTime() - 5 * 3600000;
  var lima = new Date(limaMs);
  var diaSemanaLima = lima.getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
  var yyyy = lima.getUTCFullYear();
  var mm = ('0' + (lima.getUTCMonth() + 1)).slice(-2);
  var dd = ('0' + lima.getUTCDate()).slice(-2);

  var sorteo = SORTEOS_POR_DIA[diaSemanaLima];
  var sorteoId = sorteo.num + '-' + yyyy + mm + dd;
  var sorteoNombre = sorteo.nombre + ' – ' + sorteo.monto;

  Logger.log('[TRIGGER 4PM] Día=' + diaSemanaLima + ' → Sorteo: ' + sorteoNombre);
  Logger.log('[TRIGGER 4PM] SorteoId: ' + sorteoId);

  // ── Reutilizar la lógica de doGet (action=seleccionarganador) ──
  // doGet ya tiene LockService atómico y chequea si ya existe ganador.
  var fakeEvent = {
    parameter: {
      action: 'seleccionarganador',
      sorteo: sorteoNombre,
      sorteoId: sorteoId
    }
  };

  try {
    var respuesta = doGet(fakeEvent);
    var contenido = respuesta.getContent();
    Logger.log('[TRIGGER 4PM] Respuesta: ' + contenido);

    // Parsear respuesta para log amigable
    try {
      var json = JSON.parse(contenido);
      if (json.status === 'ok' && json.ganador && json.ganador.nombres) {
        var prefijo = json.yaExistia ? '♻️ Ganador ya existía' : '🎉 Ganador nuevo elegido';
        Logger.log('[TRIGGER 4PM] ' + prefijo + ': ' +
                   json.ganador.nombres + ' ' + json.ganador.apellidos +
                   ' (DNI ' + json.ganador.dni + ')');
      } else if (json.ganador === null) {
        Logger.log('[TRIGGER 4PM] ⚠️ No había participantes registrados para ' + sorteoId);
      } else if (json.status === 'error') {
        Logger.log('[TRIGGER 4PM] ❌ Error del servidor: ' + json.mensaje);
      }
    } catch (eParse) {
      Logger.log('[TRIGGER 4PM] Respuesta no-JSON');
    }
  } catch (err) {
    Logger.log('[TRIGGER 4PM] ❌ Excepción: ' + err.toString());
  }
}

// ── Atajo manual para probar SIN esperar al trigger ──
// Ejecutalo desde el editor de Apps Script con el botón ▶ Run.
// Elige el ganador del día HOY (fecha Lima).
function probarTriggerHoy() {
  seleccionarGanadorDelDia();
}
