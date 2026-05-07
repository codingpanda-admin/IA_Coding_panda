// services/database/init.service.js
const { query } = require('./connection.service');

const createTables = async () => {
    console.log(`[DB] Verificando y creando tablas...`);
    
    const tables = [
        `CREATE TABLE IF NOT EXISTS tipos_seguros (
            id INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(50) UNIQUE NOT NULL, nombre VARCHAR(100) NOT NULL, descripcion TEXT, activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS coberturas (
            id INT AUTO_INCREMENT PRIMARY KEY, tipo_seguro_id INT NOT NULL, codigo VARCHAR(50) NOT NULL, nombre VARCHAR(150) NOT NULL, descripcion TEXT, suma_asegurada_min DECIMAL(15,2) DEFAULT 0, suma_asegurada_max DECIMAL(15,2) DEFAULT 0, deducible_porcentaje DECIMAL(5,2) DEFAULT 0, activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (tipo_seguro_id) REFERENCES tipos_seguros(id) ON DELETE CASCADE, UNIQUE KEY unique_cobertura (tipo_seguro_id, codigo)
        )`,
        `CREATE TABLE IF NOT EXISTS tarifas (
            id INT AUTO_INCREMENT PRIMARY KEY, tipo_seguro_id INT NOT NULL, cobertura_id INT, nombre VARCHAR(100) NOT NULL, prima_base DECIMAL(15,2) NOT NULL, factor_edad DECIMAL(8,4) DEFAULT 1.0000, factor_antiguedad DECIMAL(8,4) DEFAULT 1.0000, factor_zona DECIMAL(8,4) DEFAULT 1.0000, vigencia_inicio DATE, vigencia_fin DATE, activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (tipo_seguro_id) REFERENCES tipos_seguros(id) ON DELETE CASCADE, FOREIGN KEY (cobertura_id) REFERENCES coberturas(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS zonas (
            id INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(20) UNIQUE NOT NULL, nombre VARCHAR(100) NOT NULL, factor_riesgo DECIMAL(8,4) DEFAULT 1.0000, activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS clientes (
            id INT AUTO_INCREMENT PRIMARY KEY, numero_cliente VARCHAR(50) UNIQUE, nombre VARCHAR(100) NOT NULL, apellido_paterno VARCHAR(100), apellido_materno VARCHAR(100), fecha_nacimiento DATE, genero ENUM('M', 'F', 'O') DEFAULT 'O', email VARCHAR(150), telefono VARCHAR(20), direccion TEXT, codigo_postal VARCHAR(10), zona_id INT, rfc VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS vehiculos (
            id INT AUTO_INCREMENT PRIMARY KEY, cliente_id INT, marca VARCHAR(50) NOT NULL, modelo VARCHAR(100) NOT NULL, anio INT NOT NULL, version VARCHAR(100), numero_serie VARCHAR(50), placas VARCHAR(20), color VARCHAR(30), uso ENUM('particular', 'comercial', 'taxi', 'uber') DEFAULT 'particular', valor_factura DECIMAL(15,2), valor_comercial DECIMAL(15,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS cotizaciones (
            id INT AUTO_INCREMENT PRIMARY KEY, numero_cotizacion VARCHAR(50) UNIQUE NOT NULL, cliente_id INT, tipo_seguro_id INT NOT NULL, vehiculo_id INT, fecha_cotizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP, fecha_vigencia_inicio DATE, fecha_vigencia_fin DATE, prima_neta DECIMAL(15,2) NOT NULL, recargo DECIMAL(15,2) DEFAULT 0, descuento DECIMAL(15,2) DEFAULT 0, iva DECIMAL(15,2) DEFAULT 0, prima_total DECIMAL(15,2) NOT NULL, estatus ENUM('pendiente', 'aprobada', 'rechazada', 'emitida', 'cancelada') DEFAULT 'pendiente', notas TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL, FOREIGN KEY (tipo_seguro_id) REFERENCES tipos_seguros(id) ON DELETE CASCADE, FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS cotizacion_coberturas (
            id INT AUTO_INCREMENT PRIMARY KEY, cotizacion_id INT NOT NULL, cobertura_id INT NOT NULL, suma_asegurada DECIMAL(15,2), deducible DECIMAL(15,2), prima DECIMAL(15,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE, FOREIGN KEY (cobertura_id) REFERENCES coberturas(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS polizas (
            id INT AUTO_INCREMENT PRIMARY KEY, numero_poliza VARCHAR(50) UNIQUE NOT NULL, cotizacion_id INT, cliente_id INT NOT NULL, tipo_seguro_id INT NOT NULL, fecha_emision DATE NOT NULL, fecha_inicio_vigencia DATE NOT NULL, fecha_fin_vigencia DATE NOT NULL, prima_total DECIMAL(15,2) NOT NULL, estatus ENUM('vigente', 'cancelada', 'vencida', 'siniestrada') DEFAULT 'vigente', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL, FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE, FOREIGN KEY (tipo_seguro_id) REFERENCES tipos_seguros(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS marcas_vehiculos (
            id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(50) UNIQUE NOT NULL, factor_riesgo DECIMAL(8,4) DEFAULT 1.0000, activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS modelos_vehiculos (
            id INT AUTO_INCREMENT PRIMARY KEY, marca_id INT NOT NULL, nombre VARCHAR(100) NOT NULL, anio_inicio INT, anio_fin INT, tipo ENUM('sedan', 'suv', 'pickup', 'hatchback', 'deportivo', 'van', 'otro') DEFAULT 'sedan', factor_riesgo DECIMAL(8,4) DEFAULT 1.0000, valor_referencia DECIMAL(15,2), activo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (marca_id) REFERENCES marcas_vehiculos(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS configuracion (
            id INT AUTO_INCREMENT PRIMARY KEY, clave VARCHAR(100) UNIQUE NOT NULL, valor TEXT, descripcion VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
    ];

    for (const sql of tables) {
        try { await query(sql); } 
        catch (error) { console.error(`[DB ERROR] Error creando tabla: ${error.message}`); }
    }
    
    console.log(`[DB] Tablas verificadas/creadas exitosamente`);
    await insertInitialData();
};

const insertInitialData = async () => {
    try {
        const tiposExistentes = await query('SELECT COUNT(*) as count FROM tipos_seguros');
        if (tiposExistentes[0].count > 0) return;
        
        console.log(`[DB] Insertando datos iniciales...`);
        
        await query(`INSERT INTO tipos_seguros (codigo, nombre, descripcion) VALUES ('AUTO', 'Seguro de Automóvil', 'Protección integral para tu vehículo'), ('VIDA', 'Seguro de Vida', 'Protección para ti y tu familia'), ('HOGAR', 'Seguro de Hogar', 'Protección para tu casa y contenidos'), ('SALUD', 'Seguro de Gastos Médicos', 'Cobertura de gastos médicos mayores'), ('EMPRESARIAL', 'Seguro Empresarial', 'Protección integral para tu negocio')`);
        await query(`INSERT INTO zonas (codigo, nombre, factor_riesgo) VALUES ('CDMX', 'Ciudad de México', 1.30), ('MTY', 'Monterrey', 1.15), ('GDL', 'Guadalajara', 1.10), ('NORTE', 'Zona Norte', 1.20), ('SUR', 'Zona Sur', 1.05), ('CENTRO', 'Zona Centro', 1.00), ('BAJIO', 'Zona Bajío', 1.08)`);
        await query(`INSERT INTO marcas_vehiculos (nombre, factor_riesgo) VALUES ('Nissan', 1.00), ('Volkswagen', 1.05), ('Chevrolet', 1.00), ('Toyota', 0.95), ('Honda', 0.95), ('Ford', 1.05), ('Mazda', 1.00), ('Kia', 0.98), ('Hyundai', 0.98), ('BMW', 1.30), ('Mercedes-Benz', 1.35), ('Audi', 1.25)`);
        
        const tipoAuto = await query('SELECT id FROM tipos_seguros WHERE codigo = ?', ['AUTO']);
        const tipoAutoId = tipoAuto[0]?.id;
        
        if (tipoAutoId) {
            await query(`INSERT INTO coberturas (tipo_seguro_id, codigo, nombre, descripcion, suma_asegurada_min, suma_asegurada_max, deducible_porcentaje) VALUES (?, 'RC_BIENES', 'Responsabilidad Civil Daños a Bienes', 'Cubre daños causados a propiedad de terceros', 500000, 3000000, 0), (?, 'RC_PERSONAS', 'Responsabilidad Civil Daños a Personas', 'Cubre lesiones o muerte a terceros', 1000000, 5000000, 0), (?, 'ROBO_TOTAL', 'Robo Total', 'Cubre el robo total del vehículo', 0, 0, 10), (?, 'DM_COLISION', 'Daños Materiales por Colisión', 'Cubre daños por colisión', 0, 0, 5), (?, 'DM_FENOMENOS', 'Daños por Fenómenos Naturales', 'Cubre daños por eventos naturales', 0, 0, 5), (?, 'ASISTENCIA', 'Asistencia Vial', 'Servicio de grúa, paso de corriente, etc.', 0, 0, 0), (?, 'GM_OCUPANTES', 'Gastos Médicos Ocupantes', 'Cubre gastos médicos de ocupantes', 50000, 500000, 0), (?, 'DEFENSA_LEGAL', 'Defensa Legal', 'Asistencia legal en caso de accidente', 0, 0, 0)`, [tipoAutoId, tipoAutoId, tipoAutoId, tipoAutoId, tipoAutoId, tipoAutoId, tipoAutoId, tipoAutoId]);
            await query(`INSERT INTO tarifas (tipo_seguro_id, nombre, prima_base, factor_edad, factor_antiguedad, factor_zona) VALUES (?, 'Cobertura Básica', 3500.00, 1.0, 1.0, 1.0), (?, 'Cobertura Amplia', 8500.00, 1.0, 1.0, 1.0), (?, 'Cobertura Premium', 15000.00, 1.0, 1.0, 1.0)`, [tipoAutoId, tipoAutoId, tipoAutoId]);
        }
        
        await query(`INSERT INTO configuracion (clave, valor, descripcion) VALUES ('IVA_PORCENTAJE', '16', 'Porcentaje de IVA aplicable'), ('RECARGO_PAGO_FRACCIONADO', '5', 'Porcentaje de recargo por pago fraccionado'), ('DESCUENTO_PAGO_ANUAL', '10', 'Porcentaje de descuento por pago anual'), ('VIGENCIA_COTIZACION_DIAS', '30', 'Días de vigencia de una cotización'), ('PREFIJO_COTIZACION', 'COT', 'Prefijo para números de cotización'), ('PREFIJO_POLIZA', 'POL', 'Prefijo para números de póliza')`);
        
        console.log(`[DB] Datos iniciales insertados exitosamente`);
    } catch (error) {
        console.error(`[DB ERROR] Error insertando datos iniciales: ${error.message}`);
    }
};

module.exports = { createTables, insertInitialData };