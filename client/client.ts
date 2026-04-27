// Mis datos de prueba para el flujo
const imeiCelular = "IMEI-XYZ-2026";
const modeloCelular = "Samsung Galaxy S24";

// 1. Calculo la dirección de mi cuenta (PDA)
// Uso el IMEI como semilla tal cual lo definí en mi contrato de Rust
const [celularPDA] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from(imeiCelular)],
  pg.program.programId
);

async function ejecutarSistema() {
  console.log("🚀 Iniciando mi sistema MovilCenter...");

  try {
    // --- CREATE ---
    // Llamo a mi función para registrar el celular en la blockchain
    console.log("1. Enviando registro a la blockchain...");
    await pg.program.methods
      .registrarCelular(imeiCelular, modeloCelular)
      .accounts({
        celular: celularPDA,
        tecnico: pg.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("✅ ¡Celular registrado exitosamente!");

    // --- READ ---
    // Consulto la cuenta PDA para verificar que mis datos se guardaron bien
    console.log("2. Consultando datos guardados...");
    const datos = await pg.program.account.celularData.fetch(celularPDA);
    console.log(`📱 Mi equipo: ${datos.modelo}`);
    console.log(`🛠️ Mi estado inicial: ${datos.estado}`);

    // También pruebo mi función de lectura on-chain (la que tira logs en la red)
    await pg.program.methods
      .leerEstadoCelular()
      .accounts({
        celular: celularPDA,
      })
      .rpc();

    // --- UPDATE ---
    // Actualizo el estado de la reparación
    console.log("3. Actualizando estado a: 'Reparación finalizada'...");
    await pg.program.methods
      .actualizarReparacion("Reparación finalizada - Listo para entrega")
      .accounts({
        celular: celularPDA,
        tecnico: pg.wallet.publicKey,
      })
      .rpc();

    const datosActualizados = await pg.program.account.celularData.fetch(celularPDA);
    console.log(`✅ Mi nuevo estado: ${datosActualizados.estado}`);

    // --- DELETE ---
    // Finalmente, cierro la cuenta para recuperar mis SOL (Rent)
    console.log("4. Cerrando cuenta y recuperando fondos...");
    await pg.program.methods
      .eliminarRegistro()
      .accounts({
        celular: celularPDA,
        tecnico: pg.wallet.publicKey,
      })
      .rpc();
    
    console.log("✅ Cuenta cerrada con éxito. ¡CRUD completado!");

    // Verificación final: Intento leer la cuenta para confirmar que ya no existe
    try {
      await pg.program.account.celularData.fetch(celularPDA);
    } catch (e) {
      console.log("ℹ️ Confirmado: La cuenta ya no existe en la red.");
    }

  } catch (error) {
    console.error("❌ Tuve un error en el proceso:", error);
  }
}

// Ejecuto mi flujo completo
ejecutarSistema();
