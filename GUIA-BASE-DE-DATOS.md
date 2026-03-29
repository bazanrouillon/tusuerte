# 📋 GUÍA: Conectar tusuerte.pe con Google Sheets

## ¿Qué hace esto?
Cada vez que alguien se registre en un sorteo, sus datos se guardan automáticamente en una hoja de Google Sheets que tú controlas.

---

## PASO 1 — Crear la hoja de Google Sheets

1. Ve a [https://sheets.google.com](https://sheets.google.com)
2. Crea una hoja nueva (haz clic en el **+** grande)
3. Ponle un nombre, por ejemplo: **"Registros TuSuerte"**
4. Copia el **ID de la hoja** de la URL del navegador:
   - La URL se ve así: `https://docs.google.com/spreadsheets/d/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**`/edit`
   - El ID es la parte en negrita (entre `/d/` y `/edit`)

---

## PASO 2 — Crear el Apps Script

1. Con tu Google Sheet abierta, ve a **Extensiones → Apps Script**
2. Se abre el editor de código
3. **Borra todo** el código que aparece por defecto
4. Abre el archivo `codigo-google-apps-script.gs` que está en tu carpeta de tusuerte.pe
5. **Copia y pega** todo ese código en el editor de Apps Script
6. Haz clic en el **ícono de guardar** 💾 (o Ctrl+S)
7. Ponle un nombre al proyecto, por ejemplo: **"TuSuerte Registros"**

---

## PASO 3 — Publicar el Script como Web App

1. Haz clic en **"Implementar"** (botón azul arriba a la derecha)
2. Selecciona **"Nueva implementación"**
3. Haz clic en el engranaje ⚙️ y selecciona **"Aplicación web"**
4. Configura así:
   - **Descripción:** TuSuerte Registros
   - **Ejecutar como:** Yo (tu cuenta de Google)
   - **Quién tiene acceso:** Cualquier usuario
5. Haz clic en **"Implementar"**
6. Google te pedirá que autorices el acceso → haz clic en **"Autorizar acceso"**
7. Elige tu cuenta de Google y permite el acceso
8. **¡Copia la URL de la aplicación web!** Se ve así:
   `https://script.google.com/macros/s/AKfycb...../exec`

---

## PASO 4 — Conectar con tu página web

1. Abre el archivo `index.html` de tu página (en la carpeta tusuerte.pe)
2. Busca esta línea (está cerca del inicio del JavaScript, alrededor de la línea 831):
   ```
   var GOOGLE_SHEETS_URL = 'PEGA_TU_URL_AQUI';
   ```
3. Reemplaza `PEGA_TU_URL_AQUI` con la URL que copiaste en el paso anterior:
   ```
   var GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycb...../exec';
   ```
4. Guarda el archivo
5. Sube los cambios a Netlify (arrastra la carpeta o usa `netlify deploy`)

---

## PASO 5 — Probar que funciona

1. Ve a tu página web tusuerte.pe
2. Haz clic en **"¡QUIERO GANAR!"** en cualquier sorteo
3. Sigue el proceso de TikTok y llena el formulario
4. Envía el registro
5. Abre tu Google Sheet — ¡deberías ver el registro aparecer en segundos! ✅

---

## ¿Qué datos se guardan?

| Columna | Descripción |
|---------|-------------|
| FECHA Y HORA | Cuándo se registró (hora Lima) |
| SORTEO | En qué sorteo participó |
| NOMBRES | Nombre del participante |
| APELLIDOS | Apellidos |
| DNI | Número de DNI |
| CELULAR | Número de celular |
| CORREO | Correo electrónico |
| DISTRITO | Distrito de Lima |
| TIKTOK | Usuario de TikTok |
| CODIGO | Código único de participación (ej: TSP-12345) |

---

## ¿Problemas? Soluciones comunes

**Los datos no llegan a la hoja:**
- Verifica que la URL en `index.html` sea exactamente la que copiaste
- Asegúrate de que el acceso sea "Cualquier usuario" en la implementación
- Si modificas el script, debes crear una **nueva implementación** (no actualizar la existente para cambios de permisos)

**Error de autorización:**
- Ve a Apps Script → Implementaciones → Administrar implementaciones
- Verifica que la implementación esté activa

---

*Configurado para tusuerte.pe — Sorteos Gratis 🍀*
