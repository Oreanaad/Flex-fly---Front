// Importa dotenv para cargar variables de entorno desde un archivo .env.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import bcrypt from 'bcryptjs'; // <--- Añadido para seguridad
import crypto from 'crypto'; // Viene con Node
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../backk/.env') }); // Asegura que cargue el .env correcto

const resend = new Resend(process.env.RESEND_API_KEY);
async function sendEmailWithResend({ to, subject, html }) {
  return resend.emails.send({
    from: "Kawatek Bionics <no-reply@oreanaad.com>",
    to,
    subject,
    html
  });
}

function kawatekEmailTemplate({
  title,
  subtitle,
  greeting,
  body,
  buttonText,
  buttonUrl,
  footerText = "Rehabilitation software · Kawatek 2026"
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb; padding:40px 0;">
          <tr>
            <td align="center">

              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 12px 32px rgba(15,23,42,0.08);">
                
                <tr>
                  <td style="background:linear-gradient(135deg,#6d28d9,#7c3aed,#2563eb); padding:34px 40px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800;">
                      ${title}
                    </h1>
                    <p style="margin:10px 0 0 0; color:#ede9fe; font-size:15px;">
                      ${subtitle}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:38px 44px 12px 44px; color:#334155; font-size:16px; line-height:1.7;">
                    <h2 style="margin:0 0 18px 0; color:#0f172a; font-size:22px; font-weight:800;">
                      ${greeting}
                    </h2>

                    ${body}
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:32px 44px 24px 44px;">
                    <a href="${buttonUrl}"
                       style="display:inline-block; background:#6d28d9; color:#ffffff; text-decoration:none; font-size:15px; font-weight:800; padding:16px 36px; border-radius:12px; letter-spacing:0.4px;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 44px 32px 44px; color:#64748b; font-size:13px; line-height:1.6; text-align:center;">
                    <p style="margin:0 0 8px 0;">
                      If the button does not work, copy this link into your browser:
                    </p>

                    <a href="${buttonUrl}" style="color:#2563eb; word-break:break-all; text-decoration:none;">
                      ${buttonUrl}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 44px;">
                    <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;" />
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:22px 44px 30px 44px; color:#94a3b8; font-size:12px;">
                    ${footerText}
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

const { Pool } = pkg;
const PORT = process.env.PORT || 5000; // Usa el del .env o 5000 por defecto
const app = express();
const allowedOrigins = [
  // Dominio del frontend desplegado en Netlify.
  'https://flexfly.netlify.app',

  // Entorno local de Vite.
  'http://localhost:5173', // Tu entorno local de Vite

  // Otro puerto local permitido por si el frontend corre en 3000.
  'http://localhost:3000'  // Por si acaso usas otros puertos
];

// Aplica middleware de CORS con configuración personalizada.
app.use(cors({
  // Función que decide si un origen está permitido o no.
  origin: function (origin, callback) {
    // permitir peticiones sin origen (como Postman o apps móviles)
    // Si la petición no tiene origin, se permite.
    if (!origin) return callback(null, true);
    
    // Si el origen no está en la lista de permitidos, se rechaza.
    if (allowedOrigins.indexOf(origin) === -1) {
      // Mensaje de error para orígenes no permitidos.
      const msg = 'El policy de CORS para este sitio no permite acceso desde el origen especificado.';

      // Devuelve error y bloquea la petición.
      return callback(new Error(msg), false);
    }

    // Si el origen está permitido, continúa normalmente.
    return callback(null, true);
  },

  // Permite enviar credenciales como cookies o headers de autenticación.
  credentials: true
}));

// Permite que Express lea cuerpos JSON grandes, hasta 50 MB.
app.use(express.json({ limit: '50mb' }));

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://flex-fly-back.onrender.com'
  : `http://localhost:${PORT}`;

// Crea el pool de conexiones a PostgreSQL usando variables de entorno.
const pool = new Pool({
  // Usuario de PostgreSQL.
  user: process.env.USER_POSTGRES,

  // Host del servidor PostgreSQL.
  host: process.env.HOST_POSTGRES,

  // Nombre de la base de datos.
  database: process.env.DATABASE_POSTGRES,

  // Contraseña de PostgreSQL.
  password: process.env.PASSWORD_POSTGRES,

  // Puerto de PostgreSQL.
  port: process.env.PORT_POSTGRES,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false

});


// Ejecuta una consulta simple para verificar que PostgreSQL responde.
pool.query('SELECT NOW()', (err, res) => {
    // Si hay error, lo muestra en consola.
    if (err) console.error("❌ Error de conexión a Postgres:", err.message);

    // Si no hay error, confirma la conexión.
    else console.log("✅ Postgres conectado para Sesiones y Usuarios.");
});



// --- RUTA DE REGISTRO DE DOCTORES CON APROBACIÓN ADMIN ---
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  const client = await pool.connect();

  if (!username || !email || !password) {
    client.release();

    return res.status(400).json({
      success: false,
      message: "Username, email and password are required."
    });
  }

  try {
    await client.query('BEGIN');

    const userCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message: "Email already registered."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // This token is not for the doctor.
    // It is for the administrator approval link.
    const approvalToken = crypto.randomBytes(32).toString('hex');

    const result = await client.query(
      `INSERT INTO users 
       (username, email, password, verification_token, is_verified) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, is_verified`,
      [username, email, hashedPassword, approvalToken, false]
    );

    const approveUrl = `${API_BASE_URL}/api/auth/approve-doctor/${approvalToken}`;

    await client.query('COMMIT');

res.status(201).json({
  success: true,
  message: "Doctor account created. It is pending administrator approval.",
  user: result.rows[0]
});

const displayName = username || "Doctor";

console.log("🔗 Doctor approval URL:", approveUrl);

sendEmailWithResend({
  to: process.env.ADMIN_APPROVAL_EMAIL,
  subject: "New doctor account pending approval",
  html: kawatekEmailTemplate({
    title: "New doctor approval",
    subtitle: "A new doctor is waiting for administrator approval",
    greeting: "Admin review required",
    body: `
      <p style="margin:0 0 18px 0;">
        A new doctor has registered on the Kawatek rehabilitation platform.
      </p>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px 18px; margin:20px 0;">
        <p style="margin:0 0 10px 0;"><strong style="color:#0f172a;">Doctor name:</strong> ${displayName}</p>
        <p style="margin:0;"><strong style="color:#0f172a;">Doctor email:</strong> ${email}</p>
      </div>

      <p style="margin:0;">
        Click the button below to approve this doctor account.
      </p>
    `,
    buttonText: "APPROVE DOCTOR",
    buttonUrl: approveUrl
  })
})
.then((data) => {
  console.log("✅ Doctor approval email sent with Resend");
  console.log(data);
})
.catch((error) => {
  console.error("❌ DOCTOR APPROVAL RESEND ERROR:", error);
  console.error("⚠️ Manual approval link:");
  console.error(approveUrl);
});
  } catch (err) {
    await client.query('ROLLBACK');

    console.error("❌ Error en el registro de doctor:", err);

    res.status(500).json({
      success: false,
      message: "The doctor registration failed. Please try again."
    });

  } finally {
    client.release();
  }
});

