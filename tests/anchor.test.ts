use anchor_lang::prelude::*;

// ID del programa - Identificador único en la red de Solana.
// Se genera automáticamente al realizar el primer "Deploy".
declare_id!("DvEGSpp3GQLWqPb9o3djhhheNNXdMP6sEbPX14ALajjh");

#[program]
pub mod movil_center {
    use super::*;

    /// INSTRUCCIÓN: registrar_celular
    /// Esta función inicializa una cuenta en la blockchain para un dispositivo móvil.
    /// @param ctx: Contexto que incluye las cuentas necesarias para la transacción.
    /// @param imei: Número de serie único que servirá como semilla (seed) para la PDA.
    /// @param modelo: Nombre comercial del equipo (ej. iPhone, Samsung).
    pub fn registrar_celular(
        ctx: Context<RegistrarCelular>,
        imei: String,
        modelo: String,
    ) -> Result<()> {
        // Obtenemos una referencia mutable a la cuenta que estamos creando
        let celular = &mut ctx.accounts.celular;

        // Persistencia de datos: Guardamos la información recibida en el almacenamiento on-chain
        celular.imei = imei;
        celular.modelo = modelo;
        
        // Almacenamos la llave pública del técnico que firma la transacción para auditoría futura
        celular.tecnico = *ctx.accounts.tecnico.key; 
        
        // Estado inicial por defecto para todo equipo que ingresa al sistema
        celular.estado = "Ingresado: Diagnóstico pendiente".to_string();

        // Log de sistema para verificar el éxito de la operación en el explorador de Solana
        msg!("Registro exitoso para el equipo con IMEI: {}", celular.imei);
        Ok(())
    }

    /// INSTRUCCIÓN: actualizar_reparacion
    /// Permite al técnico responsable modificar el estado de avance del servicio.
    /// @param ctx: Contexto que valida la identidad del técnico y la cuenta del celular.
    /// @param nuevo_estado: Texto que describe la acción realizada (ej. 'Pantalla cambiada').
    pub fn actualizar_reparacion(
        ctx: Context<ActualizarReparacion>,
        nuevo_estado: String,
    ) -> Result<()> {
        let celular = &mut ctx.accounts.celular;

        // Actualización del estado en la cuenta persistente
        celular.estado = nuevo_estado;

        msg!("Actualización guardada. Nuevo estado: {}", celular.estado);
        Ok(())
    }
}

// --- ESTRUCTURAS DE VALIDACIÓN (CONTEXTOS) ---

#[derive(Accounts)]
#[instruction(imei: String)]
pub struct RegistrarCelular<'info> {
    /// PDA (Program Derived Address):
    /// Creamos la cuenta usando el IMEI como 'seed'. Esto garantiza que:
    /// 1. Solo exista UNA cuenta por cada IMEI.
    /// 2. No necesitamos llaves privadas para esta cuenta de datos.
    /// 'space' calcula el tamaño en bytes: 8 (disc) + 32 (pubkey) + 64 (imei) + 100 (modelo) + 32 (estado)
    #[account(
        init, 
        payer = tecnico, 
        space = 8 + 32 + 64 + 100 + 32, 
        seeds = [imei.as_bytes()], 
        bump
    )]
    pub celular: Account<'info, CelularData>,

    /// El técnico debe firmar la transacción y pagar la 'Renta' de la cuenta creada.
    #[account(mut)]
    pub tecnico: Signer<'info>, 

    /// Programa del sistema necesario para la creación de cuentas en Solana.
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ActualizarReparacion<'info> {
    /// REGLA DE SEGURIDAD: 'has_one = tecnico'
    /// Verifica automáticamente que la llave pública del técnico que firma 
    /// coincida con la que se guardó al registrar el celular originalmente.
    #[account(mut, has_one = tecnico)]
    pub celular: Account<'info, CelularData>,
    
    pub tecnico: Signer<'info>,
}

// --- MODELO DE DATOS (ESTADO) ---

/// Representa la información física que se almacena en los nodos de la red.
#[account]
pub struct CelularData {
    pub imei: String,    // Identificador único del dispositivo (Clave primaria lógica)
    pub modelo: String,  // Descripción del hardware
    pub estado: String,  // Bitácora de la reparación (Mutable)
    pub tecnico: Pubkey, // Dirección de la wallet del técnico responsable
}
