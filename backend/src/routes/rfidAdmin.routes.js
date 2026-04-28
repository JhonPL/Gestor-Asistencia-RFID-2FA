// backend/src/routes/rfidAdmin.routes.js
// Endpoints para el flujo de vinculación de tarjetas RFID desde el panel admin.
//
// POST /api/rfid/scan-admin  — lo llama el ESP32 en modo LECTURA (sin JWT)
// GET  /api/rfid/ultimo-scan/:codigoDispositivo — lo consulta el panel admin por polling

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

// ── Almacén en memoria ────────────────────────────────────────
// Estructura: { [codigo_dispositivo]: { uid: string, timestamp: number } }
// Se limpia automáticamente en el GET (one-time read) o al expirar (30 s).
const ultimosScans = {};

// Tiempo máximo de validez de un UID guardado (ms)
const TTL_MS = 30_000;

/**
 * @openapi
 * /api/rfid/scan-admin:
 *   post:
 *     tags: [RFID]
 *     summary: Recibir UID enviado por el ESP32 en modo LECTURA
 *     description: |
 *       El ESP32 llama a este endpoint (sin JWT) cuando está en modo LECTURA
 *       y detecta una tarjeta. El backend guarda el UID en memoria durante
 *       30 segundos para que el panel admin lo capture por polling.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo_dispositivo, codigo_tarjeta]
 *             properties:
 *               codigo_dispositivo:
 *                 type: string
 *                 example: ESP32-01
 *               codigo_tarjeta:
 *                 type: string
 *                 example: A3 2F 1B 09
 *     responses:
 *       200:
 *         description: UID recibido y guardado en memoria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkResponse'
 *       400:
 *         description: Faltan campos requeridos
 */
router.post('/scan-admin', (req, res) => {
  const { codigo_dispositivo, codigo_tarjeta } = req.body;

  if (!codigo_dispositivo || !codigo_tarjeta) {
    return res.status(400).json({
      error: 'codigo_dispositivo y codigo_tarjeta son requeridos',
    });
  }

  ultimosScans[codigo_dispositivo] = {
    uid:       codigo_tarjeta,
    timestamp: Date.now(),
  };

  console.log(`[scan-admin] UID recibido de ${codigo_dispositivo}: ${codigo_tarjeta}`);

  return res.json({ ok: true });
});

/**
 * @openapi
 * /api/rfid/ultimo-scan/{codigoDispositivo}:
 *   get:
 *     tags: [RFID]
 *     summary: Obtener el último UID escaneado por un dispositivo (polling del admin)
 *     description: |
 *       El panel admin llama a este endpoint cada 2 segundos mientras espera
 *       que el ESP32 en modo LECTURA envíe un UID. Si hay un UID válido (menos
 *       de 30 s de antigüedad) lo devuelve y lo elimina de memoria para que no
 *       pueda reutilizarse. Requiere JWT con rol administrador.
 *     parameters:
 *       - in: path
 *         name: codigoDispositivo
 *         required: true
 *         schema:
 *           type: string
 *         example: ESP32-01
 *     responses:
 *       200:
 *         description: UID disponible o null si no hay nada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   nullable: true
 *                   example: A3 2F 1B 09
 *       401:
 *         description: Token faltante o inválido
 *       403:
 *         description: Rol insuficiente
 */
router.get(
  '/ultimo-scan/:codigoDispositivo',
  verifyJwt,
  requireRole('administrador'),
  (req, res) => {
    const { codigoDispositivo } = req.params;
    const entry = ultimosScans[codigoDispositivo];

    // Sin entrada o entrada expirada
    if (!entry || Date.now() - entry.timestamp > TTL_MS) {
      delete ultimosScans[codigoDispositivo]; // limpiar si expiró
      return res.json({ uid: null });
    }

    // Devolver el UID y borrarlo (one-time read)
    const uid = entry.uid;
    delete ultimosScans[codigoDispositivo];

    console.log(`[ultimo-scan] UID entregado al admin para ${codigoDispositivo}: ${uid}`);

    return res.json({ uid });
  },
);

export default router;