// --- RUTA: APROBAR DOCTOR POR ADMIN ---
app.get('/api/auth/approve-doctor/:token', async (req, res) => {
  const { token } = req.params;

  const FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? 'https://flexfly.netlify.app'
    : 'http://localhost:5173';

  try {
    const result = await pool.query(
      `UPDATE users 
       SET is_verified = true, verification_token = NULL 
       WHERE verification_token = $1 
       RETURNING id, username, email`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).send("Invalid or expired doctor approval token.");
    }

   res.redirect(`${FRONTEND_URL}/verify-success?type=doctor`);

  } catch (err) {
    console.error("❌ Error approving doctor:", err);
    res.status(500).send("Error approving doctor account.");
  }
});

// --- NUEVA RUTA: VERIFICAR EMAIL ---
// En server.js
// Ruta GET que verifica la cuenta usando el token recibido por email.
app.get('/api/auth/verify/:token', async (req, res) => {
  // Extrae el token desde la URL.
  const { token } = req.params;

  // Define la URL del frontend según entorno.
  const FRONTEND_URL = process.env.NODE_ENV === 'production'
  // En producción redirige al frontend de Netlify.
  ? 'https://flexfly.netlify.app'
  // En local redirige al frontend local de Vite.
  : 'http://localhost:5173';


  try {
    // Busca un usuario con ese verification_token y lo marca como verificado.
    const result = await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING *', 
      [token]
    );
    
    // Si no encontró usuario/token, responde token inválido o expirado.
    if (result.rowCount === 0) return res.status(400).send("Token inválido o expirado.");
    
    // CAMBIO AQUÍ: Redirigir a la nueva pantalla de éxito, no al login directamente
    // Redirige al frontend a una pantalla de verificación exitosa.
  res.redirect(`${FRONTEND_URL}/verify-success`);

  } catch (err) {
    // Muestra error en consola si falla la verificación.
    console.error("Error al verificar:", err);

    // Responde error 500 si hubo problema interno.
    res.status(500).send("Error al verificar la cuenta.");
  }
});

