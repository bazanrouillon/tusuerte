# 🪙 GUÍA DE SETUP: Sistema de Monedas, Login y Pagos

Esta guía te lleva paso a paso para activar el nuevo sistema de:
- Registro/login con email y clave
- 10 monedas virtuales gratis al registrarse
- Inscripción a sorteos costando 1 moneda
- Compra de paquetes de monedas con tarjeta (Visa, Mastercard) y Yape (vía Culqi)

**Tiempo estimado total:** 60–90 minutos la primera vez.

---

## 🗺️ Mapa general

Vas a necesitar 3 servicios externos:

| Servicio | Para qué | Costo |
|----------|----------|-------|
| **Firebase** (Google) | Guardar usuarios, claves y saldo de monedas | Gratis hasta ~50k usuarios/mes |
| **Culqi** | Cobrar tarjetas y Yape | 3.99% + IGV por transacción + S/0.60 |
| **Netlify Functions** | Backend que conecta Culqi con Firebase de forma segura | Gratis hasta 125k invocaciones/mes |

---

# PARTE 1 — Crear cuenta Firebase (15 min)

Firebase es de Google y te da: base de datos + sistema de login + reglas de seguridad.

## 1.1 Crear proyecto

1. Ve a https://console.firebase.google.com/
2. Inicia sesión con tu cuenta de Google
3. Clic en **"Agregar proyecto"** (o "Crear proyecto")
4. Nombre: **`tusuerte-pe`** (o el que quieras)
5. Continúa → **Desactiva** Google Analytics (no lo necesitas para esto)
6. Clic en **"Crear proyecto"** y espera

## 1.2 Habilitar Authentication (login con email)

1. En el menú izquierdo: **Build → Authentication**
2. Clic en **"Comenzar"**
3. Pestaña **"Sign-in method"** → busca **"Correo electrónico/Contraseña"**
4. Clic → activa el toggle **"Habilitar"** (deja el segundo desactivado)
5. **Guardar**

## 1.3 Habilitar Firestore (la base de datos)

1. En el menú izquierdo: **Build → Firestore Database**
2. Clic en **"Crear base de datos"**
3. Modo: **"Comenzar en modo de producción"** (importante — modo de prueba es inseguro)
4. Ubicación: **`southamerica-east1`** (São Paulo, el más cercano a Perú)
5. **Habilitar**

## 1.4 Obtener credenciales del frontend (Web SDK)

1. En el menú izquierdo, clic en el **engranaje ⚙️ → Configuración del proyecto**
2. Baja hasta **"Tus apps"** y clic en el ícono **`</>`** (web)
3. Sobrenombre de la app: **`tusuerte-web`** → **Registrar app**
4. Verás un bloque de código como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tusuerte-pe.firebaseapp.com",
  projectId: "tusuerte-pe",
  storageBucket: "tusuerte-pe.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123..."
};
```

5. **COPIA ese bloque entero** — lo pegas en el paso 5.1 más abajo.

## 1.5 Obtener Service Account (para el backend de Netlify)

Este es el "súper-usuario" que la Netlify Function usará para acreditar monedas.

1. **Engranaje ⚙️ → Configuración del proyecto → pestaña "Cuentas de servicio"**
2. Clic en **"Generar nueva clave privada"** → **"Generar clave"**
3. Se descarga un archivo **JSON** (algo como `tusuerte-pe-firebase-adminsdk-xxxxx.json`)
4. **NO LO SUBAS A NETLIFY NI GITHUB.** Guárdalo en tu compu, lo usarás en el paso 4.

## 1.6 Aplicar las reglas de seguridad de Firestore

1. En Firestore → pestaña **"Reglas"**
2. **Borra todo** el contenido y pega lo que está en el archivo **`firestore.rules`** (que te entrego)
3. Clic en **"Publicar"**

---

# PARTE 2 — Crear cuenta Culqi (20 min)

Culqi es la pasarela peruana para cobrar tarjetas + Yape.

## 2.1 Registrarse

1. Ve a https://culqi.com/ → **"Crear cuenta"**
2. Llena con tus datos. **Necesitas RUC** (persona natural con negocio o empresa)
3. Verifica tu correo

## 2.2 Modo Test primero (importante)

Al inicio Culqi te activa solo el **modo Test** (transacciones falsas). Esto te permite probar todo sin cobrar plata real.

Para pasar a **modo Live** (cobros reales) Culqi te pedirá:
- RUC válido
- Foto del DNI del representante
- Datos bancarios (CCI) donde te depositan
- A veces piden página web operativa y registro nacional (todo subible desde su panel)

**Mi recomendación:** desarrolla y prueba todo en modo Test, y cuando esté funcionando, pides el upgrade a Live.

## 2.3 Obtener las API keys

1. En el panel de Culqi → menú **"Desarrolladores"** o **"API Keys"**
2. Vas a ver 2 llaves de **modo Test**:
   - **Llave Pública (`pk_test_...`)** → va en el frontend
   - **Llave Privada (`sk_test_...`)** → va en Netlify (¡NUNCA en el frontend!)
3. Cópialas a un lugar seguro.

Cuando pases a modo Live tendrás `pk_live_...` y `sk_live_...`.

## 2.4 Configurar la cuenta bancaria de depósitos

1. En el panel: **"Mi cuenta" → "Cuentas bancarias"**
2. Agrega tu **CCI** (Código de Cuenta Interbancario, 20 dígitos)
3. Culqi te depositará automáticamente las ventas (menos su comisión) cada **T+2 días hábiles** a esa cuenta.

> Esto responde a tu requisito de que el dinero "vaya a tu cuenta bancaria como depósito" ✅

---

# PARTE 3 — Configurar Netlify Functions (10 min)

## 3.1 Confirmar que ya tienes Netlify Functions

Si tu sitio ya está en Netlify y tienes la carpeta `/netlify/functions/`, ya estás. (Yo te creé esa carpeta en `/Users/santiagobazan/Library/CloudStorage/Dropbox/Tusuerte.pe/netlify/functions/`)

## 3.2 Crear `netlify.toml` en la raíz

Lo cubro en el paso 5. Solo asegúrate de que el deploy de Netlify detecte la carpeta `netlify/functions/`.

## 3.3 Agregar variables de entorno (CRÍTICO)

Las llaves secretas NUNCA van en código que sube a GitHub. Las pones aquí:

1. Ve a tu panel de Netlify → tu sitio tusuerte.pe → **Site configuration → Environment variables**
2. Agrega estas 3 variables:

| Variable | Valor |
|----------|-------|
| `CULQI_SECRET_KEY` | `sk_test_...` (la privada de Culqi, del paso 2.3) |
| `FIREBASE_SERVICE_ACCOUNT` | El contenido COMPLETO del JSON del paso 1.5, en una sola línea. (Truco: ábrelo en VS Code, Ctrl+A, Ctrl+J para una línea, y pega) |
| `FIREBASE_PROJECT_ID` | `tusuerte-pe` (o como lo llamaste) |

3. **Save**

## 3.4 Instalar dependencias de Node (Netlify lo hace solo si pones `package.json`)

Yo te dejo un `package.json` listo en `/netlify/functions/`.

---

# PARTE 4 — Pegar las credenciales en el código

## 4.1 Frontend (Firebase config)

1. Abre el archivo **`/js/firebase-config.js`** (que yo te entrego)
2. Reemplaza el bloque `firebaseConfig` con el del paso 1.4
3. Guarda

## 4.2 Frontend (Culqi public key)

1. Abre **`/js/pagos.js`**
2. Busca la línea `var CULQI_PUBLIC_KEY = 'pk_test_PEGA_AQUI';`
3. Pega tu `pk_test_...` del paso 2.3
4. Guarda

## 4.3 Backend (ya está en variables de entorno)

El `cobrar-culqi.js` lee las variables automáticamente. No tocas nada.

---

# PARTE 5 — Probar todo en modo Test

## 5.1 Levantar localmente (opcional pero recomendado)

Si tienes Node instalado:

```bash
cd /Users/tusuario/Library/CloudStorage/Dropbox/Tusuerte.pe
npx netlify-cli dev
```

Esto te levanta en `http://localhost:8888` y simula Netlify Functions localmente.

