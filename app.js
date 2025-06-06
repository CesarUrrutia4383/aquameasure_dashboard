require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');


// Carpeta pública para archivos estáticos (css, js, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Configurar motor de vistas EJS
app.set('view engine', 'ejs');

// Ruta principal que renderiza index.ejs
app.get('/', (req, res) => {
  res.render('index');
});

// Ruta para la página "Acerca de" que renderiza acercade.ejs
app.get('/acercade', (req, res) => {
  res.render('acercade');  // Asegúrate que acercade.ejs está en la carpeta 'views'
});

// Servidor escuchando en puerto 3000
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