// --- MODIFICAR LOGIN PARA BLOQUEAR NO VERIFICADOS ---
// Ruta POST para iniciar sesión.
app.post('/api/auth/login', async (req, res) => {
  // Extrae email y password enviados desde el frontend.
  const { email, password } = req.body;

  try {
    // Busca el usuario por email.
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // Toma el primer usuario encontrado.
    const user = result.rows[0];

    // Si no existe usuario, responde 404.
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    
    // VALIDACIÓN: ¿Está verificado?
    // Si el usuario no verificó su email, bloquea el login.
   if (!user.is_verified) {
  return res.status(401).json({
    success: false,
    message: "Your doctor account is pending administrator approval."
  });
}

    // Compara la contraseña enviada con el hash guardado en base de datos.
    const isMatch = await bcrypt.compare(password, user.password);

    // Si la contraseña no coincide, responde error.
    if (!isMatch) return res.status(400).json({ success: false, message: "Wrong password" });

    // Si todo está bien, responde éxito y devuelve datos básicos del usuario.
    res.json({ success: true, message: "Welcome back.", user: { id: user.id, username: user.username } });
  } catch (err) {
    // Si ocurre un error inesperado, responde error genérico.
    res.status(500).json({ success: false, message: "Error." });
  }
});

// Crear nuevo paciente
// --- RUTAS DE PACIENTES ---

// 1. Crear un nuevo paciente vinculado al doctor logueado
// Ruta POST para crear un paciente nuevo.
app.post('/api/patients', async (req, res) => {
  // Extrae los datos del paciente enviados desde el frontend.
  const { name, id_number, age, affected_side, condition, doctor_id } = req.body;

  // Validación de campos obligatorios
  // Si falta nombre, identificación, edad o doctor_id, no permite crear el paciente.
  if (!name || !age || !doctor_id) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields for medical record." 
    });
  }

  // Validación de tipos de datos
  // Verifica que age sea un número.
  if (isNaN(age)) {
    return res.status(400).json({ 
      success: false, 
      message: "Age must be a numeric value." 
    });
  }
  const finalIdNumber = id_number || `PAT-${Date.now()}`;

  try {
    // Inserta el paciente en la base de datos y devuelve el registro creado.
    const result = await pool.query(
      `INSERT INTO patients (name, id_number, age, affected_side, condition, doctor_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, id_number, age, affected_side, condition, doctor_id]
    );

    // Responde éxito con el paciente creado.
    res.status(201).json({ 
      success: true, 
      patient: result.rows[0] 
    });
  } catch (err) {
    // Manejo de error si la cédula/ID ya existe (Unique Constraint)
    // Código 23505 en PostgreSQL significa violación de clave única.
    if (err.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: "A patient with that ID is already registered." 
      });
    }

    // Muestra otros errores en consola.
    console.error(err);

    // Responde error interno.
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

// 2. Obtener todos los pacientes de un doctor específico
// Ruta GET para listar los pacientes asociados a un doctor.
app.get('/api/patients/doctor/:doctor_id', async (req, res) => {
  const { doctor_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM patients
       WHERE doctor_id = $1
          OR patient_user_id IS NOT NULL
       ORDER BY created_at DESC`,
      [doctor_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error getting patients:", err);
    res.status(500).json({ error: "Error al obtener lista de pacientes." });
  }
});

// 3. Obtener datos de un solo paciente (para cargar en el juego EMG)
// Ruta GET para obtener un paciente por ID.
app.get('/api/patients/:id', async (req, res) => {
    try {
        // Busca el paciente usando el ID recibido en la URL.
        const result = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);

        // Si no encuentra paciente, responde 404.
        if (result.rows.length === 0) return res.status(404).send("Patient not found.");

        // Devuelve los datos del paciente encontrado.
        res.json(result.rows[0]);
    } catch (err) {
        // Responde error si falla el servidor o la base.
        res.status(500).send("Error de servidor.");
    }
});

