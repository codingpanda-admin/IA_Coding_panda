const { query } = require('./connection.service');

const generarCotizacionAuto = async (datos) => {
    const { marca, modelo, anio, valor, tipoCobertura = 'Cobertura Amplia', zonaId, clienteId = null } = datos;
    
    try {
        const marcaInfo = await query('SELECT factor_riesgo FROM marcas_vehiculos WHERE nombre = ?', [marca]);
        const factorMarca = marcaInfo[0]?.factor_riesgo || 1.0;
        
        const zonaInfo = await query('SELECT factor_riesgo FROM zonas WHERE id = ?', [zonaId]);
        const factorZona = zonaInfo[0]?.factor_riesgo || 1.0;
        
        const tipoAuto = await query('SELECT id FROM tipos_seguros WHERE codigo = ?', ['AUTO']);
        const tipoAutoId = tipoAuto[0]?.id;
        
        const tarifa = await query('SELECT prima_base FROM tarifas WHERE tipo_seguro_id = ? AND nombre = ? AND activo = TRUE', [tipoAutoId, tipoCobertura]);
        const primaBase = tarifa[0]?.prima_base || 8500;
        
        const antiguedad = new Date().getFullYear() - anio;
        let factorAntiguedad = 1.0;
        if (antiguedad <= 0) factorAntiguedad = 0.90;
        else if (antiguedad <= 3) factorAntiguedad = 1.00;
        else if (antiguedad <= 5) factorAntiguedad = 1.10;
        else if (antiguedad <= 10) factorAntiguedad = 1.20;
        else factorAntiguedad = 1.35;
        
        const factorValor = valor ? (valor / 300000) : 1.0;
        const primaNeta = primaBase * factorMarca * factorZona * factorAntiguedad * Math.max(0.5, Math.min(2.0, factorValor));
        
        const configIVA = await query('SELECT valor FROM configuracion WHERE clave = ?', ['IVA_PORCENTAJE']);
        const ivaPorcentaje = parseFloat(configIVA[0]?.valor || 16) / 100;
        const iva = primaNeta * ivaPorcentaje;
        const primaTotal = primaNeta + iva;
        
        const prefijoRes = await query('SELECT valor FROM configuracion WHERE clave = ?', ['PREFIJO_COTIZACION']);
        const prefijo = prefijoRes[0]?.valor || 'COT';
        const numeroCotizacion = `${prefijo}-${Date.now()}`;
        
        await query(`
            INSERT INTO cotizaciones (numero_cotizacion, cliente_id, tipo_seguro_id, prima_neta, iva, prima_total, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            numeroCotizacion, clienteId, tipoAutoId, primaNeta.toFixed(2), iva.toFixed(2), primaTotal.toFixed(2),
            JSON.stringify({ marca, modelo, anio, valor, tipoCobertura, factores: { marca: factorMarca, zona: factorZona, antiguedad: factorAntiguedad, valor: factorValor }})
        ]);
        
        return {
            numeroCotizacion,
            vehiculo: { marca, modelo, anio, valor },
            cobertura: tipoCobertura,
            primaNeta: parseFloat(primaNeta.toFixed(2)),
            iva: parseFloat(iva.toFixed(2)),
            primaTotal: parseFloat(primaTotal.toFixed(2)),
            primaAnual: parseFloat(primaTotal.toFixed(2)),
            primaMensual: parseFloat((primaTotal / 12).toFixed(2)),
            factoresAplicados: { marca: factorMarca, zona: factorZona, antiguedad: factorAntiguedad, valor: factorValor.toFixed(2) },
            vigencia: '1 año',
            fechaCotizacion: new Date().toISOString()
        };
    } catch (error) {
        console.error(`[DB ERROR] Error generando cotización: ${error.message}`);
        throw error;
    }
};

module.exports = { generarCotizacionAuto };