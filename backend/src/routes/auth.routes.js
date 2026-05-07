// src/routes/auth.routes.js

import { Router } from 'express';
import { verifyAzureToken, verifyJwt } from '../middlewares/auth.js';
import { login, loginDev, me, googleCallback } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Autenticación con Google OAuth 2.0 y sesión propia
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login genérico (deprecado - usar /google/callback)
 *     description: |
 *       Endpoint genérico de login. Se recomienda usar /api/auth/google/callback
 *       para autenticación con Google OAuth 2.0.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               googleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       403:
 *         description: Correo no registrado en el sistema o cuenta desactivada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/login-dev:
 *   post:
 *     tags: [Auth]
 *     summary: Login simulado (solo en NODE_ENV=development)
 *     description: |
 *       Permite iniciar sesión enviando únicamente el correo institucional,
 *       **sin validar token de Azure**. Útil mientras no está configurado el
 *       tenant de Azure AD. Este endpoint devuelve 404 en producción.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [correo]
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: carlos.ramirez@campusucc.edu.co
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       403:
 *         description: Correo no registrado o cuenta desactivada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Endpoint no disponible en producción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login-dev', loginDev);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Datos del usuario autenticado
 *     description: Devuelve los claims del JWT propio actualmente activo.
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserMe'
 *       401:
 *         description: Token faltante, inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', verifyJwt, me);

/**
 * @openapi
 * /api/auth/google/callback:
 *   post:
 *     tags: [Auth]
 *     summary: Callback de OAuth 2.0 con Google
 *     description: |
 *       Recibe el JWT token (credential) de Google emitido por el cliente JavaScript,
 *       lo valida contra los servidores de Google, extrae el email y devuelve un JWT propio.
 *       Si el correo no existe en el sistema, se crea automáticamente como estudiante.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential:
 *                 type: string
 *                 description: JWT token de Google (id_token del client-side flow)
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Token faltante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token de Google inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cuenta desactivada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/google/callback', googleCallback);

export default router;
