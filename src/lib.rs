use anchor_lang::prelude::*;

// ID de mi programa - lo actualizo después de mi primer deploy
declare_id!("GkPjx4E5k2Ljuycm4JnpWzZwLqNJvpKY9NSoeXrCPNw8");

#[program]
pub mod movil_center {
    use super::*;

    /// # 1. CREATE (Registro)
    /// Con esta función registro un equipo nuevo. 
    /// Mi lógica usa una PDA para que el IMEI sea el identificador único en la red.
    pub fn registrar_celular(
        ctx: Context<RegistrarCelular>,
        imei: String,
        modelo: String,
    ) -> Result<()> {
        let celular = &mut ctx.accounts.celular;

        // Aquí guardo la información que recibo del cliente
        celular.imei = imei;
        celular.modelo = modelo;
        celular.tecnico = *ctx.accounts.tecnico.key; // Registro que yo soy el responsable
        celular.estado = "Ingresado: Diagnóstico pendiente".to_string();
        
        // Guardo el bump para validar mi PDA más adelante si es necesario
        celular.bump = ctx.bumps.celular;

        msg!("He registrado con éxito el equipo. IMEI: {}", celular.imei);
        Ok(())
    }

    /// # 2. READ (Consulta)
    /// Aunque la lectura es mayormente desde el frontend, programé esta función
    /// para poder ver el estado del equipo directamente en los logs de la blockchain.
    pub fn leer_estado_celular(ctx: Context<LeerCelular>) -> Result<()> {
        let celular = &ctx.accounts.celular;
        msg!("Consultando mi registro: {}, Estado actual: {}", celular.modelo, celular.estado);
        Ok(())
    }

    /// # 3. UPDATE (Actualización)
    /// Uso esta función para actualizar el avance de la reparación. 
    /// Le puse una restricción de seguridad para que solo yo (el técnico original) pueda editarlo.
    pub fn actualizar_reparacion(
        ctx: Context<ActualizarReparacion>,
        nuevo_estado: String,
    ) -> Result<()> {
        let celular = &mut ctx.accounts.celular;
        
        // Actualizo el string del estado con la nueva información del trabajo
        celular.estado = nuevo_estado;

        msg!("He actualizado el estado a: {}", celular.estado);
        Ok(())
    }

    /// # 4. DELETE (Cierre de cuenta)
    /// Cuando entrego el equipo, uso esta función para cerrar la cuenta.
    /// Esto es clave porque me devuelve los SOL que pagué por el espacio (renta).
    pub fn eliminar_registro(_ctx: Context<EliminarCelular>) -> Result<()> {
        msg!("Servicio terminado: He cerrado la cuenta y recuperado mis fondos.");
        Ok(())
    }
}

// -------------------------------------------------------------------------
// MIS ESTRUCTURAS DE VALIDACIÓN (CONTEXTOS)
// -------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(imei: String)]
pub struct RegistrarCelular<'info> {
    /// Aquí configuro mi PDA:
    /// - Uso el IMEI como semilla (seed) para que sea único.
    /// - Calculo el espacio exacto (space) para no gastar SOL de más.
    #[account(
        init, 
        payer = tecnico, 
        space = 8 + 32 + 64 + 100 + 32 + 1, 
        seeds = [imei.as_bytes()], 
        bump
    )]
    pub celular: Account<'info, CelularData>,

    #[account(mut)]
    pub tecnico: Signer<'info>, // Yo firmo y pago la creación
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LeerCelular<'info> {
    /// Solo lectura, no necesito mutabilidad aquí
    pub celular: Account<'info, CelularData>,
}

#[derive(Accounts)]
pub struct ActualizarReparacion<'info> {
    /// 'has_one = tecnico' es mi seguro: verifica que mi llave pública coincida 
    /// con la que guardé al registrar el celular.
    #[account(
        mut, 
        has_one = tecnico, 
    )]
    pub celular: Account<'info, CelularData>,
    pub tecnico: Signer<'info>,
}

#[derive(Accounts)]
pub struct EliminarCelular<'info> {
    /// Con 'close = tecnico' me aseguro de que los SOL regresen a mi billetera.
    #[account(
        mut, 
        close = tecnico, 
        has_one = tecnico
    )]
    pub celular: Account<'info, CelularData>,
    pub tecnico: Signer<'info>,
}

// -------------------------------------------------------------------------
// MI ESTRUCTURA DE DATOS
// -------------------------------------------------------------------------

#[account]
pub struct CelularData {
    pub imei: String,    // Mi llave única
    pub modelo: String,  
    pub estado: String,  
    pub tecnico: Pubkey, // Mi dirección como responsable
    pub bump: u8,        
}
