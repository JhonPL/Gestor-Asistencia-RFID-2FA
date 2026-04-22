// src/routes/auth.routes.js

import { Router } from 'express';
import { verifyAzureToken, verifyJwt } from '../middlewares/auth.js';
import { login, loginDev, me } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Autenticación Microsoft OAuth y sesión propia
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login con token de Microsoft Azure AD
 *     description: |
 *       Recibe el Bearer token emitido por Azure AD, lo valida con las claves
 *       públicas JWKS de Microsoft, busca el correo en la tabla `persona` y
 *       devuelve un JWT propio para usar en el resto de endpoints.
 *     security:
 *       - AzureToken: []
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Token de Microsoft inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Correo no registrado en el sistema o cuenta desactivada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', verifyAzureToken, login);

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

export default router;
