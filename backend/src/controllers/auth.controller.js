// src/controllers/auth.controller.js
// Controladores delgados: solo reciben el request,
// llaman al servicio y devuelven la respuesta.

import { loginWithAzure, loginWithGoogle } from '../services/auth.service.js';
import { env } from '../config/env.js';

// POST /api/auth/login
// Recibe datos para login y devuelve nuestro JWT
export async function login(req, res, next) {
  try {
    const { correo, googleId } = req.body;

    if (!correo) {
      return res.status(400).json({ error: 'El correo es requerido' });
    }

    const result = await loginWithAzure({ correo, microsoftId: googleId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
// Devuelve los datos del usuario autenticado (desde el JWT)
export function me(req, res) {
  res.json({ user: req.user });
}

// POST /api/auth/google/callback
// Recibe el token de Google (JWT) y devuelve nuestro JWT
export async function googleCallback(req, res, next) {
  try {
    console.log('🌐 [GOOGLE CALLBACK] Solicitud recibida');
    console.log('📨 Headers:', req.headers);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    
    const { credential } = req.body;
    if (!credential) {
      console.error('❌ [ERROR] No hay "credential" en el body');
      console.error('   Se esperaba: { credential: "idToken..." }');
      console.error('   Se recibió:', Object.keys(req.body));
      return res.status(400).json({ 
        error: 'Token de Google requerido',
        received: Object.keys(req.body),
        expected: ['credential']
      });
    }

    console.log('✅ Token recibido, longitud:', credential.length);
    console.log('🔐 Verificando token contra Google API...');
    
    const result = await loginWithGoogle({ idToken: credential });
    
    console.log('✅ Login exitoso');
    console.log('👤 Usuario:', result.user.correo);
    res.json(result);
  } catch (err) {
    console.error('❌ [ERROR en googleCallback]');
    console.error('   Mensaje:', err.message);
    console.error('   Stack:', err.stack);
    next(err);
  }
}
