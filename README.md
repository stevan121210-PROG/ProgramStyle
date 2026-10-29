# ProgramStyle

Sitio multipágina de ProgramStyle, publicado en GitHub Pages. Supabase gestiona la autenticación y los permisos administrativos; una API serverless en Vercel conecta de forma segura con MongoDB Atlas para el contenido, las solicitudes y los límites de uso. GitHub Pages sigue siendo el alojamiento oficial del sitio.

## Desarrollo local

Requisitos: Node.js 20.19 o posterior.

1. Copia `.env.example` como `.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores públicos del proyecto Supabase. No pongas claves privadas en variables `VITE_*`.
3. Instala y ejecuta:

   ```powershell
   npm.cmd ci
   npm.cmd start
   ```

4. Abre `http://127.0.0.1:5173`. Para compilar la web estática localmente, ejecuta `npm.cmd run build`; los archivos resultantes quedan en `dist`.

Sin credenciales, Vite puede compilar y mostrar el contenido predeterminado, pero la autenticación, el guardado compartido, los chats y el formulario que registra solicitudes no funcionarán.
Para probar la API y MongoDB localmente, usa `npx vercel dev` con las variables del backend en `.env.local`. Para usar la web local contra la API desplegada, define `VITE_API_BASE_URL` con el origen Vercel.

## Configurar Supabase

1. Crea un proyecto Supabase y ejecuta [`supabase/schema.sql`](./supabase/schema.sql) desde **SQL Editor**. La tabla `admin_users` conserva los permisos administrativos. Las tablas `site_content`, `contact_requests` y `api_rate_limits` se conservan para el backend anterior o una reversión; el flujo nuevo en GitHub Pages las lee desde MongoDB mediante la API Vercel.
2. En **Authentication → Users**, crea el primer usuario con correo y contraseña. Desactiva el registro público de usuarios.
3. Autoriza el usuario inicial desde SQL Editor, sustituyendo el correo:

   ```sql
   insert into public.admin_users (id, email)
   select id, lower(email)
   from auth.users
   where lower(email) = lower('admin@example.com')
   on conflict (id) do nothing;
   ```

4. En **Authentication → URL Configuration**, establece como **Site URL** la dirección raíz `https://TU_USUARIO.github.io/TU_REPOSITORIO/` y agrega estas **Redirect URLs**:
   - `https://TU_USUARIO.github.io/TU_REPOSITORIO/admin.html`
   - `http://127.0.0.1:5173/admin.html`
   - `http://localhost:5173/admin.html`

   Para ProgramStyle publicado en este repositorio, la URL de Admin es `https://stevan121210-prog.github.io/Proyecto-final-Jovenes-CreaTIvos/admin.html`. El panel tiene un enlace de recuperación y permite establecer una contraseña nueva después de verificar el enlace recibido por correo.

5. Si necesitas mantener o desplegar el backend Edge Functions anterior para reversión, instala la CLI de Supabase, autentícate y vincula el proyecto:

   ```powershell
   npx supabase login
   npx supabase link --project-ref TU_PROJECT_REF
   ```

6. Para el backend anterior de Supabase, `ALLOWED_ORIGINS` debe contener los orígenes separados por coma, sin rutas. Incluye el dominio `https://TU_USUARIO.github.io` y los orígenes locales `http://127.0.0.1:5173,http://localhost:5173`.

   ```powershell
   npx supabase secrets set OPENAI_API_KEY=TU_CLAVE_OPENAI ALLOWED_ORIGINS="https://TU_USUARIO.github.io,http://127.0.0.1:5173,http://localhost:5173"
   ```

   Supabase proporciona `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` a las funciones. Nunca publiques la clave de OpenAI ni la clave service role en el frontend o en GitHub Pages.

7. Despliega cada función Edge anterior desde la raíz del repositorio si se necesita reversión:

   ```powershell
   npx supabase functions deploy ai-chat
   npx supabase functions deploy admins
   npx supabase functions deploy contact-request
   npx supabase functions deploy contact-requests
   ```

   [`supabase/config.toml`](./supabase/config.toml) desactiva la verificación JWT automática del gateway; cada función valida explícitamente los tokens y permisos de Admin cuando corresponde.

## Publicar en GitHub Pages

