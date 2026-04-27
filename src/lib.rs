use anchor_lang::prelude::*;

// ID del programa - se actualiza automáticamente al hacer Deploy
declare_id!("DvEGSpp3GQLWqPb9o3djhhheNNXdMP6sEbPX14ALajjh");

#[program]
pub mod movil_center {
    use super::*;

    /// Registra un celular nuevo en la blockchain.
    /// Recibe el contexto, el IMEI (ID único) y el modelo del equipo.
    pub fn registrar_celular(
        ctx: Context<RegistrarCelular>,
        imei: String,
        modelo: String,
    ) -> Result<()> {
        let celular = &mut ctx.accounts.celular;

        // Asignamos los datos recibidos a la cuenta del celular
        celular.imei = imei;
        celular.modelo = modelo;
        celular.tecnico = *ctx.accounts.tecnico.key; // Guardamos quién lo registró
        celular.estado = "Ingresado: Diagnóstico pendiente".to_string();

        msg!("Registro exitoso para el equipo con IMEI: {}", celular.imei);
        Ok(())
    }

    /// Permite al técnico actualizar el proceso de la reparación (ej. 'Pantalla lista').
    pub fn actualizar_reparacion(
        ctx: Context<ActualizarReparacion>,
        nuevo_estado: String,
    ) -> Result<()> {
        let celular = &mut ctx.accounts.celular;

        // Actualizamos el string del estado con la nueva información
        celular.estado = nuevo_estado;

        msg!("Actualización guardada. Nuevo estado: {}", celular.estado);
        Ok(())
    }
}

// --- DEFINICIÓN DE LAS CUENTAS (ESTRUCTURAS) ---

#[derive(Accounts)]
#[instruction(imei: String)]
pub struct RegistrarCelular<'info> {
    /// Creamos la cuenta usando el IMEI como 'seed' para que sea única por celular.
    /// 'space' define el tamaño en bytes que ocupará en la red (ajustado para textos).
    #[account(
        init, 
        payer = tecnico, 
        space = 8 + 32 + 64 + 100 + 32, 
        seeds = [imei.as_bytes()], 
        bump
    )]
    pub celular: Account<'info, CelularData>,

    #[account(mut)]
    pub tecnico: Signer<'info>, // El técnico que paga por la creación de la cuenta
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActualizarReparacion<'info> {
    /// Validamos que solo el técnico que registró el celular pueda modificarlo.
    #[account(mut, has_one = tecnico)]
    pub celular: Account<'info, CelularData>,
    pub tecnico: Signer<'info>,
}

/// Estructura de datos que se almacena físicamente en la blockchain.
#[account]
pub struct CelularData {
    pub imei: String,    // Identificador único del dispositivo
    pub modelo: String,  // Marca y modelo (ej. iPhone 13)
    pub estado: String,  // Reporte actual de la reparación
    pub tecnico: Pubkey, // Llave pública (wallet) del responsable
}
