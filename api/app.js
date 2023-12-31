var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var carrerasRouter = require('./routes/carreras');
var alumnosRouter = require('./routes/alumnos');
var docentesRouter = require('./routes/docentes');
var materiasRouter = require('./routes/materias');
var usersRouter = require('./routes/users');
var logsRouter = require('./routes/logs');

var authRouter = require('./routes/auth');

// swagger
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/car', carrerasRouter);
app.use('/mat', materiasRouter);
app.use('/al', alumnosRouter);
app.use('/doc', docentesRouter);

app.use('/users', usersRouter);
app.use('/logs', logsRouter);
app.use('/auth', authRouter);


// swagger
const swaggerSpec = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "unahur API",
      version: "1.0.0"
    },
    servers: [
      {
        url: "http://localhost:3001" // Ubicacion de la API
      }
    ],
    security: [
      {
        jwt: [], // Definición de seguridad JWT
      },
    ],
    components: {
      securitySchemes: {
        jwt: {
          type: "apiKey",
          name: "Authorization",
          in: "header",
        },
      },
    },
  },
  apis: [`${path.join(__dirname, "./routes/*")}`],
};

// swagger mdlwr
app.use("/api-doc", swaggerUI.serve, swaggerUI.setup(swaggerJsDoc(swaggerSpec)))


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});





module.exports = app;
