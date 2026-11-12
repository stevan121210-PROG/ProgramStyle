# ProgramStyle

Sitio multipágina de ProgramStyle configurado para desplegarse íntegramente en Vercel. Vercel sirve el frontend y las funciones de `api/`; Supabase gestiona autenticación y permisos de administración, y MongoDB Atlas almacena el contenido, las solicitudes y los límites de uso. El navegador nunca se conecta directamente a MongoDB.

## Desplegar en Vercel

1. Importa este repositorio en Vercel y deja la raíz del proyecto en `/`. Vercel lee `vercel.json`: ejecuta `npm run build:vercel`, publica `dist` y expone las funciones de `api/` en `/api/*`.
2. En **Settings → Environment Variables**, agrega para **Production** y, si vas a probar previews, también para **Preview**:
   - `VITE_SUPABASE_URL`: URL raíz del proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: clave pública/anon de Supabase. Estas dos variables se incorporan al frontend; nunca pongas aquí una clave privada.
   - `SUPABASE_URL`: URL raíz del proyecto Supabase para el servidor.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave privada de servidor para validar sesiones y permisos.
   - `MONGODB_URI`: URI privada de MongoDB Atlas.
   - `MONGODB_DB`: nombre de base de datos (opcional; predeterminado `programstyle`).
   - `OPENAI_API_KEY`: clave privada para activar los asistentes de IA.
   - `ALLOWED_ORIGINS`: orígenes externos exactos, separados por coma y sin rutas. Solo hace falta si otro dominio distinto al del deployment llamará a la API; las peticiones del mismo dominio Vercel se permiten automáticamente.
3. En **Deployments**, crea o espera el deployment de Production. Comprueba `https://TU_DOMINIO.vercel.app/`, `/servicios.html`, `/admin.html` y `/api/health`.
4. En Supabase, abre **Authentication → URL Configuration** y establece el dominio Vercel de Production como **Site URL**. Agrega `https://TU_DOMINIO.vercel.app/admin.html` a **Redirect URLs**. Agrega las URL de previews solo si vas a iniciar sesión desde ellas.
5. Si cambiaste variables de entorno después del primer despliegue, vuelve a desplegar para que el frontend se compile con las variables públicas actualizadas.
6. Después de validar Vercel, desactiva GitHub Pages en **GitHub → Settings → Pages** para que el sitio antiguo no siga sirviéndose por separado.

La aplicación es multipágina y conserva rutas normales para Inicio, Servicios y Admin. El build de Vercel usa el modo `vercel`, que conecta el frontend con las funciones `/api/*` del mismo deployment; no necesita `VITE_API_BASE_URL` ni una URL separada para la API.

## Desarrollo local

Requisitos: Node.js 20.19 o posterior.

1. Instala dependencias con `npm.cmd ci`.
2. Crea `.env.local` a partir de `.env.example` y completa las variables de Supabase y del servidor con valores privados locales. No subas `.env.local`.
3. Ejecuta `npx vercel dev` y abre la URL local que indica Vercel. Para probar el backend completo, usa ese comando en lugar de `npm start`, ya que Vite por sí solo no ejecuta las funciones de `api/`.
4. `npm.cmd test` ejecuta las pruebas; `npm.cmd run build:vercel` reproduce el build de producción y `npm.cmd run build` comprueba el build genérico de Vite.

## Configurar Supabase

1. Crea un proyecto Supabase y ejecuta [`supabase/schema.sql`](./supabase/schema.sql) desde **SQL Editor**.
2. En **Authentication → Users**, crea la primera cuenta y desactiva el registro público.
3. Autoriza la cuenta inicial desde SQL Editor, sustituyendo el correo:

   ```sql
   insert into public.admin_users (id, email)
   select id, lower(email)
   from auth.users
   where lower(email) = lower('admin@example.com')
   on conflict (id) do nothing;
   ```

La tabla `admin_users` mantiene los permisos administrativos. Las tablas `site_content`, `contact_requests` y `api_rate_limits` pertenecen al backend anterior y se conservan para una posible reversión; el flujo activo usa MongoDB mediante la API de Vercel.

## MongoDB y migración de datos

Configura en MongoDB Atlas acceso de red para Vercel y un usuario con permisos limitados a la base de datos de la aplicación. La API valida su conexión en `/api/health` y solo devuelve estado correcto cuando MongoDB responde.

Para migrar contenido y solicitudes existentes, configura `MONGODB_URI` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y ejecuta `npm.cmd run migrate:mongodb`. La migración no borra los datos de Supabase; las cuentas administrativas no se migran y los límites temporales se reinician.

`SUPABASE_SERVICE_ROLE_KEY`, `MONGODB_URI` y `OPENAI_API_KEY` son secretos de servidor: configúralos únicamente como variables privadas de Vercel. No les asignes el prefijo `VITE_`.

## Publicación

Cada push a `main` inicia un deployment de Vercel cuando el repositorio está conectado al proyecto. GitHub Pages ya no es el destino de publicación. Para verificar localmente ejecuta `npm.cmd test` y `npm.cmd run build:vercel`.