// AGREGA ESTO EN server.js
// Ruta DELETE para eliminar un paciente por ID.
app.delete('/api/patients/:id', async (req, res) => {
  try {
    // Extrae el ID del paciente desde la URL.
    const { id } = req.params;
   
    // Elimina el paciente de la base de datos.
    const result = await pool.query('DELETE FROM patients WHERE id = $1', [id]);

    // Si rowCount indica que se eliminó al menos una fila, responde éxito.
    if (result.rowCount > 0 || result > 0) {
      res.json({ success: true, message: "Patient deleted successfully" });
    } else {
      // Si no se eliminó nada, el paciente no existía.
      res.status(404).json({ success: false, message: "Patient not found" });
    }
  } catch (error) {
    // Muestra error en consola si falla la eliminación.
    console.error("Error al eliminar:", error);

    // Responde error interno.
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// --- TU RUTA EXISTENTE DE SESIONES ---
// Ruta POST para guardar una sesión de juego/EMG.
app.post('/api/save-session', async (req, res) => {
  // Extrae datos enviados desde el frontend.
  const { patient_id, mode, score, samples, metrics } = req.body; 

  // Log para revisar qué datos llegaron al servidor.
  console.log("📥 Datos recibidos en el servidor:", { patient_id, mode, score, samplesCount: samples?.length });

  // Declara client fuera del try para poder usarlo también en catch/finally.
  let client;

  try {
    // Toma una conexión del pool.
    client = await pool.connect();

    // Inicia una transacción.
    await client.query('BEGIN');

    // 1. Insertar la cabecera de la sesión
    // Query para insertar datos generales de la sesión en emg_sessions.
    const sessionQuery = `
      INSERT INTO emg_sessions 
      (game_mode, score, selectivity_index, coactivation_ratio, fatigue_trend, control_efficiency, patient_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    
    // Log antes de insertar la sesión.
    console.log("📝 Intentando insertar sesión...");

    // Ejecuta la inserción de la sesión usando parámetros seguros.
    const sessionRes = await client.query(sessionQuery, [
      mode, score, metrics.si, metrics.cr, metrics.fatigue, metrics.ce, patient_id
    ]);
    
    // Obtiene el ID de la sesión recién creada.
    const sessionId = sessionRes.rows[0].id;

    // Log con el ID de la nueva sesión.
    console.log(`🆔 Sesión creada con ID: ${sessionId}`);

    // 2. Insertar los samples con tus nombres de columna: val_a y val_b
    // ... dentro de app.post('/api/save-session', ...)

    // 2. Insertar los samples con tus nombres de columna: val_a y val_b
    // Si samples existe y tiene elementos, inserta las muestras en emg_samples.
    if (samples && samples.length > 0) {
      // Log de cantidad de muestras a insertar.
      console.log(`📊 Insertando ${samples.length} muestras...`);

      // Array con todos los valores que se pasarán a PostgreSQL.
      const sampleValues = [];

      // Array con los placeholders SQL: ($1,$2,$3,$4), etc.
      const placeholders = [];
      
      // Recorre cada muestra recibida desde el frontend.
 samples.forEach((sample, index) => {
    // Calcula el desplazamiento de parámetros SQL.
    // Cada muestra usa 4 valores: session_id, timestamp, val_a, val_b.
    const offset = index * 4;
    
    // Probamos diferentes nombres comunes (a o valA) para asegurar que no sea 0
    // Obtiene el valor A buscando diferentes nombres posibles.
    const rawA = sample.a ?? sample.valA ?? sample.val_a ?? 0;

    // Obtiene el valor B buscando diferentes nombres posibles.
    const rawB = sample.b ?? sample.valB ?? sample.val_b ?? 0;
    
    // Si rawA no es numérico, usa 0; si es válido, usa rawA.
    const valA = isNaN(rawA) ? 0 : rawA;

    // Si rawB no es numérico, usa 0; si es válido, usa rawB.
    const valB = isNaN(rawB) ? 0 : rawB;
    
    // Aseguramos la fecha
    // Si la muestra trae t, la convierte a Date; si no, usa la fecha actual.
    const dbTimestamp = sample.t ? new Date(sample.t) : new Date();

    // Agrega los 4 valores correspondientes a esta muestra.
    sampleValues.push(sessionId, dbTimestamp, valA, valB);

    // Agrega los placeholders correspondientes a esta muestra.
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);

      });

      // Construye la query final para insertar todas las muestras juntas.
      const insertSamplesQuery = `
        INSERT INTO emg_samples (session_id, timestamp, val_a, val_b) 
        VALUES ${placeholders.join(', ')}`;
      
      // Ejecuta la inserción masiva de muestras.
      await client.query(insertSamplesQuery, sampleValues);
    }

    // Confirma todos los cambios de la transacción.
    await client.query('COMMIT');

    // ... resto del código
    // Log de éxito total.
    console.log(`✅ TODO GUARDADO: Sesión ${sessionId}`);

    // Responde al frontend con éxito y el ID de sesión.
    res.json({ success: true, sessionId });

  }  catch (err) {
    // Si hubo error y existe client, revierte la transacción.
    if (client) await client.query('ROLLBACK');

    // Muestra mensaje principal del error de base de datos.
    console.error('❌ ERROR EN BD:', err.message); 

    // Muestra detalle del error de PostgreSQL, si existe.
    console.error('Detalle:', err.detail); // <--- ESTO ES CLAVE

    // Responde al frontend con error y detalle.
    res.status(500).json({ error: err.message, detail: err.detail });
} finally {
    // Libera la conexión al pool si fue tomada.
    if (client) client.release();
  }
});

// --- RUTA: REGISTRAR PACIENTE COMO USUARIO CON VERIFICACIÓN EMAIL ---
app.post('/api/patient-users/register', async (req, res) => {
  const { username, email, password, serial_number } = req.body;
  const client = await pool.connect();

  if (!username || !email || !password || !serial_number) {
    client.release();

    return res.status(400).json({
      success: false,
      message: "Username, email, password and serial number are required."
    });
  }

  try {
    await client.query('BEGIN');

    const patientCheck = await client.query(
      'SELECT id FROM patient_users WHERE email = $1',
      [email]
    );

    if (patientCheck.rows.length > 0) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message: "Patient email already registered."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await client.query(
      `INSERT INTO patient_users 
       (username, email, password, serial_number, verification_token, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, serial_number, is_verified, created_at`,
      [username, email, hashedPassword, serial_number, verificationToken, false]
    );

    const url = `${API_BASE_URL}/api/patient-users/verify/${verificationToken}`;

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Patient registered successfully. Check your email to verify your account.",
      patient: result.rows[0]
    });
const displayName = username || "there";

console.log("🔗 Patient verification URL:", url);

sendEmailWithResend({
  to: email,
  subject: "Verify your Kawatek account",
  html: kawatekEmailTemplate({
    title: "Welcome to Kawatek",
    subtitle: "Your rehabilitation account is almost ready",
    greeting: `Hi ${displayName},`,
    body: `
      <p style="margin:0 0 18px 0;">
        Thanks for joining the Kawatek rehabilitation platform. Please verify your email address to activate your account.
      </p>

      <p style="margin:0 0 12px 0;">
        Your bionic hand serial number is:
      </p>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 18px; color:#0f172a; font-size:15px; font-weight:700; letter-spacing:0.3px;">
        ${serial_number}
      </div>
    `,
    buttonText: "VERIFY YOUR ACCOUNT",
    buttonUrl: url
  })
})
.then((data) => {
  console.log("✅ Patient verification email sent with Resend");
  console.log(data);
})
.catch((error) => {
  console.error("❌ PATIENT VERIFICATION RESEND ERROR:", error);
  console.error("⚠️ Manual verification link:");
  console.error(url);
});
  } catch (err) {
    await client.query('ROLLBACK');

    console.error("❌ Error registering patient user:", err);

    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "Patient email already registered."
      });
    }

    res.status(500).json({
      success: false,
      message: "Error registering patient user."
    });

  } finally {
    client.release();
  }
});

// --- RUTA: VERIFICAR EMAIL DE PACIENTE ---
// --- VERIFY PATIENT EMAIL AND CREATE BASIC PATIENT PROFILE ---
app.get('/api/patient-users/verify/:token', async (req, res) => {
  const { token } = req.params;
  const client = await pool.connect();

  const FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? 'https://flexfly.netlify.app'
    : 'http://localhost:5173';

  try {
    await client.query('BEGIN');

    const verifiedPatient = await client.query(
      `UPDATE patient_users
       SET is_verified = true,
           verification_token = NULL
       WHERE verification_token = $1
       RETURNING id, username, email, serial_number`,
      [token]
    );

    if (verifiedPatient.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).send("Invalid or expired patient verification token.");
    }

    const patientUser = verifiedPatient.rows[0];

    const existingPatient = await client.query(
      `SELECT id
       FROM patients
       WHERE patient_user_id = $1`,
      [patientUser.id]
    );

    if (existingPatient.rows.length === 0) {
      await client.query(
        `INSERT INTO patients
         (name, id_number, age, affected_side, condition, doctor_id, patient_user_id, email, serial_number, profile_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          patientUser.username,
          null,
          null,
          null,
          null,
          null,
          patientUser.id,
          patientUser.email,
          patientUser.serial_number,
          false
        ]
      );
    }

    await client.query('COMMIT');

    res.redirect(`${FRONTEND_URL}/verify-success?type=patient`);

  } catch (err) {
    await client.query('ROLLBACK');

    console.error("❌ Error verifying patient and creating patient profile:", err);

    res.status(500).send("Error verifying patient account.");

  } finally {
    client.release();
  }
});
// --- RUTA: LOGIN PACIENTE ---
// --- PATIENT LOGIN ---
app.post('/api/patient-users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required."
    });
  }

  try {
    const result = await pool.query(
      `SELECT 
        pu.*,
        p.id AS clinical_patient_id,
        p.name AS clinical_patient_name,
        p.age,
        p.affected_side,
        p.condition,
        p.profile_completed
       FROM patient_users pu
       LEFT JOIN patients p ON p.patient_user_id = pu.id
       WHERE pu.email = $1`,
      [email]
    );

    const patient = result.rows[0];

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found."
      });
    }

    if (!patient.is_verified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in."
      });
    }

    const isMatch = await bcrypt.compare(password, patient.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password."
      });
    }

    let clinicalPatientId = patient.clinical_patient_id;

    // Safety fallback: if profile was not created during verification, create it now.
    if (!clinicalPatientId) {
      const createdProfile = await pool.query(
        `INSERT INTO patients
         (name, id_number, age, affected_side, condition, doctor_id, patient_user_id, email, serial_number, profile_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          patient.username,
          null,
          null,
          null,
          null,
          null,
          patient.id,
          patient.email,
          patient.serial_number,
          false
        ]
      );

      clinicalPatientId = createdProfile.rows[0].id;
    }

    res.json({
      success: true,
      message: "Patient login successful.",
      patient: {
        id: patient.id,
        patient_user_id: patient.id,
        clinical_patient_id: clinicalPatientId,
        username: patient.username,
        name: patient.clinical_patient_name || patient.username,
        email: patient.email,
        serial_number: patient.serial_number,
        age: patient.age,
        affected_side: patient.affected_side,
        condition: patient.condition,
        profile_completed: patient.profile_completed === true
      }
    });

  } catch (err) {
    console.error("❌ Error logging patient user:", err);

    res.status(500).json({
      success: false,
      message: "Error logging patient user."
    });
  }
});

// --- DOCTOR: REQUEST PASSWORD RESET ---

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required."
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "This email is not associated with any account."
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET reset_password_token = $1,
           reset_password_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    const FRONTEND_URL = process.env.NODE_ENV === 'production'
      ? 'https://flexfly.netlify.app'
      : 'http://localhost:5173';

    const resetUrl = `${FRONTEND_URL}/reset-password/doctor/${resetToken}`;

   const displayName = user.username || "Doctor";

console.log("🔗 Doctor reset password URL:", resetUrl);

const info = await sendEmailWithResend({
  to: user.email,
  subject: "Reset your Kawatek doctor password",
  html: kawatekEmailTemplate({
    title: "Reset your password",
    subtitle: "Secure password recovery for your doctor account",
    greeting: `Hi ${displayName},`,
    body: `
      <p style="margin:0 0 18px 0;">
        We received a request to reset your Kawatek doctor account password.
      </p>

      <p style="margin:0 0 18px 0;">
        Click the button below to create a new password. This link expires in 1 hour.
      </p>

      <p style="margin:0; color:#64748b; font-size:14px;">
        If you did not request this password reset, you can safely ignore this email.
      </p>
    `,
    buttonText: "RESET PASSWORD",
    buttonUrl: resetUrl
  })
});

console.log("✅ Doctor reset password email sent with Resend");
console.log(info);
res.json({
  success: true,
  message: "Password reset email sent successfully."
});

  } catch (err) {
    console.error("❌ Doctor forgot password error:", err.message);
    console.error("❌ Full error:", err);

    res.status(500).json({
      success: false,
      message: "Error sending password reset email."
    });
  }
});
// --- DOCTOR: RESET PASSWORD ---
app.post('/api/auth/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "New password is required."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id FROM users
       WHERE reset_password_token = $1
       AND reset_password_expires > NOW()`,
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (err) {
    console.error("❌ Doctor reset password error:", err);

    res.status(500).json({
      success: false,
      message: "Error resetting password."
    });
  }
});