1. Sube el repositorio a GitHub en la rama `main`.
2. En **Settings → Secrets and variables → Actions → Secrets**, crea:
   - `VITE_SUPABASE_URL`: URL raíz del proyecto Supabase, sin `/rest/v1/`.
   - `VITE_SUPABASE_ANON_KEY`: clave publicable/anon del proyecto. Es pública y se usa para conectar el navegador.
3. En **Settings → Secrets and variables → Actions → Variables**, crea `VITE_API_BASE_URL` con solo el origen público de la API Vercel, por ejemplo `https://TU_API.vercel.app` (sin `/api` ni barra final).
4. En **Settings → Pages**, selecciona **GitHub Actions** como origen.
5. Cada push a `main` construye el sitio con Vite y lo despliega. También puedes iniciarlo desde **Actions → Deploy ProgramStyle to GitHub Pages → Run workflow**.

El workflow configura la ruta base tanto para un repositorio de proyecto (`https://TU_USUARIO.github.io/NOMBRE_REPO/`) como para el repositorio principal de usuario (`https://TU_USUARIO.github.io/`).

## Vercel y MongoDB Atlas

Vercel aloja únicamente la API serverless definida en `api/`; el sitio público continúa desplegándose desde GitHub Pages. La API usa MongoDB Atlas para los datos y Supabase Auth/`admin_users` para autenticar y autorizar operaciones administrativas. El navegador nunca se conecta directamente a MongoDB.

1. Crea una base de datos y un usuario de aplicación en MongoDB Atlas. Guarda la URI de conexión en un lugar privado.
2. Importa el repositorio en Vercel con la raíz del proyecto y configura para Production:
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para validar sesiones y permisos. Son secretos de servidor y nunca deben tener prefijo `VITE_`.
   - `MONGODB_URI` y, opcionalmente, `MONGODB_DB=programstyle`.
   - `OPENAI_API_KEY` para activar los asistentes.
   - `ALLOWED_ORIGINS` con orígenes exactos separados por coma, sin rutas: `https://stevan121210-prog.github.io,http://localhost:5173,http://127.0.0.1:5173`. Añade el dominio Vercel solo si también abrirás el sitio desde allí.
3. Configura en MongoDB Atlas el acceso de red necesario para Vercel y usa un usuario con privilegios limitados a la base de datos de la aplicación.
4. El build y el directorio `dist` ya están declarados en `vercel.json`. Comprueba `/api/health`; realiza un ping real a MongoDB y devuelve 200 solo cuando la conexión funciona.
5. Copia el origen del deployment Vercel de Production a la variable GitHub `VITE_API_BASE_URL`. El workflow de Pages ya compila el frontend con `VITE_DATA_BACKEND=vercel`.

Configura `ALLOWED_ORIGINS` en Vercel para que admita el origen real de GitHub Pages. Si este valor falta o el dominio no coincide exactamente, el navegador bloqueará las peticiones CORS. La API maneja solicitudes `OPTIONS` y permite solo los orígenes declarados.

Para ejecutar la migración única de contenido y solicitudes existentes, copia `.env.example` como `.env.local`, añade `MONGODB_URI` y `SUPABASE_SERVICE_ROLE_KEY` válidos (sin compartirlos ni subirlos) y ejecuta `npm.cmd run migrate:mongodb`. El proceso no borra los datos de Supabase. Migra antes de desplegar el cambio del workflow; los límites temporales se reinician y las cuentas/permisos administrativos no se migran.

`MONGODB_URI`, `SUPABASE_SERVICE_ROLE_KEY` y `OPENAI_API_KEY` se configuran solo en Vercel como secretos de servidor. No deben tener prefijo `VITE_` ni exponerse en el frontend. `.env.local` queda ignorado por Git.

## Funcionalidad y límites

- GitHub Pages sirve el frontend; la API Vercel almacena contenido, solicitudes y límites de uso en MongoDB.
- Las cuentas autorizadas revisan las solicitudes en Admin y pueden marcarlas como atendidas; los permisos y credenciales siguen en Supabase.
- Hasta que exista contenido guardado en la base activa, la web y la IA usan el contenido predeterminado incorporado.
- Los cambios de contenido y de cuentas administrativas requieren confirmación en el panel. La IA explica y prepara, pero no ejecuta ni publica acciones por sí sola.
- Para validar el proyecto ejecuta `npm.cmd test` y `npm.cmd run build`. La integración real requiere configurar el backend correspondiente, Supabase Auth y, para Vercel, MongoDB Atlas y una clave válida de OpenAI.
