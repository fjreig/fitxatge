// ==========================================
// EL PROGRAMADOR MAESTRO (TRIGGERS DIARIOS)
// ==========================================
function programarFichajesDelDia() {
  // Limpiamos el historial del día anterior para empezar de cero
  PropertiesService.getScriptProperties().deleteProperty('fichajesHoy');

  const hoy = new Date();
  const diaSemana = hoy.getDay();
  
  if (diaSemana === 0 || diaSemana === 6) {
    console.log('Fin de semana. No se programa fichaje.');
    return;
  }
  
  if (esFestivoOVacaciones(hoy)) {
    console.log('Día festivo o vacaciones. No se programa fichaje.');
    return;
  }
  
  limpiarTriggersAntiguos();
  
  function crearHoraConVariacion(hora, minuto) {
    const fecha = new Date(hoy);
    const variacion = Math.floor(Math.random() * 11) - 5;
    fecha.setHours(hora, minuto + variacion, 0, 0);
    return fecha;
  }
  
  // TURNO DE MAÑANA (Aplica de Lunes a Viernes)
  // Entrada aprox 08:00, Salida aprox 14:00
  const horaEntrada1 = crearHoraConVariacion(8, 0);
  const horaSalida1 = crearHoraConVariacion(14, 0);
  
  ScriptApp.newTrigger('ficharEntrada').timeBased().at(horaEntrada1).create();
  ScriptApp.newTrigger('ficharSalida').timeBased().at(horaSalida1).create();
  
  let logMsg = `Programado Mañana: In ${horaEntrada1.toLocaleTimeString()} | Out ${horaSalida1.toLocaleTimeString()}`;
  
  // TURNO DE TARDE (Aplica solo de Lunes a Jueves)
  if (diaSemana >= 1 && diaSemana <= 4) {
    // Entrada aprox 15:30, Salida aprox 18:00
    const horaEntrada2 = crearHoraConVariacion(15, 30);
    const horaSalida2 = crearHoraConVariacion(18, 0);
    
    ScriptApp.newTrigger('ficharEntrada').timeBased().at(horaEntrada2).create();
    ScriptApp.newTrigger('ficharSalida').timeBased().at(horaSalida2).create();
    
    logMsg += ` /// Programado Tarde: In ${horaEntrada2.toLocaleTimeString()} | Out ${horaSalida2.toLocaleTimeString()}`;
  } else {
    logMsg += ` /// Tarde libre (Viernes).`;
  }
  
  console.log(logMsg);
}

// ==========================================
// LECTURA DE ESTADO INTELIGENTE
// ==========================================
function obtenerEstadoFichaje() {
  console.log("Comprobando el estado actual del cronómetro en Bizneo...");
  const urlEstado = BIZNEO_URL + '/chrono/' + USER_ID;
  const options = {
    'method': 'get',
    'headers': {
      'Cookie': '_hcmex_key=' + COOKIE_HCMEX + '; device_id=' + COOKIE_DEVICE_ID
    },
    'muteHttpExceptions': true
  };
  
  try {
    const response = UrlFetchApp.fetch(urlEstado, options);
    const html = response.getContentText();
    const codigoHttp = response.getResponseCode();
    
    if (codigoHttp >= 300) {
       console.error(`Error al leer el estado (HTTP ${codigoHttp}). La cookie ha caducado.`);
       return 'ERROR_SESION';
    }
    
    if (html.includes('Finalizar') || html.includes('chrono stop')) {
      return 'TRABAJANDO';
    } else if (html.includes('Iniciar') || html.includes('chrono start') || html.includes('kind=working_time')) {
      return 'PARADO';
    } else {
      return 'DESCONOCIDO';
    }
  } catch (e) {
    console.error("Fallo de red al intentar leer Bizneo: " + e.toString());
    return 'ERROR_RED';
  }
}

