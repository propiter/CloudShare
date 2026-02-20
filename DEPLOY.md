# CloudShare - Docker Deployment Guide

Este proyecto está contenerizado para un despliegue rápido y sencillo usando Docker y Docker Compose.

## Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/) instalado.
- [Docker Compose](https://docs.docker.com/compose/install/) instalado.
- Un archivo `.env` con tus credenciales de Cloudflare R2 (usa `.env.example` como guía).

## Despliegue Rápido

1. **Configura tus variables de entorno:**
   Asegúrate de tener un archivo `.env` en la raíz del proyecto con el siguiente contenido:

   ```env
   R2_ACCOUNT_ID=tu_account_id
   R2_ACCESS_KEY_ID=tu_access_key_id
   R2_SECRET_ACCESS_KEY=tu_secret_access_key
   R2_BUCKET_NAME=tu_bucket_name
   R2_PUBLIC_URL=https://tu-dominio-r2.com
   ```

2. **Construir y levantar el contenedor:**

   Ejecuta el siguiente comando en la terminal:

   ```bash
   docker-compose up -d --build
   ```

   Esto construirá la imagen optimizada de Next.js y arrancará el servicio en el puerto `3001`.

3. **Acceder a la aplicación:**

   Abre tu navegador en: [http://localhost:3001](http://localhost:3001)

## Comandos Útiles

- **Ver logs:**
  ```bash
  docker-compose logs -f
  ```

- **Detener el servicio:**
  ```bash
  docker-compose down
  ```

- **Reconstruir sin caché (si cambias código):**
  ```bash
  docker-compose up -d --build --force-recreate
  ```

## Notas de Producción

- La imagen Docker utiliza **Next.js Standalone Output**, lo que reduce drásticamente el tamaño de la imagen final (de >1GB a ~150MB).
- Se utiliza una construcción **Multi-Stage** para asegurar que solo los archivos necesarios lleguen a producción.
- El contenedor se ejecuta como un usuario no root (`nextjs`) para mayor seguridad.