// --- PATIENT: REQUEST PASSWORD RESET ---
app.post('/api/patient-users/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required."
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, email FROM patient_users WHERE email = $1',
      [email]
    );

    const patient = result.rows[0];

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "This email is not associated with any account."
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE patient_users
       SET reset_password_token = $1,
           reset_password_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, patient.id]
    );

    const FRONTEND_URL = process.env.NODE_ENV === 'production'
      ? 'https://flexfly.netlify.app'
      : 'http://localhost:5173';

    const resetUrl = `${FRONTEND_URL}/reset-password/patient/${resetToken}`;

   const displayName = patient.username || "there";

console.log("🔗 Patient reset password URL:", resetUrl);

const info = await sendEmailWithResend({
  to: patient.email,
  subject: "Reset your Kawatek patient password",
  html: kawatekEmailTemplate({
    title: "Reset your password",
    subtitle: "Secure password recovery for your patient account",
    greeting: `Hi ${displayName},`,
    body: `
      <p style="margin:0 0 18px 0;">
        We received a request to reset your Kawatek patient account password.
      </p>

      <p style="margin:0 0 18px 0;">
        Click the button below to create a new password. This link expires in 1 hour.
      </p>

      <p style="margin:0; color:#64748b; font-size:14px;">
        If you did not request this password reset, you can safely ignore this email.
      </p>
    `,
    buttonText: "RESET PASSWORD",
    buttonUrl: resetUrl
  })
});

