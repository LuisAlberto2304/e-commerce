/**
 * Script de verificación de configuración de Firebase
 * Ejecuta este archivo en la consola del navegador para verificar la configuración
 */

// Verificar que Firebase esté inicializado
console.log('🔍 Verificando configuración de Firebase...\n');

// 1. Verificar que auth esté disponible
if (typeof auth !== 'undefined') {
    console.log('✅ Firebase Auth está inicializado');
    console.log('   - Auth Domain:', auth.config.authDomain);
    console.log('   - API Key:', auth.config.apiKey ? '✅ Configurado' : '❌ No configurado');
} else {
    console.error('❌ Firebase Auth NO está inicializado');
}

// 2. Verificar proveedores de autenticación disponibles
console.log('\n📋 Verificando proveedores de autenticación...');

// 3. Intentar crear un GoogleAuthProvider
try {
    const { GoogleAuthProvider } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    console.log('✅ GoogleAuthProvider está disponible');
    console.log('   - Scopes:', provider.scopes || 'Ninguno configurado');
} catch (error) {
    console.error('❌ Error al crear GoogleAuthProvider:', error);
}

// 4. Verificar el dominio actual
console.log('\n🌐 Información del dominio:');
console.log('   - Dominio actual:', window.location.hostname);
console.log('   - Protocolo:', window.location.protocol);
console.log('   - Puerto:', window.location.port || 'default');

// 5. Verificar si los popups están bloqueados
console.log('\n🪟 Verificando configuración de popups...');
const testPopup = window.open('', '_blank', 'width=1,height=1');
if (testPopup) {
    console.log('✅ Los popups están permitidos');
    testPopup.close();
} else {
    console.warn('⚠️  Los popups están bloqueados. Esto puede causar problemas con Google Sign-In.');
    console.log('   Solución: Permite popups para este sitio o usa el método redirect.');
}

console.log('\n✨ Verificación completada');
console.log('\n📝 Próximos pasos:');
console.log('1. Si ves errores arriba, revisa la configuración de Firebase');
console.log('2. Verifica que Google Sign-In esté habilitado en Firebase Console');
console.log('3. Asegúrate de que el dominio actual esté en la lista de dominios autorizados');
console.log('4. Si los popups están bloqueados, permite popups o usa signInWithGoogle(true)');
