# 📦 ENTREGA: Sistema de Monedas, Login y Pagos para TuSuerte.pe

Este documento es tu **índice maestro**. Tiene todo lo que se construyó, en qué orden ejecutarlo, y dónde está cada cosa.

---

## ✅ Lo que se construyó

### Lógica nueva
- **Registro/login con email y contraseña** (Firebase Auth)
- **10 monedas virtuales gratis** al crear cuenta (welcome bonus)
- **1 moneda = 1 inscripción** a un sorteo
- **3 paquetes para comprar más:** 20 / 50 / 100 monedas (S/15 / S/40 / S/70)
- **Pago con tarjeta Visa, Mastercard, Amex y Yape** vía Culqi
- **Depósito automático** a tu cuenta bancaria CCI (T+2 días hábiles)
- **Verificación atómica:** imposible inscribirte 2× al mismo sorteo, imposible quedar con saldo negativo
- **Historial:** cada usuario ve sus inscripciones y transacciones
- **Sesión persistente:** sigues logueado al cerrar/abrir el navegador

### Seguridad
- Las **contraseñas se almacenan hasheadas** por Firebase (nunca las ves tú ni la app)
- Las **llaves privadas de Culqi** viven en variables de entorno de Netlify, **nunca tocan el frontend**
- El **saldo de monedas se modifica SOLO desde el backend** (reglas de Firestore lo bloquean)
- **Token Firebase** verifica cada llamada al backend (no se pueden suplantar usuarios)

---

## 📂 Archivos entregados

```
Tusuerte.pe/
├── ENTREGA-MONEDAS.md              ← Este archivo (índice)
├── GUIA-SETUP-MONEDAS.md           ← Guía paso a paso (LÉELA PRIMERO)
├── firestore.rules                  ← Reglas de seguridad de Firestore (copiar a Firebase)
├── netlify.toml                     ← Config de Netlify (deploy ya lo lee)
├── index.html                       ← Modificado: +5 líneas al final
├── js/
│   ├── firebase-config.js           ← ⚠️ PEGA TUS CREDENCIALES FIREBASE
│   ├── auth.js                       ← Registro, login, recuperar clave
│   ├── monedas.js                    ← Saldo, inscripciones, historial
│   ├── pagos.js                      ← ⚠️ PEGA TU LLAVE PÚBLICA CULQI
│   └── integracion.js                ← Une todo con el index.html actual
└── netlify/
    └── functions/
        ├── package.json              ← Dependencias Node
        ├── _firebase-admin.js        ← Helper compartido (verifica tokens)
        ├── cobrar-culqi.js           ← Cobra y acredita monedas
        └── inscribir-sorteo.js       ← Descuenta 1 moneda y crea ticket
```

---

## 🚀 Orden para echar a andar (60–90 min la primera vez)

1. **Lee `GUIA-SETUP-MONEDAS.md`** — es paso a paso.
2. **Crea cuenta Firebase** (15 min) → copia `firebaseConfig` y descarga `serviceAccount.json`
3. **Crea cuenta Culqi** (20 min) → copia `pk_test_...` y `sk_test_...`
4. **Configura variables en Netlify** (5 min): `CULQI_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`
5. **Pega credenciales en código:**
   - `/js/firebase-config.js` → reemplaza el bloque `firebaseConfig`
   - `/js/pagos.js` → reemplaza `pk_test_PEGA_AQUI`
6. **Publica las reglas de Firestore:** copia `firestore.rules` al panel de Firestore
7. **Despliega:** `git add . && git commit -m "monedas" && git push` (o `netlify deploy --prod`)
8. **Prueba en modo Test** con tarjeta `4111 1111 1111 1111` (CVV 123, venc. 09/29)
9. **Pasa a modo Live** cuando esté todo OK (cambia `sk_test_` a `sk_live_` y `pk_test_` a `pk_live_`)

---

## 🎨 Cómo se ve el cambio para el usuario