console.log("✅ Patient reset password email sent with Resend");
console.log(info);
res.json({
  success: true,
  message: "Password reset email sent successfully."
});

  } catch (err) {
    console.error("❌ Patient forgot password error:", err.message);
    console.error("❌ Full error:", err);

    res.status(500).json({
      success: false,
      message: "Error sending password reset email."
    });
  }
});
// --- PATIENT: RESET PASSWORD ---
app.post('/api/patient-users/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "New password is required."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id FROM patient_users
       WHERE reset_password_token = $1
       AND reset_password_expires > NOW()`,
      [token]
    );

    const patient = result.rows[0];

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      `UPDATE patient_users
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL
       WHERE id = $2`,
      [hashedPassword, patient.id]
    );

    res.json({
      success: true,
      message: "Password updated successfully."
    });

  } catch (err) {
    console.error("❌ Patient reset password error:", err);

    res.status(500).json({
      success: false,
      message: "Error resetting password."
    });
  }
});
// --- COMPLETE PATIENT PROFILE ---
app.put('/api/patient-users/complete-profile/:patient_user_id', async (req, res) => {
  const { patient_user_id } = req.params;
  const { name, age, affected_side, condition } = req.body;

  if (!name || !age || !affected_side || !condition) {
    return res.status(400).json({
      success: false,
      message: "Name, age, affected side and condition are required."
    });
  }

  if (isNaN(age)) {
    return res.status(400).json({
      success: false,
      message: "Age must be a valid number."
    });
  }

  try {
    const result = await pool.query(
      `UPDATE patients
       SET name = $1,
           age = $2,
           affected_side = $3,
           condition = $4,
           profile_completed = true
       WHERE patient_user_id = $5
       RETURNING *`,
      [name, age, affected_side, condition, patient_user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found."
      });
    }

    res.json({
      success: true,
      message: "Patient profile completed successfully.",
      patient: result.rows[0]
    });

  } catch (err) {
    console.error("❌ Error completing patient profile:", err);

    res.status(500).json({
      success: false,
      message: "Error completing patient profile."
    });
  }
});


app.post('/api/doctors/:doctor_id/assign-patient/:patient_id', async (req, res) => {
  const { doctor_id, patient_id } = req.params;

  try {
    const existing = await pool.query(
      `
      SELECT dpa.*, u.username AS doctor_name
      FROM doctor_patient_assignments dpa
      JOIN users u ON u.id = dpa.doctor_id
      WHERE dpa.patient_id = $1
      AND dpa.is_active = true
      `,
      [patient_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Patient already assigned to ${existing.rows[0].doctor_name}.`
      });
    }

    await pool.query(
      `
      INSERT INTO doctor_patient_assignments (doctor_id, patient_id, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (doctor_id, patient_id)
      DO UPDATE SET is_active = true, assigned_at = NOW()
      `,
      [doctor_id, patient_id]
    );

    res.json({
      success: true,
      message: "Patient assigned to doctor successfully."
    });

  } catch (err) {
    console.error("❌ Error assigning patient:", err);

    res.status(500).json({
      success: false,
      message: "Error assigning patient."
    });
  }
});