// ==========================================
// FUNCIONES DE EJECUCIÓN DE FICHAJE
// ==========================================
function ficharEntrada() {
  console.log("Iniciando rutina de ENTRADA...");
  const estadoActual = obtenerEstadoFichaje();
  
  if (estadoActual === 'TRABAJANDO') {
    const msg = 'Abortado: El cronómetro ya estaba en marcha. No se duplica la entrada.';
    console.log(msg);
    if (ENVIAR_MAIL) enviarReportePorCorreo('Entrada', 'Omitido', 'N/A', msg);
    return;
  } else if (estadoActual === 'ERROR_SESION') {
    const msg = 'Abortado: Las cookies han caducado. Necesitas actualizar el código manualmente.';
    console.error(msg);
    if (ENVIAR_MAIL) enviarReportePorCorreo('Entrada', 'Error Fatal', '302', msg);
    return;
  }
  
  ejecutarPeticionBizneo("working_time", "Entrada");
}

function ficharSalida() {
  console.log("Iniciando rutina de SALIDA...");
  const estadoActual = obtenerEstadoFichaje();
  
  if (estadoActual === 'PARADO') {
    const msg = 'Abortado: El cronómetro ya estaba detenido. No se duplica la salida.';
    console.log(msg);
    if (ENVIAR_MAIL) enviarReportePorCorreo('Salida', 'Omitido', 'N/A', msg);
    return;
  } else if (estadoActual === 'ERROR_SESION') {
    const msg = 'Abortado: Las cookies han caducado. Necesitas actualizar el código manualmente.';
    console.error(msg);
    if (ENVIAR_MAIL) enviarReportePorCorreo('Salida', 'Error Fatal', '302', msg);
    return;
  }
  
  ejecutarPeticionBizneo("stop", "Salida"); 
}

function ejecutarPeticionBizneo(tipoAccion, nombreAccion) {
  let formPayload;
  let urlFichaje;
  let metodoPostPut;
  
  if (nombreAccion === "Entrada") {
    urlFichaje = BIZNEO_URL + '/chrono';
    metodoPostPut = 'post';
    formPayload = {
      "_csrf_token": CSRF_TOKEN,
      "location_id": "",
      "user_id": USER_ID,
      "shift_id": "", 
      "kind": tipoAccion 
    };
  } else {
    urlFichaje = BIZNEO_URL + '/chrono/' + USER_ID;
    metodoPostPut = 'put'; 
    formPayload = {
      "_method": "put",
      "_csrf_token": CSRF_TOKEN,
      "location_id": "",
      "shift_id": SHIFT_ID,
      "comment": ""
    };
  }

  const options = {
    'method': metodoPostPut, 
    'headers': {
      'Cookie': `_hcmex_key=${COOKIE_HCMEX}; device_id=${COOKIE_DEVICE_ID}; sidebar-menu-static=true;`,
      'HX-Request': 'true',
      'X-CSRF-Token': CSRF_TOKEN,
      'Origin': BIZNEO_URL,
      'Referer': BIZNEO_URL + '/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'
    },
    'payload': formPayload, 
    'muteHttpExceptions': true
  };

  let estado = "Error";
  let codigoHttp = "N/A";
  let respuestaCuerpo = "";
  
  try {
    console.log(`Enviando petición de ${nombreAccion} a Bizneo...`);
    const response = UrlFetchApp.fetch(urlFichaje, options); 
    codigoHttp = response.getResponseCode();
    respuestaCuerpo = response.getContentText().substring(0, 500); 
    
    if (codigoHttp >= 200 && codigoHttp < 300) {
      estado = "Exito";
      console.log(`✅ Fichaje de ${nombreAccion} completado. Código HTTP: ${codigoHttp}`);
    } else {
      console.error(`❌ Fallo en el fichaje de ${nombreAccion}. Código HTTP: ${codigoHttp}`);
      console.error(`Detalle: ${respuestaCuerpo}`);
    }
  } catch (e) {
    respuestaCuerpo = e.toString();
    console.error(`❌ Error fatal ejecutando fetch: ${respuestaCuerpo}`);
  }

  if (ENVIAR_MAIL) {
    enviarReportePorCorreo(nombreAccion, estado, codigoHttp, respuestaCuerpo);
  }
}

