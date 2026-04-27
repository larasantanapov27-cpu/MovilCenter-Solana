// Datos de prueba
const imeiCelular = "IMEI-XYZ-2026";
const modeloCelular = "Samsung Galaxy S24";

// 1. Calculamos la dirección de la cuenta (PDA)
// Importante: En tu Rust usaste solo el imei como seed: seeds = [imei.as_bytes()]
const [celularPDA] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from(imeiCelular)],
  pg.program.programId
);

async function ejecutarSistema() {
  console.log("🚀 Iniciando sistema MovilCenter...");

  try {
    // 2. Llamamos a registrar_celular
    console.log("Enviando registro a la blockchain...");
    await pg.program.methods
      .registrarCelular(imeiCelular, modeloCelular)
      .accounts({
        celular: celularPDA,
        tecnico: pg.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ ¡Celular registrado exitosamente!");

    // 3. Consultamos la cuenta para ver que los datos estén ahí
    const datos = await pg.program.account.celularData.fetch(celularPDA);
    console.log(`📱 Equipo: ${datos.modelo}`);
    console.log(`🛠️ Estado: ${datos.estado}`);

    // 4. Probamos la actualización
    console.log("Actualizando a: 'Reparación finalizada'...");
    await pg.program.methods
      .actualizarReparacion("Reparación finalizada - Listo para entrega")
      .accounts({
        celular: celularPDA,
        tecnico: pg.wallet.publicKey,
      })
      .rpc();

    const datosFinales = await pg.program.account.celularData.fetch(celularPDA);
    console.log(`✅ Nuevo estado: ${datosFinales.estado}`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// ESTA LÍNEA ES LA MÁS IMPORTANTE PARA QUE EL BOTÓN 'RUN' HAGA ALGO
ejecutarSistema();