app.put('/api/doctors/:doctor_id/remove-patient/:patient_id', async (req, res) => {
  const { doctor_id, patient_id } = req.params;

  try {
    await pool.query(
      `
      UPDATE doctor_patient_assignments
      SET is_active = false
      WHERE doctor_id = $1
      AND patient_id = $2
      `,
      [doctor_id, patient_id]
    );

    res.json({
      success: true,
      message: "Patient removed from your patients."
    });

  } catch (err) {
    console.error("❌ Error removing patient:", err);

    res.status(500).json({
      success: false,
      message: "Error removing patient."
    });
  }
});

app.get('/api/patients/all/:doctor_id', async (req, res) => {
  const { doctor_id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        p.*,

        CASE 
          WHEN dpa.doctor_id = $1 AND dpa.is_active = true THEN true
          ELSE false
        END AS assigned_to_me,

        CASE 
          WHEN dpa.doctor_id IS NOT NULL 
           AND dpa.doctor_id <> $1 
           AND dpa.is_active = true THEN true
          ELSE false
        END AS assigned_to_other,

        u.username AS assigned_doctor_name

      FROM patients p

      LEFT JOIN doctor_patient_assignments dpa
        ON dpa.patient_id = p.id
        AND dpa.is_active = true

      LEFT JOIN users u
        ON u.id = dpa.doctor_id

      ORDER BY p.created_at DESC
      `,
      [doctor_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error getting all patients:", err);

    res.status(500).json({
      success: false,
      message: "Error getting all patients."
    });
  }
});

app.get('/api/doctors/:doctor_id/my-patients', async (req, res) => {
  const { doctor_id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        p.*,
        dpa.assigned_at,
        true AS assigned_to_me
      FROM doctor_patient_assignments dpa
      JOIN patients p ON p.id = dpa.patient_id
      WHERE dpa.doctor_id = $1
      AND dpa.is_active = true
      ORDER BY dpa.assigned_at DESC
      `,
      [doctor_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error getting my patients:", err);

    res.status(500).json({
      success: false,
      message: "Error getting my patients."
    });
  }
});

app.get('/api/patients/:patientId/sessions', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;

  try {
    const values = [patientId];
    let query = `
      SELECT 
        id,
        game_mode,
        score,
        selectivity_index,
        coactivation_ratio,
        fatigue_trend,
        control_efficiency,
        pdf_url,
        created_at
      FROM emg_sessions
      WHERE patient_id = $1
    `;

  if (date) {
  values.push(date);
  query += ` AND created_at >= ($${values.length}::date)`;

  values.push(date);
  query += ` AND created_at < ($${values.length}::date + INTERVAL '1 day')`;
}

console.log("SESSION HISTORY FILTER:", {
  patientId,
  date
});
    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error getting patient sessions:", err);
    res.status(500).json({
      success: false,
      message: "Error getting patient sessions."
    });
  }
});
app.get('/api/patients/:patientId/sessions', async (req, res) => {
  const { patientId } = req.params;
  const { from, to, mode } = req.query;

  try {
    const values = [patientId];

    let query = `
      SELECT 
        id,
        game_mode,
        score,
        selectivity_index,
        coactivation_ratio,
        fatigue_trend,
        control_efficiency,
        pdf_url,
        created_at
      FROM emg_sessions
      WHERE patient_id = $1
    `;

    if (from) {
      values.push(from);
      query += ` AND created_at >= $${values.length}`;
    }

    if (to) {
      values.push(to);
      query += ` AND created_at <= $${values.length}`;
    }

    if (mode) {
      values.push(mode);
      query += ` AND game_mode = $${values.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error getting patient sessions:", err);
    res.status(500).json({
      success: false,
      message: "Error getting patient sessions."
    });
  }
});
app.get('/api/sessions/:sessionId/report-data', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const sessionResult = await pool.query(
      `
      SELECT 
        s.*,
        p.name,
        p.age,
        p.affected_side,
        p.condition
      FROM emg_sessions s
      JOIN patients p ON p.id = s.patient_id
      WHERE s.id = $1
      `,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const samplesResult = await pool.query(
      `
      SELECT 
        timestamp AS t,
        val_a AS a,
        val_b AS b
      FROM emg_samples
      WHERE session_id = $1
      ORDER BY timestamp ASC
      `,
      [sessionId]
    );

    res.json({
      success: true,
      session: sessionResult.rows[0],
      samples: samplesResult.rows
    });

  } catch (err) {
    console.error("❌ Error getting report data:", err);
    res.status(500).json({ success: false, message: "Error getting report data" });
  }
});

// Inicia el servidor escuchando en todas las interfaces de red.
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Servidor Kawatek activo en puerto ${PORT}`));
