Este es el repositorio del Grupo 06 en INF236, cuyos integrantes son:

* Benjamín Carvajal 202273099-4
* Cristóbal Castro 202273118-4
* Matias Correa 202273136-2
* Nicolas Guerrero 202330023-3
* **Tutor**: Valentina Castillo


El repositorio se actualiza a repositorio de Grupo 04 en INF225, cuyos integrantes son:
* Benjamín Carvajal 202273099-4
* Cristóbal Castro 202273118-4
* Matias Correa 202273136-2
* Daniel Fernandez 202003004-9
* **Tutor**: Lorna Mella

El proyecto que se continuara trabajando esta en la carpeta proyecto base y las instrucciones de instalación estan más adelante en este README

## Wiki

Puede acceder a la Wiki mediante el siguiente [enlace](https://gitlab.com/Criscool11/grupo06-2025-proyinf/-/wikis/home)

## Video Hito 3

https://usmcl-my.sharepoint.com/:v:/g/personal/matias_correag_usm_cl/EdmvZXcoFt5Gq42rDkvkJxgBTLQT1ye3g_UwecozgzHFIg?e=gx9qxg

## Video Hito 5

https://usmcl-my.sharepoint.com/:v:/g/personal/matias_correag_usm_cl/EZj3qjXyuAdEo9KgxmO_D60BQJadVSxSGe6Jzl2mBi4KXw?e=CdnqBu

# INF236-2025-1-Proyecto Base

## Aspectos técnicos relevantes

__Instrucciones de ejecución del proyecto__

Este proyecto incluye un frontend en React y un backend con Docker y MySQL.

__Requisitos previos__

Antes de comenzar, es necesario tener instalado lo siguiente en tu sistema:

Node.js (incluye npm)

Docker

React


## Ejecución del Proyecto

1. Clone el repositorio.
```sh
git clone git@gitlab.com:Criscool11/grupo06-2025-proyinf.git
```
2. Diríjase a la carpeta principal del proyecto **`proyecto-base`**, donde se encuentra `docker-compose.yml`
   cd ruta/a/proyecto-base
3. Detenga y limpie contenedores previos (recomendado):
```sh
docker compose down -v
```
4. Construya y levante los contenedores:
```sh
docker compose up --build
```
5. Espere hasta que la consola muestre: **Server running!**

6.Abra en su navegador: http://localhost:5173/

Una vez construido eso se tendra acceso al proyecto final, las credenciales para acceder a los perfiles son:

| Usuario| Contraseña |
| ------ | ------ |
|profesor | 1234 |
|alumno1 | a1234 |
|alumno2 | b1234 |
|directivo | admin123 |

