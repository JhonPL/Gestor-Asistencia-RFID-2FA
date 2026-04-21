// src/routes/personas.routes.js

import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import * as ctrl from '../controllers/personas.controller.js';

const router = Router();

// Todas las rutas de personas requieren JWT + rol administrador
router.use(verifyJwt, requireRole('administrador'));

/**
 * @openapi
 * tags:
 *   - name: Personas
 *     description: Gestión de docentes, estudiantes y administradores (solo administrador)
 */

/**
 * @openapi
 * /api/personas:
 *   get:
 *     tags: [Personas]
 *     summary: Listar personas
 *     description: Devuelve todas las personas con filtros opcionales.
 *     parameters:
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [docente, estudiante, administrador]
 *         description: Filtrar por rol
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, apellido o correo (ILIKE)
 *     responses:
 *       200:
 *         description: Lista de personas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Persona'
 *       401:
 *         description: Token faltante o inválido
 *       403:
 *         description: Rol insuficiente
 */
router.get('/', ctrl.getAll);

/**
 * @openapi
 * /api/personas/{id}:
 *   get:
 *     tags: [Personas]
 *     summary: Obtener una persona por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Datos de la persona
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Persona'
 *       404:
 *         description: Persona no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', ctrl.getOne);

/**
 * @openapi
 * /api/personas:
 *   post:
 *     tags: [Personas]
 *     summary: Crear una persona
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonaInput'
 *     responses:
 *       201:
 *         description: Persona creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Persona'
 *       400:
 *         description: Datos inválidos o faltantes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: El correo ya está registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', ctrl.create);

/**
 * @openapi
 * /api/personas/{id}:
 *   patch:
 *     tags: [Personas]
 *     summary: Actualizar campos de una persona (PATCH parcial)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               correo:
 *                 type: string
 *                 format: email
 *               activo:
 *                 type: boolean
 *               programa_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Persona actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Persona'
 *       404:
 *         description: Persona no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', ctrl.update);

/**
 * @openapi
 * /api/personas/{id}/tarjeta:
 *   patch:
 *     tags: [Personas]
 *     summary: Vincular o desvincular tarjeta RFID
 *     description: Enviar codigo_tarjeta con valor null para desvincular.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo_tarjeta:
 *                 type: string
 *                 nullable: true
 *                 example: RFID-A1B2
 *     responses:
 *       200:
 *         description: Tarjeta vinculada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 codigo_tarjeta:
 *                   type: string
 *                   nullable: true
 *       409:
 *         description: El codigo_tarjeta ya pertenece a otra persona
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/tarjeta', ctrl.linkCard);

export default router;