**Visitante sin cuenta:**
- Ve la página igual que antes
- Arriba a la derecha: badge verde "🔐 Entrar"
- Al hacer clic en cualquier sorteo → modal pidiendo crear cuenta
- Crea cuenta → recibe 10 🪙 → puede participar inmediatamente

**Usuario logueado:**
- Badge dorado arriba a la derecha mostrando saldo "X 🪙"
- Clic en sorteo → 1 clic y queda inscrito (sin formulario)
- Si saldo = 0 → modal de compra automáticamente
- Clic en su badge → panel "Mi cuenta" con saldo, historial, comprar, cerrar sesión

---

## 💰 Modelo económico

| Paquete | Monedas | Precio | Costo por sorteo |
|---------|---------|--------|------------------|
| Starter | 20      | S/15   | S/0.75 |
| Popular | 50      | S/40   | S/0.80 |
| Pro     | 100     | S/70   | S/0.70 |

**Comisiones que se llevará Culqi (modo Live):** ~3.99% + IGV + S/0.60 por transacción
- Sobre S/15: ~S/1.30 → te quedan **S/13.70**
- Sobre S/40: ~S/2.49 → te quedan **S/37.51**
- Sobre S/70: ~S/3.96 → te quedan **S/66.04**

Culqi te deposita automáticamente a tu cuenta bancaria cada T+2 días hábiles.

---

## ⚠️ Consideraciones legales (importante)

Cuando un sorteo requiere pago directo o indirecto para participar, en Perú se considera **"promoción comercial con compra"** o juego de azar, regulado por:

- **DS 006-2000-IN** (Sorteos comerciales)
- **DS 010-2010-MINCETUR** y normas asociadas (Casino y juegos de azar)
- **Indecopi** (Protección al consumidor)

Las "monedas virtuales que se compran" generalmente entran en esta categoría. Te recomiendo encarecidamente:

1. Consultar con un abogado peruano especialista en regulación de juegos / e-commerce
2. Evaluar si necesitas autorización de **MINCETUR**
3. Adaptar el copy del sitio (los textos actuales dicen "100% gratis" — eso ya no será cierto)
4. Actualizar los **Términos y Condiciones** con la mecánica nueva
5. Considerar agregar un disclaimer visible: "Producto recreativo. La compra de monedas no garantiza obtener premios."

No es un consejo legal — solo un recordatorio de lo que sé. Tu abogado tiene la palabra final.

---

## 🛠️ Soporte post-implementación

**Para ajustes futuros frecuentes:**

| Quieres cambiar... | Edita... |
|---|---|
| Precio o cantidad de los paquetes | `/js/pagos.js` Y `/netlify/functions/cobrar-culqi.js` (los DOS) |
| Costo por inscripción (1 moneda) | `/js/monedas.js` Y `/netlify/functions/inscribir-sorteo.js` (constante `COSTO_INSCRIPCION`) |
| Monedas de bienvenida (10) | `/js/auth.js` (constante `MONEDAS_BIENVENIDA`) Y `firestore.rules` |
| Cambiar texto del badge / modales | `/js/integracion.js` |
| Colores de los modales | `/js/integracion.js` constante `CSS` |

**⚠️ Cuando cambies precios:** SIEMPRE cámbialos en frontend Y backend a la vez. Si quedan distintos, el backend rechaza por seguridad.

---

## 📊 Para ver datos en producción

- **Usuarios registrados:** Firebase Console → Authentication → Users
- **Saldos y datos:** Firebase Console → Firestore → users
- **Inscripciones:** Firebase Console → Firestore → inscripciones
- **Compras/transacciones:** Firebase Console → Firestore → transacciones
- **Cobros con Culqi:** panel.culqi.com → Cargos
- **Logs de errores backend:** Netlify → Functions → cobrar-culqi → Logs

---

*Generado el 2026-05-17 — TuSuerte.pe*
