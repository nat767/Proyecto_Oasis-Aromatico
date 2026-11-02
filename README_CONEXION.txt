OASIS AROMATICO - ETAPA 1: CONEXION PHP / MYSQL

Se agrego la carpeta api con:
- conexion.php: conexión PDO a MySQL80.
- prueba.php: verifica conexión y muestra las tablas.
- auth.php: backend inicial para registro, inicio/cierre de sesión y sesión actual.
- respuesta.php: respuestas JSON comunes.

PASOS:
1. Copia la carpeta OasisAromatico_etapa1 dentro de C:\xampp\htdocs\ y renómbrala OasisAromatico.
2. Enciende Apache desde XAMPP.
3. Mantén MySQL80 iniciado desde Servicios de Windows. No inicies MySQL de XAMPP si ocupa el puerto 3306.
4. Abre api/conexion.php y confirma DB_USER y DB_PASS. DB_PASS está vacío inicialmente; si root tiene contraseña, escríbela entre las comillas.
5. Abre: http://localhost/OasisAromatico/api/prueba.php
6. Debe responder con ok:true y mostrar las ocho tablas.

NOTA: En esta etapa todavía no se cambió el formulario visual ni los módulos. Primero verificamos la conexión real antes de conectarlos.