// ==========================================
// FUNCIONES AUXILIARES (CORREO, CALENDARIO, LIMPIEZA)
// ==========================================
function enviarReportePorCorreo(accion, estado, codigo, detalle) {
  const props = PropertiesService.getScriptProperties();
  const fechaObj = new Date();
  const fechaStr = fechaObj.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });
  const horaStr = fechaObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' });

  // Recuperar el historial de fichajes de hoy (o crear uno vacío)
  let historial = JSON.parse(props.getProperty('fichajesHoy') || '[]');

  // Añadir el fichaje actual al historial
  historial.push({
    hora: horaStr,
    accion: accion,
    estado: estado,
    codigo: codigo
  });

  // Guardar el historial actualizado
  props.setProperty('fichajesHoy', JSON.stringify(historial));

  // Construir las filas de la tabla con el historial acumulado
  let filasTabla = '';
  historial.forEach(item => {
    let colorFondo = item.estado === "Exito" ? "#e8f5e9" : (item.estado === "Omitido" ? "#fff8e1" : "#ffebee");
    let colorTexto = item.estado === "Exito" ? "#2e7d32" : (item.estado === "Omitido" ? "#f57f17" : "#c62828");
    
    filasTabla += `
      <tr>
        <td style="border: 1px solid #dddddd; padding: 10px;">${item.hora}</td>
        <td style="border: 1px solid #dddddd; padding: 10px;">${item.accion}</td>
        <td style="border: 1px solid #dddddd; padding: 10px; font-weight: bold; background-color: ${colorFondo}; color: ${colorTexto};">${item.estado}</td>
        <td style="border: 1px solid #dddddd; padding: 10px;">${item.codigo}</td>
      </tr>
    `;
  });

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333333;">
      <h2 style="font-size: 18px; border-bottom: 1px solid #cccccc; padding-bottom: 5px;">
        Resumen de fichajes del día (${fechaStr})
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
        <thead>
          <tr>
            <th style="border: 1px solid #dddddd; padding: 10px; text-align: left; background-color: #f5f5f5;">Hora</th>
            <th style="border: 1px solid #dddddd; padding: 10px; text-align: left; background-color: #f5f5f5;">Acción</th>
            <th style="border: 1px solid #dddddd; padding: 10px; text-align: left; background-color: #f5f5f5;">Estado</th>
            <th style="border: 1px solid #dddddd; padding: 10px; text-align: left; background-color: #f5f5f5;">Cód. HTTP</th>
          </tr>
        </thead>
        <tbody>
          ${filasTabla}
        </tbody>
      </table>
      <h3 style="font-size: 14px; margin-top: 20px;">Detalle del último fichaje (Logs del servidor):</h3>
      <div style="background-color: #f9f9f9; border: 1px solid #dddddd; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all;">
        ${detalle || 'Sin detalles adicionales.'}
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    subject: `[Bizneo] Fichaje de las ${horaStr} (${accion} - ${estado})`,
    htmlBody: htmlBody
  });
}

function esFestivoOVacaciones(fecha) {
  const eventosPersonales = CalendarApp.getDefaultCalendar().getEventsForDay(fecha);
  for (let i = 0; i < eventosPersonales.length; i++) {
    const titulo = eventosPersonales[i].getTitle().toLowerCase();
    if (titulo.includes("vacacion") || titulo.includes("ausencia") || titulo.includes("libre")) {
      return true; 
    }
  }

  const calFestivos = CalendarApp.getCalendarById('es.spanish#holiday@group.v.calendar.google.com');
  if (calFestivos) {
    const festivos = calFestivos.getEventsForDay(fecha);
    for (let i = 0; i < festivos.length; i++) {
      const nombreFestivo = festivos[i].getTitle().toLowerCase();
      if (nombreFestivo.includes("valencia") || nombreFestivo.includes("nacional") || nombreFestivo.includes("comunidad valenciana")) {
          return true;
      }
    }
  }
  return false; 
}

function limpiarTriggersAntiguos() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    const funcName = trigger.getHandlerFunction();
    if (funcName === 'ficharEntrada' || funcName === 'ficharSalida') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}
