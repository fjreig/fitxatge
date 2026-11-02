# fitxatge

## 1. Obtener credenciales de Bizneo


### 1.1 Obtener cookies

Una vez logeado en la pagina de bizneo, hay que apretar boton derecho con el raton y buscar "inspeccionar elemento"
![Inspeccionar](img/inspeccionar.png)

Si no se ve la pestaña network, ampliar la ventana horizontalmente y seleccionar network

![Network](img/network.png)

Una vez en la pestaña Network, apretar "iniciar sesión"

![Chromo](img/f12+chromo.png)

Seleccionar el chrono

![Post](img/post.png)

Copiar todo el header de la derecha

![Copiar](img/Copiar.png)

## 1.2 obtener User y shift ID

En la pestaña payload, se pueden obtener el user y shift ID que necesitaremos pegar en secrets.gs

![Payload](img/user_id.png)

## 2. Acceder al bot PavenerIA

Buscar la aplicación de Google chat "PavenerIA"

![PavenerIA](img/PavenerIA.png)

Una vez dentro de la conversación del chat, apretar el botón "+" de al lado de campo de texto y buscar "otros agentes"

![otros Agentes](img/otros_agentes.png)

## 3. Crear un Script para el fichaje

### 3.1 Acceso a Apps Script
El primer paso es acceder a  <a href="https://script.google.com" target="_blank" rel="noopener noreferrer">Apps Script de Google</a>


### 3.2 Crear nuevo proyecto
![Nuevo Proyecto](img/nuevo_proyecto.png)


### 3.3 Pegar el código en el nuevo proyecto

Tanto el el fichero de Código.gs como el de secrets.gs, para el de secrets.gs hay que apretar el botón de "+" que aparece en Archivos

![Proyecto sin titulo](img/proyecto_sin_titulo.png)

### 3.4 Ejecutar de forma Manual y dar permisos

El primer paso es seleccionar "programarFichajesDelDia" y después darle a "Ejecutar". En breves saldrá una ventana solicitando que des autorización a Apps Script

![Ejecutar](img/ejecutar.png)

#### 3.5 Crear un activador

El último paso, si funciona lo anterior, es crear un activador

![Menu activador](img/menu_activadores.png)

![Boton activador](img/boton_activador.png)

![Editar activador](img/editar_activador.png)