Si no, simplemente despliega a Netlify (`netlify deploy --prod`) y prueba en producción **en modo Test de Culqi** (que es seguro).

## 5.2 Test de flujo completo

1. Abre la página → clic en **"Crear cuenta"**
2. Regístrate con tu email real
3. Confirma que tu **saldo dice "10 🪙"** arriba a la derecha
4. Clic en cualquier sorteo → confirma que pide login y descuenta 1 moneda
5. Clic en **"Comprar monedas"** → elige paquete de 20
6. Usa una **tarjeta de prueba de Culqi**:
   - Número: `4111 1111 1111 1111`
   - CVV: `123`
   - Vencimiento: `09/29` (cualquier futura)
7. Pago aprobado → tu saldo debe sumar 20 monedas
8. Ve a tu Firestore → colección `users` → verifica que tu doc tiene `saldoMonedas: 29` (10 iniciales − 1 sorteo + 20 compra)

## 5.3 Tarjetas de prueba útiles (modo Test Culqi)

| Caso | Número | Resultado |
|------|--------|-----------|
| Aprobada | 4111 1111 1111 1111 | OK |
| Rechazada por fondos | 4000 0000 0000 0002 | Error "fondos insuficientes" |
| Tarjeta inválida | 4000 0000 0000 0010 | Error "tarjeta inválida" |

---

# PARTE 6 — Pasar a modo Live (cuando todo funciona en Test)

1. En el panel de Culqi → **"Solicitar activación de modo Live"**
2. Sube los documentos que pidan (DNI, RUC, CCI)
3. Esperar aprobación (24–72h normalmente)
4. Una vez aprobado, Culqi te da `pk_live_...` y `sk_live_...`
5. En Netlify → cambia `CULQI_SECRET_KEY` al `sk_live_...`
6. En `/js/pagos.js` → cambia `CULQI_PUBLIC_KEY` al `pk_live_...`
7. Redespliega → ya estás cobrando real ✅

---

# 🆘 Soluciones a problemas comunes

**"Permission denied" al registrarse**
→ No habilitaste Email/Password en Firebase Auth (paso 1.2)

**"Missing or insufficient permissions" al leer monedas**
→ No publicaste las reglas de Firestore (paso 1.6)

**Culqi dice "llave inválida"**
→ Estás usando `sk_test_` cuando deberías usar `sk_live_` (o viceversa)

**El cobro funciona pero las monedas no se acreditan**
→ Revisa los logs de la Netlify Function: panel de Netlify → Functions → cobrar-culqi → logs

**"FIREBASE_SERVICE_ACCOUNT is undefined"**
→ El JSON no quedó en una sola línea. Ábrelo, quítale todos los saltos de línea, pégalo en Netlify env var.

---

# 📞 Soporte

- **Culqi:** https://docs.culqi.com/ — soporte por chat en su panel
- **Firebase:** https://firebase.google.com/docs/auth — comunidad muy activa en Stack Overflow

---

*Última actualización: 2026-05-17 — TuSuerte.pe*
