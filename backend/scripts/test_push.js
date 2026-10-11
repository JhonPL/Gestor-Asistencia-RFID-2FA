// backend/scripts/test_push.js
// Script para probar el envío de notificaciones push de Expo directamente.
//
// Uso:
//   node scripts/test_push.js              -> Prueba con el primer estudiante que tenga push_token activo
//   node scripts/test_push.js [persona_id] -> Prueba con el estudiante indicado

import { pool } from '../src/config/db.js';
import { sendPushNotification, isExpoPushToken } from '../src/services/notifications.service.js';

async function main() {
  const targetPersonaId = process.argv[2] ? parseInt(process.argv[2], 10) : null;

  console.log('======================================================');
  console.log('🚀 Diagnóstico y Prueba de Notificaciones Push (Expo)');
  console.log('======================================================\n');

  try {
    // 1. Consultar dispositivos móviles registrados
    const { rows: dispositivos } = await pool.query(`
      SELECT 
        dm.id as dispositivo_id,
        dm.persona_id,
        p.nombre,
        p.apellido,
        p.correo,
        dm.push_token,
        dm.plataforma,
        dm.activo,
        dm.ultima_sesion
      FROM dispositivo_movil dm
      JOIN persona p ON p.id = dm.persona_id
      ORDER BY dm.id DESC
    `);

    if (dispositivos.length === 0) {
      console.warn('⚠️  No hay dispositivos móviles registrados en la tabla `dispositivo_movil`.');
      console.warn('   Inicia sesión con un estudiante en la app móvil para registrar su dispositivo.\n');
      process.exit(0);
    }

    console.log(`Dispositivos registrados encontrados (${dispositivos.length}):`);
    dispositivos.forEach((d, idx) => {
      const isExpo = isExpoPushToken(d.push_token);
      console.log(`  [${idx + 1}] ID Persona: ${d.persona_id} | ${d.nombre} ${d.apellido} (${d.correo})`);
      console.log(`      Plataforma: ${d.plataforma} | Activo: ${d.activo ? 'Sí' : 'No'}`);
      console.log(`      Token: ${d.push_token}`);
      console.log(`      ¿Formato Expo Válido?: ${isExpo ? '✅ Sí' : '❌ No (es simulador o token offline)'}\n`);
    });

    // 2. Seleccionar dispositivo para la prueba
    let target = null;
    if (targetPersonaId) {
      target = dispositivos.find((d) => d.persona_id === targetPersonaId);
      if (!target) {
        console.error(`❌ No se encontró ningún dispositivo para la persona_id = ${targetPersonaId}`);
        process.exit(1);
      }
    } else {
      // Buscar el primero con token válido de Expo
      target = dispositivos.find((d) => isExpoPushToken(d.push_token) && d.activo);
      if (!target) {
        target = dispositivos[0];
      }
    }

    console.log(`🎯 Probando envío a: ${target.nombre} ${target.apellido} (Persona ID: ${target.persona_id})`);
    console.log(`   Push Token: ${target.push_token}\n`);

    if (!isExpoPushToken(target.push_token)) {
      console.warn(`⚠️  El token no es un ExponentPushToken real. Expo no podrá entregar la notificación.`);
      console.warn(`   Asegúrate de ejecutar la app en un dispositivo físico con un Development Build o APK Preview.`);
    }

    const mockCurso = {
      codigo: 'ING-401',
      nombre: 'Prueba de Asistencia SmartClass',
      aula: 'Aula 204 - Bloque B',
      docente: 'Prof. Demo',
      hora_inicio: '08:00',
      hora_fin: '10:00',
    };

    const mockAsistenciaId = 999999;

    console.log('Enviando solicitud a Expo Push API...');
    const result = await sendPushNotification(target.push_token, mockAsistenciaId, mockCurso);

    console.log('\n--- RESULTADO ---');
    if (result.ok) {
      console.log('✅ ¡Notificación aceptada por Expo!');
      console.log(`   Ticket ID: ${result.ticket?.id ?? 'N/A'}`);
      console.log('   Si tu teléfono tiene la app instalada y credenciales FCM válidas, sonará en breve.');
    } else {
      console.error('❌ Falló el envío de la notificación:');
      console.error(`   Error: ${result.error}`);
      if (result.ticket) {
        console.error(`   Ticket Error Details:`, result.ticket);
      }
    }
  } catch (err) {
    console.error('❌ Excepción durante la prueba:', err);
  } finally {
    await pool.end();
  }
}

main();
