const url = "https://aquameasure-esp32.onrender.com/ver";

// Elementos DOM
const tempEl = document.getElementById("temp");
const distEl = document.getElementById("dist");
const nivelEl = document.getElementById("nivel");
const litrosEl = document.getElementById("litros");
const porcentajeEl = document.getElementById("porcentaje");
const fechaEl = document.getElementById("fecha");

// Última fecha registrada
let ultimaFecha = null;

// Mostrar texto de carga inicial
function mostrarCargando() {
  tempEl.textContent = "Cargando...";
  distEl.textContent = "Cargando...";
  nivelEl.textContent = "Cargando...";
  litrosEl.textContent = "Cargando...";
  porcentajeEl.textContent = "Cargando...";
  fechaEl.textContent = "Esperando datos...";
}

mostrarCargando();

// Crear gráficas
// Crear gráficas con tipos diferentes para mejor visual
function crearGrafica(canvasId, label, color, max = null, tipo = "line") {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: tipo,
    data: {
      labels: [],
      datasets: [{
        label,
        data: [],
        borderColor: color,
        backgroundColor: tipo === "bar" ? color + "cc" : `${color}33`,
        fill: tipo === "line" || tipo === "area",
        tension: 0.3,
        borderWidth: 2,
        borderRadius: tipo === "bar" ? 6 : 0,
        pointRadius: tipo === "line" ? 4 : 0,
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 800 },
      scales: {
        y: {
          beginAtZero: true,
          max: max
        }
      },
      plugins: {
        legend: {
          labels: { color: '#004d40', font: { weight: 'bold' } }
        },
        tooltip: {
          backgroundColor: '#004d40',
          titleFont: { weight: 'bold' },
          bodyFont: { weight: 'normal' },
          callbacks: {
            label: ctx => ctx.parsed.y + (label.includes('%') ? '%' : ''),
          }
        }
      }
    }
  });
}

// Inicializar gráficas con distintos tipos
const graficaTemp = crearGrafica("graficaTemp", "Temperatura (°C)", "#e67e22", null, "line");
const graficaDist = crearGrafica("graficaDist", "Distancia (cm)", "#8e44ad", null, "bar");
const graficaNivel = crearGrafica("graficaNivel", "Nivel de Agua (cm)", "#1abc9c", null, "line");
const graficaLitros = crearGrafica("graficaLitros", "Cantidad de Agua (L)", "#3498db", null, "bar");
const graficaPorcentaje = crearGrafica("graficaAgua", "Porcentaje de llenado (%)", "#2ecc71", 100, "line");


// Actualizar una gráfica
function actualizarGrafica(grafica, valor, hora) {
  grafica.data.labels.push(hora);
  grafica.data.datasets[0].data.push(valor);

  if (grafica.data.labels.length > 15) {
    grafica.data.labels.shift();
    grafica.data.datasets[0].data.shift();
  }

  grafica.update();
}

// Obtener y mostrar datos
async function actualizarDatos() {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ JSON recibido:", data);

    // Variable para trackear la fecha más reciente del lote recibido
    let fechaMaximaDelLote = null;

    // Función para procesar un solo registro
    function procesarRegistro(registro) {
      if (!registro.fecha) throw new Error("Campo 'fecha' no está presente en el JSON");

      const fechaRegistro = new Date(registro.fecha);
      if (isNaN(fechaRegistro.getTime())) return; // saltar fechas inválidas

      // Actualizar la fecha máxima del lote
      if (!fechaMaximaDelLote || fechaRegistro > fechaMaximaDelLote) {
        fechaMaximaDelLote = fechaRegistro;
      }

      // Solo actualizar si la fecha del registro es más reciente que la última conocida
      if (!ultimaFecha || fechaRegistro > new Date(ultimaFecha)) {
        // Actualizar campos visibles (solo con el registro más reciente)
        if (!ultimaFecha || fechaRegistro > new Date(ultimaFecha)) {
          tempEl.textContent = `${Number(registro.temp).toFixed(1)} °C`;
          distEl.textContent = `${Number(registro.distancia).toFixed(2)} cm`;
          nivelEl.textContent = `${Number(registro.nivelAgua).toFixed(2)} cm`;
          litrosEl.textContent = `${Number(registro.cantidadAgua).toFixed(1)} L`;
          porcentajeEl.textContent = `${Number(registro.porcentajeLlenado).toFixed(1)} %`;

          fechaEl.textContent = fechaRegistro.toLocaleString();

          ultimaFecha = registro.fecha;
        }

        const hora = fechaRegistro.toLocaleTimeString();

        // Actualizar gráficas con TODOS los registros que sean más recientes
        actualizarGrafica(graficaTemp, Number(registro.temp), hora);
        actualizarGrafica(graficaDist, Number(registro.distancia), hora);
        actualizarGrafica(graficaNivel, Number(registro.nivelAgua), hora);
        actualizarGrafica(graficaLitros, Number(registro.cantidadAgua), hora);
        actualizarGrafica(graficaPorcentaje, Number(registro.porcentajeLlenado), hora);
      }
    }

    if (Array.isArray(data)) {
      if (data.length === 0) throw new Error("El arreglo JSON está vacío");
      // Procesar todos los registros recibidos
      data.forEach(procesarRegistro);
    } else if (typeof data === "object" && data !== null) {
      // Solo un registro
      procesarRegistro(data);
    } else {
      throw new Error("Formato de JSON no reconocido");
    }

    if (!fechaMaximaDelLote) {
      console.log("⏳ No hay datos válidos en el lote recibido.");
    }

  } catch (error) {
    console.error("❌ Error al obtener datos:", error);
    fechaEl.textContent = "Error al cargar datos";
  }
}


// Actualizar cada 5 minutos
actualizarDatos();
setInterval(actualizarDatos, 300000);
