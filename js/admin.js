import { ProgramStyleContent } from "./site-content.js";
import { invokeFunction, supabase, supabaseConfigError } from "./supabase-client.js";

const loginForm = document.getElementById("admin-login-form");
const loginError = document.getElementById("login-error");
const showResetFormButton = document.getElementById("show-reset-form");
const passwordResetForm = document.getElementById("password-reset-form");
const passwordResetMessage = document.getElementById("password-reset-message");
const backToLoginFromResetButton = document.getElementById("back-to-login-from-reset");
const passwordRecoveryForm = document.getElementById("password-recovery-form");
const passwordRecoveryMessage = document.getElementById("password-recovery-message");
const loginSection = document.getElementById("login-section");
const adminDashboard = document.getElementById("admin-dashboard");
const createAdminForm = document.getElementById("create-admin-form");
const createAdminMessage = document.getElementById("create-admin-message");
const editAdminForm = document.getElementById("edit-admin-form");
const editAdminMessage = document.getElementById("edit-admin-message");
const sessionList = document.getElementById("session-list");
const sessionMessage = document.getElementById("session-message");
const logoutCurrentBtn = document.getElementById("logout-current-btn");
const backendStatus = document.getElementById("backend-status");
const panelToggles = document.querySelectorAll(".panel-toggle");
const contactRequestsList = document.getElementById("contact-requests-list");
const contactRequestsMessage = document.getElementById("contact-requests-message");
const contactRequestCount = document.getElementById("contact-request-count");
const adminChatForm = document.getElementById("admin-chat-form");
const adminChatInput = document.getElementById("admin-chat-input");
const adminChatMessages = document.getElementById("admin-chat-messages");
const chatQuestionButtons = document.querySelectorAll("[data-chat-question]");
const siteContentForm = document.getElementById("site-content-form");
const siteContentField = document.getElementById("site-content-field");
const siteContentValue = document.getElementById("site-content-value");
const siteContentSelect = document.getElementById("site-content-custom-select");
const siteContentSelectTrigger = document.getElementById("site-content-select-trigger");
const siteContentSelectLabel = document.getElementById("site-content-selected-label");
const siteContentOptions = document.getElementById("site-content-options");
const changePreview = document.getElementById("admin-change-preview");
const changeTitle = document.getElementById("admin-change-title");
const changeDescription = document.getElementById("admin-change-description");
const confirmChangeBtn = document.getElementById("confirm-admin-change-btn");
const cancelChangeBtn = document.getElementById("cancel-admin-change-btn");

let siteContent = ProgramStyleContent.get();
let pendingAdminChange = null;
let currentAdmin = null;
let isPasswordRecovery = false;

let lastAdminHelpTopic = null;

const ADMIN_HELP_TOPICS = [
  {
    id: "admin-create",
    keywords: ["crear administrador", "crear un administrador", "agregar administrador", "agregar un administrador", "agrego un administrador", "añadir administrador", "nuevo administrador", "otro administrador", "sumar un administrador", "crear usuario", "nuevo usuario", "otro usuario", "añadir usuario", "crear una cuenta", "nuevo perfil"],
    responses: [
      "Para sumar a otra persona, abre “Agregar nuevo administrador”, indica su correo y una contraseña de al menos 12 caracteres. No la compartas en el chat. La cuenta se crea tras confirmar la propuesta."
    ]
  },
  {
    id: "admin-credentials",
    keywords: ["credenciales", "cambiar contraseña", "actualizar contraseña", "cambiar usuario", "editar perfil", "cambiar mi clave", "cambiar clave", "clave", "mi contraseña", "mi usuario"],
    responses: [
      "Puedes cambiar el correo, la contraseña o ambos desde “Editar credenciales”. El panel te mostrará una vista previa antes de aplicar el cambio."
    ]
  },
  {
    id: "admin-login",
    keywords: ["iniciar sesion", "entrar al panel", "no puedo entrar", "problema para entrar", "acceso al panel", "login", "olvide mi contraseña", "olvide la contraseña"],
    responses: [
      "El acceso se hace desde la página Admin con el correo y la contraseña de una cuenta autorizada. Si olvidaste la clave, inicia sesión en Supabase y usa “Editar credenciales” desde el panel si aún tienes acceso."
    ]
  },
  {
    id: "admin-sessions",
    keywords: ["sesion", "cerrar sesion", "sesiones", "no autorizada", "sesion activa"],
    responses: [
      "El panel muestra las cuentas administradoras autorizadas; puedes agregar cuentas, cambiar tus credenciales o eliminar otra cuenta. “Cerrar sesión actual” termina tu sesión."
    ]
  },
  {
    id: "admin-overview",
    priority: -2,
    keywords: ["panel admin", "panel de admin", "panel de administracion", "funciones administrativas", "que hace admin"],
    responses: [
      "El panel Admin permite revisar solicitudes enviadas por el formulario, editar el contenido compartido de Inicio y Servicios, gestionar cuentas administrativas y cerrar tu sesión."
    ]
  },
  {
    id: "local-editor",
    priority: 10,
    keywords: ["editar el sitio", "editar inicio", "editar servicios", "editar precios", "editar la pagina", "cambiar contenido", "modificar contenido", "guardar cambios", "confirmar cambios", "publicar cambios", "guardar en este navegador"],
    responses: [
      "Puedes pedirme un cambio con tus palabras o prepararlo en “Preparar un cambio del sitio”. Primero te mostraré una vista previa; solo al pulsar “Confirmar y guardar” se aplicará y quedará compartido para los visitantes."
    ]
  },
  {
    id: "admin-requests",
    keywords: ["solicitud", "solicitudes", "cotizacion", "cotizaciones", "formulario", "mensaje de contacto"],
    responses: [
      "Las cotizaciones se solicitan desde el formulario de la página “Servicios”. En Admin, abre “Ver solicitudes” para revisar los mensajes guardados y marcar como atendidos los que ya gestionaste."
    ]
  },
  {
    id: "home-projects",
    keywords: ["proyectos", "casos de exito", "shinsushii", "smph", "compresores", "trabajos realizados", "portafolio", "ejemplos"],
    responses: [
      "En “Inicio”, baja hasta “Proyectos realizados”. Ahí aparecen Shinsushii, una landing para una marca de sushi, y SMPH Compresores, un sitio corporativo industrial; puedes abrir cada proyecto desde su tarjeta.",
      "La página “Inicio” incluye dos proyectos recientes: Shinsushii y SMPH Compresores. Las tarjetas llevan a sus sitios publicados, así que sirven para ver ejemplos reales del trabajo."
    ]
  },
  {
    id: "home",
    keywords: ["pagina de inicio", "pagina principal", "portada", "inicio", "pagina web de programstyle", "que ofrece programstyle"],
    responses: [
      "La portada de “Inicio” presenta el desarrollo de páginas web empresariales y tiene accesos directos a “Servicios” y al panel Admin. Más abajo encontrarás los proyectos recientes.",
      "En “Inicio” se presenta la propuesta de ProgramStyle: sitios empresariales modernos, adaptados a móviles y con identidad visual negra, dorada y blanca. Desde ahí puedes ir a Servicios o ver los proyectos."
    ]
  },
  {
    id: "home-design",
    keywords: ["diseno", "identidad visual", "colores", "responsive", "movil", "celular"],
    responses: [
      "La portada destaca páginas empresariales modernas, adaptadas a móviles, con una identidad visual en negro, dorado y blanco. Esa es la propuesta que presenta ProgramStyle en Inicio.",
      "En Inicio se cuenta que los sitios se diseñan para verse bien tanto en móviles como en escritorio. La identidad visual de la marca combina negro, dorado y blanco."
    ]
  },
  {
    id: "service-overview",
    priority: -3,
    keywords: ["servicios", "catalogo", "paquetes", "planes", "que ofrecen", "ver servicios", "tipos de sitio"],
    responses: [
      "En “Servicios” encontrarás los planes de desarrollo y mantenimiento. Hay precios de referencia y puedes pedir una cotización desde esa página.",
      "La página “Servicios” reúne opciones para crear sitios y mantenerlos. Si me cuentas qué tipo de proyecto tienes, te ayudo a ubicar el plan que más se parece."
    ]
  },
  {
    id: "service-maintenance",
    keywords: ["mantenimiento web", "mantenimiento de pagina", "mantenimiento de sitio", "mantener mi pagina", "mantener el sitio", "descuento mantenimiento", "descuento del 10%", "10% de descuento"],
    responses: [
      "Sí, añadimos el plan “Mantenimiento Web”. Tiene cotización personalizada y ofrece 10% de descuento si el sitio que se mantiene —Landing Page, Sitio Corporativo o E-commerce— fue desarrollado por ProgramStyle.",
      "El mantenimiento web ya aparece en Servicios. El 10% de descuento aplica únicamente si la Landing Page, el Sitio Corporativo o el E-commerce fue creado por ProgramStyle; el precio se define por cotización."
    ]
  },
  {
    id: "service-discount",
    keywords: ["descuento", "promocion", "25%", "oferta"],
    responses: [
      "La Landing Page incluye una promoción de 25% de descuento en tu siguiente proyecto con ProgramStyle. La oferta aparece dentro de la misma tarjeta del plan; confirma las condiciones al cotizar.",
      "Al contratar una Landing Page, obtienes 25% de descuento en tu siguiente proyecto con ProgramStyle. Encontrarás esta promoción en la tarjeta de Landing Page."
    ]
  },
  {
    id: "service-prices",
    priority: 8,
    keywords: ["precio", "precios", "cuanto cuesta", "cuanto vale", "presupuesto", "valor de", "dolares", "pesos"],
    responses: [
      "En “Servicios” se publican estos precios: Landing Page $1.500.000 COP, Sitio Corporativo $4.300.000 COP, E-commerce $3.000.000 COP y Mantenimiento Web $350.000 COP. Puedes pedir una cotización desde esa página.",
      "Los precios actuales del catálogo son: Landing Page $1.500.000 COP, Sitio Corporativo $4.300.000 COP, E-commerce $3.000.000 COP y Mantenimiento Web $350.000 COP."
    ]
  },
  {
    id: "service-landing",
    keywords: ["landing", "pagina de aterrizaje", "pagina para captar clientes"],
    responses: [
      "La Landing Page está pensada para presentar un negocio y captar clientes. Incluye diseño adaptable, formulario de contacto, SEO básico e integración con WhatsApp; cuesta $1.500.000 COP.",
      "Si buscas una página enfocada en una sola propuesta y en conseguir contactos, la Landing Page puede encajar. El plan menciona diseño responsive, contacto, SEO básico y WhatsApp, por $1.500.000 COP."
    ]
  },
  {
    id: "service-corporate",
    keywords: ["corporativo", "sitio empresarial", "pagina empresarial", "empresa", "blog", "equipo"],
    responses: [
      "El Sitio Corporativo es para una empresa que necesita varias secciones, por ejemplo servicios, equipo y noticias. Incluye SEO avanzado y un panel de administración básico; cuesta $4.300.000 COP.",
      "Para una presencia empresarial más completa, el plan corporativo contempla varias secciones, blog o noticias, SEO avanzado y un panel Admin básico. Su precio es $4.300.000 COP."
    ]
  },
  {
    id: "service-ecommerce",
    keywords: ["ecommerce", "e-commerce", "tienda online", "tienda en linea", "carrito", "pasarela de pago", "vender productos"],
    responses: [
      "Para vender en línea está el plan E-commerce: incluye catálogo con filtros, carrito y pasarela de pago, gestión de stock y seguimiento de pedidos. Cuesta $3.000.000 COP.",
      "El E-commerce es la opción de tienda en línea. El catálogo menciona productos con filtros, pagos, carrito, inventario y seguimiento de pedidos, por $3.000.000 COP."
    ]
  },
  {
    id: "service-ai",
    keywords: ["asistencia con ia", "consultar con ia", "inteligencia artificial", "consulta rapida", "recomendacion de servicio", "ia"],
    responses: [
      "En “Servicios” puedes conversar con el asistente de IA sobre los planes y tu proyecto. También hay consultas rápidas que preparan un mensaje para WhatsApp."
    ]
  },
  {
    id: "contact",
    keywords: ["contacto", "contactar", "whatsapp", "correo", "email", "formulario"],
    responses: [
      "Puedes contactar a ProgramStyle desde “Servicios”: usa el formulario o escribe por WhatsApp al +57 302 747 3875 o al correo programstyle1212@gmail.com. Cuéntales qué tipo de sitio necesitas y qué quieres incluir.",
      "Para pedir una cotización, completa el formulario de Servicios con tu nombre, correo y mensaje; el teléfono y servicio son opcionales. Al enviar, la solicitud se registra para que el administrador pueda revisarla. También puedes escribir directamente por WhatsApp o correo."
    ]
  },
  {
    id: "admin-limits",
    keywords: ["editar servicios", "editar precios", "cambiar catalogo", "gestionar clientes", "administrar solicitudes", "bandeja de entrada", "modificar pagina", "editar inicio"],
    responses: [
      "Puedes preparar y confirmar cambios del contenido de Inicio y Servicios en “Preparar un cambio del sitio”. Las solicitudes del formulario se revisan en Admin; la gestión de clientes como CRM todavía no está disponible."
    ]
  },
  {
    id: "admin-clients",
    keywords: ["cliente", "clientes", "conversacion", "seguimiento"],
    responses: [
      "Admin permite consultar las solicitudes que envían los visitantes desde Servicios y marcarlas como atendidas. Aún no incluye un CRM con historial de clientes o conversaciones."
    ]
  },
  {
    id: "assistant",
    keywords: ["eres ia", "eres una ia", "eres un chatbot", "como funciona el asistente", "asistente administrativo"],
    responses: [
      "Soy el asistente de ProgramStyle. Uso IA para responder preguntas sobre el sitio; en Admin también puedo guiarte sobre cambios, pero cualquier modificación requiere tu confirmación antes de guardarse."
    ]
  }
];

const ADMIN_HELP_FOLLOW_UPS = {
  "admin-create": "Abre “Agregar nuevo administrador”, ingresa un correo y una contraseña de al menos 12 caracteres. La cuenta se crea en Supabase solo después de que confirmes la propuesta.",
  "admin-credentials": "Abre “Editar credenciales”, ingresa un correo nuevo, una contraseña nueva o ambos, y confirma la propuesta para aplicar el cambio.",
  "admin-login": "La página de acceso está enlazada como “Admin” en la navegación. Si ya estás dentro, evita cerrar la sesión antes de actualizar las credenciales.",
  "admin-sessions": "La lista de cuentas administradoras aparece en la sección “Administradores autorizados”. Puedes eliminar otras cuentas, pero no la cuenta con la que estás dentro.",
  "admin-overview": "Admin permite gestionar solicitudes, editar el contenido del sitio y administrar cuentas. El asistente orienta, pero los cambios solo se guardan al confirmarlos.",
  "admin-requests": "El formulario está en la página “Servicios”. En Admin, abre “Ver solicitudes” para revisarlas y marcarlas como atendidas.",
  "home-projects": "Puedes volver a la parte superior con “Inicio” en el menú. Los enlaces de proyecto se abren en otra pestaña.",
  "home": "Usa “Ver servicios” para ir al catálogo o baja a “Proyectos realizados” para abrir los ejemplos.",
  "home-design": "La portada describe sitios empresariales adaptables a móviles y escritorio, con la identidad visual de ProgramStyle.",
  "service-discount": "La promoción del 25% está incluida dentro de la tarjeta de Landing Page. Para confirmar las condiciones, envía el formulario de cotización.",
  "service-overview": "El catálogo está en la página “Servicios”, debajo del encabezado. Las tarjetas incluyen características, precio de referencia y acceso a cotización.",
  "service-prices": "Los precios son valores de partida, no tarifas garantizadas: el texto del catálogo indica que pueden variar según urgencia, integraciones de IA y detalle del proyecto.",
  "service-landing": "La opción de cotización de cada tarjeta está prevista en el catálogo, y el formulario general aparece más abajo en la página.",
  "service-corporate": "El precio indicado es inicial; una cotización puede precisar secciones, contenido e integraciones que requiera cada empresa.",
  "service-ecommerce": "Si tienes necesidades específicas de pagos o inventario, descríbelas en el campo de mensaje del formulario para que se consideren al cotizar.",
  "service-ai": "En Servicios puedes consultar el chatbot de IA con preguntas libres. Las opciones rápidas siguen permitiendo preparar consultas para WhatsApp.",
  "contact": "El formulario solicita nombre, correo y mensaje; el teléfono y el servicio son opcionales. Los envíos quedan registrados para que Admin los revise.",
  "admin-limits": "Puedes revisar solicitudes, editar el contenido compartido de Inicio y Servicios, crear cuentas y cambiar credenciales. La aplicación todavía no ofrece un CRM con historial de clientes.",
  "admin-clients": "Puedes revisar solicitudes de contacto en Admin, pero todavía no hay CRM ni historial de conversaciones.",
  "assistant": "Uso IA para responder dudas sobre Admin, Inicio y Servicios. No ejecuto cambios por mi cuenta: prepara una propuesta y confírmala desde el panel para guardarla.",
  "local-editor": "Puedes editar títulos, descripciones, datos de proyectos, planes, precios, características, contacto y consultas rápidas. Las propuestas requieren confirmación y se guardan en el backend compartido."
};

const CONTENT_FIELD_LABELS = {
  "home.title": "Inicio · título principal",
  "home.description": "Inicio · descripción principal",
  "home.servicesButton": "Inicio · botón de Servicios",
  "home.adminButton": "Inicio · botón de Admin",
  "home.projectsLabel": "Inicio · etiqueta de proyectos",
  "home.projectsTitle": "Inicio · título de proyectos",
  "home.projectsDescription": "Inicio · descripción de proyectos",
  "services.title": "Servicios · título principal",
  "services.description": "Servicios · introducción",
  "services.aiTitle": "Servicios · título de asistencia",
  "services.aiDescription": "Servicios · descripción de asistencia",
  "services.aiButton": "Servicios · botón de asistencia",
  "services.aiPanelTitle": "Servicios · título de consultas rápidas",
  "services.contactTitle": "Servicios · título de contacto",
  "services.phoneLabel": "Servicios · etiqueta del teléfono",
  "services.phone": "Servicios · teléfono de contacto",
  "services.whatsapp": "Servicios · número de WhatsApp",
  "services.emailLabel": "Servicios · etiqueta del correo",
  "services.email": "Servicios · correo de contacto",
  "services.contactNote": "Servicios · nota de contacto",
  "services.nameLabel": "Servicios · etiqueta del nombre",
  "services.namePlaceholder": "Servicios · ejemplo para el nombre",
  "services.emailFieldLabel": "Servicios · etiqueta del correo del formulario",
  "services.emailPlaceholder": "Servicios · ejemplo para el correo",
  "services.phoneFieldLabel": "Servicios · etiqueta del teléfono del formulario",
  "services.phonePlaceholder": "Servicios · ejemplo para el teléfono",
  "services.packageFieldLabel": "Servicios · etiqueta del plan",
  "services.packagePlaceholder": "Servicios · opción inicial del selector",
  "services.otherPackageLabel": "Servicios · opción Otro del selector",
  "services.messageLabel": "Servicios · etiqueta del mensaje",
  "services.messagePlaceholder": "Servicios · ejemplo para el mensaje",
  "services.submitLabel": "Servicios · botón del formulario",
  "services.quoteButtonLabel": "Servicios · botón para cotizar un plan",
  "services.requestGreeting": "Servicios · saludo de la solicitud",
  "services.requestSubject": "Servicios · asunto del correo de solicitud",
  "services.aiSentMessage": "Servicios · confirmación de consulta rápida",
  "services.requiredFieldsMessage": "Servicios · aviso de campos obligatorios",
  "services.invalidEmailMessage": "Servicios · aviso de correo no válido"
};

function getSiteContentFields() {
  const fields = Object.entries(CONTENT_FIELD_LABELS).map(([path, label]) => ({ path, label }));

  siteContent.home.projects.forEach((project, index) => {
    const prefix = `home.projects.${index}`;
    ["name", "description", "url", "image", "alt"].forEach((key) => {
      fields.push({ path: `${prefix}.${key}`, label: `Inicio · ${project.name} · ${key}` });
    });
  });

  siteContent.services.packages.forEach((pack, index) => {
    const prefix = `services.packages.${index}`;
    fields.push({ path: `${prefix}.name`, label: `Servicios · ${pack.name} · nombre` });
    fields.push({ path: `${prefix}.price`, label: `Servicios · ${pack.name} · precio` });
    fields.push({ path: `${prefix}.features`, label: `Servicios · ${pack.name} · características (una por línea)` });
    fields.push({ path: `${prefix}.observation`, label: `Servicios · ${pack.name} · descripción` });
  });

  siteContent.services.aiOptions.forEach((option, index) => {
    const prefix = `services.aiOptions.${index}`;
    fields.push({ path: `${prefix}.label`, label: `Servicios · consulta rápida ${index + 1} · nombre` });
    fields.push({ path: `${prefix}.prompt`, label: `Servicios · consulta rápida ${index + 1} · mensaje` });
  });

  return fields;
}

function getValueAtPath(object, path) {
  return path.split(".").reduce((value, key) => value[key], object);
}

function setValueAtPath(object, path, value) {
  const keys = path.split(".");
  const property = keys.pop();
  const target = keys.reduce((current, key) => current[key], object);
  target[property] = value;
}

function isSafeContentValue(path, value) {
  if (typeof value !== "string" || !value.trim()) return false;
  if (/\.(url|image)$/.test(path)) {
    return /^(https?:\/\/|\.{1,2}\/|\/)/i.test(value.trim());
  }
  if (path === "services.email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  if (path === "services.phone" || path === "services.whatsapp") {
    return /^\+?\d{8,15}$/.test(value.trim().replace(/[\s()-]/g, ""));
  }
  return true;
}

function renderContentFieldOptions() {
  if (!siteContentField) return;
  siteContentField.replaceChildren();
  siteContentOptions?.replaceChildren();

  getSiteContentFields().forEach(({ path, label }) => {
    const option = document.createElement("option");
    option.value = path;
    option.textContent = label;
    siteContentField.appendChild(option);

    const menuOption = document.createElement("button");
    menuOption.type = "button";
    menuOption.className = "custom-select-option";
    menuOption.id = `site-content-option-${siteContentOptions.children.length}`;
    menuOption.dataset.value = path;
    menuOption.setAttribute("role", "option");
    menuOption.setAttribute("aria-selected", "false");
    menuOption.textContent = label;
    menuOption.addEventListener("click", () => selectContentField(path));
    siteContentOptions?.appendChild(menuOption);
  });

  updateContentFieldValue();
}

function selectContentField(path) {
  if (!siteContentField) return;
  siteContentField.value = path;
  updateContentFieldValue();
  closeContentFieldMenu();
  siteContentSelectTrigger?.focus();
}

function openContentFieldMenu() {
  if (!siteContentOptions || !siteContentSelectTrigger) return;
  siteContentOptions.classList.remove("hidden");
  siteContentSelectTrigger.setAttribute("aria-expanded", "true");
  const selectedOption = siteContentOptions.querySelector('[aria-selected="true"]') || siteContentOptions.firstElementChild;
  selectedOption?.scrollIntoView({ block: "nearest" });
}

function closeContentFieldMenu() {
  if (!siteContentOptions || !siteContentSelectTrigger) return;
  siteContentOptions.classList.add("hidden");
  siteContentSelectTrigger.setAttribute("aria-expanded", "false");
}

function updateContentFieldValue() {
  if (!siteContentField || !siteContentValue) return;
  const value = getValueAtPath(siteContent, siteContentField.value);
  siteContentValue.value = Array.isArray(value) ? value.join("\n") : value;

  if (siteContentSelectLabel) {
    siteContentSelectLabel.textContent = siteContentField.selectedOptions[0]?.textContent || "Selecciona un dato";
  }
  siteContentOptions?.querySelectorAll(".custom-select-option").forEach((option) => {
    const isSelected = option.dataset.value === siteContentField.value;
    option.setAttribute("aria-selected", String(isSelected));
  });
}

function stageAdminChange(change) {
  if (pendingAdminChange) {
    return false;
  }

  pendingAdminChange = change;
  changeTitle.textContent = change.title;
  changeDescription.textContent = change.description;
  changePreview.classList.remove("hidden");
  changePreview.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return true;
}

function stageSiteContentChange(path, rawValue, source) {
  const value = Array.isArray(getValueAtPath(siteContent, path))
    ? rawValue.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
    : rawValue.trim();

  if (!Array.isArray(value) && !isSafeContentValue(path, value)) {
    return false;
  }

  const updatedContent = JSON.parse(JSON.stringify(siteContent));
  const previousValue = getValueAtPath(siteContent, path);
  setValueAtPath(updatedContent, path, value);
  if (path === "services.phone" || path === "services.whatsapp") {
    const phoneDigits = value.replace(/\D/g, "");
    if (path === "services.phone") {
      updatedContent.services.whatsapp = phoneDigits;
    } else {
      updatedContent.services.phone = `+${phoneDigits}`;
    }
  }
  const field = getSiteContentFields().find((entry) => entry.path === path);
  const readablePreviousValue = Array.isArray(previousValue) ? previousValue.join(", ") : previousValue;
  const readableValue = Array.isArray(value) ? value.join(", ") : value;
  const phoneSyncNotice = path === "services.phone" || path === "services.whatsapp"
    ? "\nTambién se actualizará el enlace de WhatsApp y el número visible para mantenerlos sincronizados."
    : "";
  return stageAdminChange({
    type: "site-content",
    content: updatedContent,
    title: "Revisa el cambio propuesto",
    description: `${field?.label || path}\nAntes: “${readablePreviousValue}”\nNuevo: “${readableValue}”.${phoneSyncNotice}${source === "chat" ? "\nPropuesta preparada a partir de tu mensaje." : ""}`
  });
}

async function confirmPendingAdminChange() {
  if (!pendingAdminChange) return;

  try {
    if (pendingAdminChange.type === "site-content") {
      siteContent = await ProgramStyleContent.save(pendingAdminChange.content);
      renderContentFieldOptions();
      siteContentForm?.reset();
      updateContentFieldValue();
      addChatMessage("¡Listo! El cambio quedó guardado en el sitio y ya está disponible para todos. Recarga Inicio o Servicios para verlo.", "assistant");
    } else if (pendingAdminChange.type === "admin-create") {
      await adminRequest("admins", {
        method: "POST",
        body: { action: "create", ...pendingAdminChange.user }
      });
      createAdminForm?.reset();
      await updateSessionList();
      setMessage(createAdminMessage, "Nueva cuenta administradora guardada.", "success");
      addChatMessage(`La cuenta “${pendingAdminChange.user.email}” se creó tras tu confirmación.`, "assistant");
    } else if (pendingAdminChange.type === "admin-profile") {
      const { admin } = await adminRequest("admins", {
        method: "POST",
        body: { action: "update-profile", ...pendingAdminChange.profile }
      });
      currentAdmin = admin;
      editAdminForm?.reset();
      await updateSessionList();
      setMessage(editAdminMessage, "Credenciales actualizadas.", "success");
      addChatMessage("Credenciales actualizadas en la cuenta administrativa.", "assistant");
    }
  } catch (error) {
    addChatMessage(`No se pudo guardar el cambio: ${error.message}`, "assistant");
    if (pendingAdminChange.type === "admin-create") setMessage(createAdminMessage, error.message, "error");
    else if (pendingAdminChange.type === "admin-profile") setMessage(editAdminMessage, error.message, "error");
    else setBackendStatus(error.message, "error");
    return;
  }

  pendingAdminChange = null;
  changePreview.classList.add("hidden");
}

function cancelPendingAdminChange() {
  if (!pendingAdminChange) return;
  if (pendingAdminChange.type === "admin-create") createAdminForm?.reset();
  if (pendingAdminChange.type === "admin-profile") editAdminForm?.reset();
  pendingAdminChange = null;
  changePreview.classList.add("hidden");
  createAdminForm?.reset();
  editAdminForm?.reset();
  addChatMessage("Propuesta cancelada. No guardé ningún cambio.", "assistant");
}

function getRequestedContentChange(question) {
  const normalisedQuestion = normaliseChatText(question);
  if (!/\b(cambia|cambiar|actualiza|actualizar|modifica|modificar|edita|editar|pon|poner|reemplaza|reemplazar)\b/.test(normalisedQuestion)) {
    return null;
  }

  const matches = Array.from(question.matchAll(/\b(?:a|por)\s+/gi));
  if (!matches.length) return null;
  const lastConnector = matches[matches.length - 1];
  const value = question.slice(lastConnector.index + lastConnector[0].length).trim().replace(/[?.!]+$/, "");
  if (!value) return null;

  let path = null;
  const selectedProjectIndex = siteContent.home.projects.findIndex((project) =>
    normalisedQuestion.includes(normaliseChatText(project.name))
  );
  const selectedPackageIndex = siteContent.services.packages.findIndex((pack) => {
    const name = normaliseChatText(pack.name);
    if (normalisedQuestion.includes(name)) return true;
    if (name.includes("landing") && (
      /\blanding\b/.test(normalisedQuestion) ||
      /\b(descuento|promocion|oferta)\b/.test(normalisedQuestion)
    )) return true;
    if (name.includes("corporativo") && /\b(corporativo|empresa)\b/.test(normalisedQuestion)) return true;
    if (name.includes("e commerce") && /\b(e commerce|tienda en linea|tienda online)\b/.test(normalisedQuestion)) return true;
    return name.includes("descuento") && /\b(descuento|promocion|oferta)\b/.test(normalisedQuestion);
  });

  if (selectedProjectIndex >= 0) {
    const property = /\b(nombre|titulo)\b/.test(normalisedQuestion)
      ? "name"
      : /\b(link|enlace|url|direccion)\b/.test(normalisedQuestion)
        ? "url"
        : /\b(imagen|foto)\b/.test(normalisedQuestion)
          ? "image"
          : "description";
    path = `home.projects.${selectedProjectIndex}.${property}`;
  } else if (selectedPackageIndex >= 0) {
    const property = /\b(descuento|promocion|oferta)\b/.test(normalisedQuestion)
      ? "features"
      : /\b(precio|valor|costo)\b/.test(normalisedQuestion)
        ? "price"
        : /\b(caracteristica|incluye|incluyen|beneficio)\b/.test(normalisedQuestion)
          ? "features"
          : /\b(nombre|titulo)\b/.test(normalisedQuestion)
            ? "name"
            : "observation";
    path = `services.packages.${selectedPackageIndex}.${property}`;
  } else if (/\b(correo|email)\b/.test(normalisedQuestion)) {
    path = "services.email";
  } else if (/\b(whatsapp|telefono)\b/.test(normalisedQuestion)) {
    path = "services.phone";
  } else if (/\b(precio|valor|costo)\b/.test(normalisedQuestion) && selectedPackageIndex < 0) {
    return null;
  } else if (/\b(titulo|encabezado)\b/.test(normalisedQuestion)) {
    path = /\b(asistencia|ia)\b/.test(normalisedQuestion)
      ? "services.aiTitle"
      : /\b(contacto)\b/.test(normalisedQuestion)
        ? "services.contactTitle"
        : /\b(proyectos|casos de exito)\b/.test(normalisedQuestion)
          ? "home.projectsTitle"
          : /\b(servicios|planes|catalogo)\b/.test(normalisedQuestion)
            ? "services.title"
            : "home.title";
  } else if (/\b(proyectos|casos de exito)\b/.test(normalisedQuestion) && /\b(descripcion|texto)\b/.test(normalisedQuestion)) {
    path = "home.projectsDescription";
  } else if (/\b(descripcion|texto|introduccion)\b/.test(normalisedQuestion)) {
    path = /\b(contacto|cotizacion)\b/.test(normalisedQuestion)
      ? "services.contactNote"
      : /\b(asistencia|ia)\b/.test(normalisedQuestion)
        ? "services.aiDescription"
        : /\b(servicios|planes|catalogo)\b/.test(normalisedQuestion)
          ? "services.description"
          : /\b(inicio|portada|principal)\b/.test(normalisedQuestion)
            ? "home.description"
            : null;
  } else if (/\b(etiqueta|boton|nombre del boton)\b/.test(normalisedQuestion)) {
    path = /\b(contacto|solicitud)\b/.test(normalisedQuestion)
      ? "services.submitLabel"
      : /\b(admin|administrador)\b/.test(normalisedQuestion)
        ? "home.adminButton"
        : /\b(servicios)\b/.test(normalisedQuestion)
          ? "home.servicesButton"
          : /\b(cotizar|plan)\b/.test(normalisedQuestion)
            ? "services.quoteButtonLabel"
            : "services.aiButton";
  }

  return path ? { path, value } : null;
}

function getSafeCreateAdminGuidance() {
  const createPanel = document.getElementById("create-admin-panel");
  createPanel?.classList.remove("hidden-panel");
  createPanel?.scrollIntoView({ behavior: "smooth", block: "center" });
  return "Puedo acompañarte, pero no escribas contraseñas en el chat. Abre “Agregar nuevo administrador”, ingresa un correo y una contraseña segura de al menos 12 caracteres; la cuenta solo se crea cuando confirmes.";
}

function getDynamicAdminHelpResponse(topic) {
  const packages = siteContent.services.packages;

  if (topic.id === "service-prices") {
    const prices = packages.map(({ name, price }) => `${name}: ${price}`).join("; ");
    return `Los precios que aparecen ahora en Servicios son: ${prices}. Son los valores compartidos del sitio y pueden variar según el proyecto.`;
  }

  if (topic.id === "service-overview") {
    const names = packages.map(({ name }) => name).join(", ");
    return `En Servicios tienes estas opciones: ${names}. Puedes editar sus datos desde “Preparar un cambio del sitio”; los cambios solo se aplican tras confirmarlos.`;
  }

  if (topic.id === "service-maintenance") {
    const plan = packages.find(({ name }) => normaliseChatText(name).includes("mantenimiento"));
    if (plan) {
      return `${plan.name}: ${plan.price}. ${plan.observation} Incluye: ${plan.features.join("; ")}.`;
    }
  }

  const packageIndexByTopic = {
    "service-landing": "Landing Page",
    "service-corporate": "Sitio Corporativo",
    "service-discount": "Landing Page",
    "service-ecommerce": "E-commerce"
  };
  const packageName = packageIndexByTopic[topic.id];
  const selectedPackage = packages.find(({ name }) => name === packageName);
  if (selectedPackage) {
    const features = selectedPackage.features.join("; ");
    return `${selectedPackage.name}: ${selectedPackage.price}. ${selectedPackage.observation} Incluye: ${features}.`;
  }

  if (topic.id === "home-projects") {
    const projects = siteContent.home.projects
      .map(({ name, description }) => `${name}: ${description}`)
      .join(" ");
    return `En Inicio aparecen estos proyectos: ${projects}`;
  }

  if (topic.id === "home") {
    return `La portada de Inicio dice “${siteContent.home.title}”. ${siteContent.home.description} Desde allí puedes usar “${siteContent.home.servicesButton}” o bajar a “${siteContent.home.projectsTitle}”.`;
  }

  if (topic.id === "contact") {
    return `Los datos actuales de contacto en Servicios son ${siteContent.services.phone} y ${siteContent.services.email}. ${siteContent.services.contactNote}`;
  }

  if (topic.id === "service-ai") {
    const options = siteContent.services.aiOptions.map(({ label }) => label).join(", ");
    return `${siteContent.services.aiTitle}: ${siteContent.services.aiDescription} Las consultas rápidas disponibles son: ${options}. Al elegir una se prepara el mensaje para WhatsApp.`;
  }

  return null;
}

async function adminRequest(functionName, options = {}) {
  if (!supabase) throw supabaseConfigError;
  return invokeFunction(functionName, options);
}

async function updateSessionList() {
  if (!sessionList) return;
  try {
    const { admins } = await adminRequest("admins", { method: "GET" });
    if (!admins.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "panel-message";
      emptyMessage.textContent = "No hay cuentas administradoras.";
      sessionList.replaceChildren(emptyMessage);
      return;
    }

    const adminItems = admins.map((admin) => {
      const item = document.createElement("div");
      item.className = "session-item";

      const user = document.createElement("strong");
      user.textContent = admin.email;

      const badge = document.createElement("span");
      badge.className = "badge active";
      badge.textContent = admin.id === currentAdmin?.id ? "Tu cuenta" : "Administrador";
      item.append(user, badge);

      if (admin.id !== currentAdmin?.id) {
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-secondary";
        removeButton.textContent = "Eliminar";
        removeButton.addEventListener("click", async () => {
          if (!window.confirm(`¿Eliminar la cuenta administradora ${admin.email}?`)) return;
          try {
            await adminRequest("admins", { method: "POST", body: { action: "delete", id: admin.id } });
            setMessage(sessionMessage, `Se eliminó ${admin.email}.`, "success");
            await updateSessionList();
          } catch (error) {
            setMessage(sessionMessage, error.message, "error");
          }
        });
        item.append(removeButton);
      }
      return item;
    });
    sessionList.replaceChildren(...adminItems);
  } catch (error) {
    setMessage(sessionMessage, error.message, "error");
  }
}

async function updateContactRequests() {
  if (!contactRequestsList) return;
  contactRequestsList.replaceChildren();
  setMessage(contactRequestsMessage, "Cargando solicitudes...", "");
  try {
    const { requests } = await adminRequest("contact-requests", { method: "GET" });
    if (!Array.isArray(requests)) throw new Error("El servidor devolvió una lista de solicitudes no válida.");
    if (contactRequestCount) contactRequestCount.textContent = String(requests.filter(({ status }) => status === "new").length);
    if (!requests.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "panel-message";
      emptyMessage.textContent = "Todavía no hay solicitudes de contacto.";
      contactRequestsList.replaceChildren(emptyMessage);
      setMessage(contactRequestsMessage, "", "");
      return;
    }

    const requestCards = requests.map((request) => {
      const item = document.createElement("article");
      item.className = "contact-request-card";
      const heading = document.createElement("div");
      heading.className = "contact-request-heading";
      const name = document.createElement("strong");
      name.textContent = request.name;
      const status = document.createElement("span");
      status.className = `badge ${request.status === "new" ? "active" : ""}`;
      status.textContent = request.status === "new" ? "Nueva" : "Atendida";
      heading.append(name, status);

      const details = document.createElement("p");
      details.textContent = [
        request.email,
        request.phone,
        request.service ? `Servicio: ${request.service}` : null,
        request.created_at ? new Date(request.created_at).toLocaleString() : null
      ].filter(Boolean).join(" · ");
      const message = document.createElement("p");
      message.className = "contact-request-message";
      message.textContent = request.message;
      item.append(heading, details, message);

      if (request.status === "new") {
        const markButton = document.createElement("button");
        markButton.type = "button";
        markButton.className = "btn btn-secondary";
        markButton.textContent = "Marcar atendida";
        markButton.addEventListener("click", async () => {
          markButton.disabled = true;
          try {
            await adminRequest("contact-requests", { body: { id: request.id, status: "contacted" } });
            setMessage(contactRequestsMessage, "Solicitud marcada como atendida.", "success");
            await updateContactRequests();
          } catch (error) {
            markButton.disabled = false;
            setMessage(contactRequestsMessage, error.message, "error");
          }
        });
        item.append(markButton);
      }
      return item;
    });
    contactRequestsList.replaceChildren(...requestCards);
    setMessage(contactRequestsMessage, "", "");
  } catch (error) {
    contactRequestsList.replaceChildren();
    setMessage(contactRequestsMessage, `No se pudieron cargar las solicitudes: ${error.message}`, "error");
  }
}

function showAdminDashboard(admin) {
  currentAdmin = admin;
  if (loginSection) loginSection.classList.add("hidden");
  if (adminDashboard) {
    adminDashboard.classList.remove("hidden");
    adminDashboard.classList.add("visible");
  }
  updateSessionList();
  updateContactRequests();
}

function showLogin() {
  currentAdmin = null;
  if (loginSection) loginSection.classList.remove("hidden");
  if (adminDashboard) {
    adminDashboard.classList.add("hidden");
    adminDashboard.classList.remove("visible");
  }
}

function setBackendStatus(message, type = "") {
  if (!backendStatus) return;
  backendStatus.textContent = message;
  backendStatus.classList.remove("success", "error");
  if (type) backendStatus.classList.add(type);
}

async function initializeAdmin() {
  siteContent = await ProgramStyleContent.load();
  renderContentFieldOptions();
  updateContentFieldValue();
  if (isPasswordRecovery) {
    showPasswordRecoveryForm();
    setBackendStatus("Enlace de recuperación verificado. Define una contraseña nueva.");
    return;
  }

  const contentError = ProgramStyleContent.getLoadError();
  if (contentError) {
    showLogin();
    setBackendStatus(`No se pudo cargar el contenido compartido: ${contentError.message}`, "error");
    return;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) {
      showLogin();
      setBackendStatus("Backend conectado. Inicia sesión con una cuenta autorizada.");
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    await adminRequest("admins", { method: "GET" });
    showAdminDashboard({ id: user.id, email: user.email });
    setBackendStatus("Conectado: los cambios se guardan de forma compartida.", "success");
  } catch (error) {
    await supabase.auth.signOut();
    showLogin();
    setBackendStatus(error.message, "error");
  }
}

function showPasswordRecoveryForm() {
  isPasswordRecovery = true;
  loginForm?.classList.add("hidden");
  passwordResetForm?.classList.add("hidden");
  passwordRecoveryForm?.classList.remove("hidden");
  adminDashboard?.classList.add("hidden");
  adminDashboard?.classList.remove("visible");
  loginSection?.classList.remove("hidden");
  document.getElementById("recovery-password")?.focus();
}

function showLoginForm() {
  isPasswordRecovery = false;
  passwordRecoveryForm?.classList.add("hidden");
  passwordResetForm?.classList.add("hidden");
  loginForm?.classList.remove("hidden");
  setMessage(passwordResetMessage, "", "");
  setMessage(passwordRecoveryMessage, "", "");
}

function setMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.classList.remove("success", "error");
  if (type) element.classList.add(type);
}

function normaliseChatText(text) {
  return text
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAdminHelpResponse(question) {
  const normalisedQuestion = normaliseChatText(question);
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal)$/.test(normalisedQuestion)) {
    return "¡Hola! Aquí estoy para ayudarte. Puedes preguntarme por Admin, Inicio o Servicios; también puedes pedirme un cambio, revisar la propuesta y decidir si quieres guardarla para todos.";
  }

  if (/^(gracias|muchas gracias|te agradezco|perfecto gracias|listo gracias)$/.test(normalisedQuestion)) {
    return "¡Con gusto! Si te surge otra duda de Admin, Inicio o Servicios, pregúntame nomás.";
  }

  if (/^(que puedes hacer|en que me ayudas|como me ayudas|ayuda|ayudame)$/.test(normalisedQuestion)) {
    return "Puedo guiarte por Admin, Inicio y Servicios; editar títulos, descripciones, proyectos, precios, características y datos de contacto; y ayudarte a preparar cuentas admin. Antes de guardar cualquier propuesta te pediré confirmación. Los cambios confirmados se comparten con los visitantes.";
  }

  if (/\b(crear|agregar|añadir|sumar)\b/.test(normalisedQuestion) && /\b(admin|administrador|usuario|cuenta)\b/.test(normalisedQuestion)) {
    lastAdminHelpTopic = "admin-create";
    return getSafeCreateAdminGuidance();
  }

  const requestedChange = getRequestedContentChange(question);
  if (requestedChange) {
    lastAdminHelpTopic = "local-editor";
    if (pendingAdminChange) return "Primero confirma o cancela la propuesta que ya está pendiente; así no se mezclan cambios.";

    return stageSiteContentChange(requestedChange.path, requestedChange.value, "chat")
      ? "Preparé una vista previa del cambio. Revísala y pulsa “Confirmar y guardar” si estás de acuerdo; puedes cancelarla sin guardar. Al confirmarlo, se guardará para los visitantes."
      : "No pude preparar ese cambio: revisa que el contenido no esté vacío y que los enlaces, el correo o el número tengan un formato válido.";
  }

  if (
    /\b(cambia|cambiar|actualiza|actualizar|modifica|modificar|edita|editar|pon|poner|reemplaza|reemplazar)\b/.test(normalisedQuestion) &&
    /\b(titulo|precio|descripcion|proyecto|servicio|contacto|correo|email|telefono|whatsapp|caracteristica|boton|nombre)\b/.test(normalisedQuestion)
  ) {
    lastAdminHelpTopic = "local-editor";
    if (/\b(precio|valor|costo)\b/.test(normalisedQuestion)) {
      return "¿De cuál plan quieres cambiar el precio: Landing Page, Sitio Corporativo, E-commerce o Mantenimiento Web? Indica también el valor nuevo y te prepararé la vista previa.";
    }
    return "¡Dale! Dime el dato y su nuevo valor, por ejemplo: “Cambia el título de Inicio a Sitios para crecer”. También puedes elegir cualquier campo en “Preparar un cambio del sitio”. Primero verás la propuesta; solo se guarda al confirmarla.";
  }

  const topic = ADMIN_HELP_TOPICS
    .map((candidate) => {
      const keywordScore = Math.max(
        0,
        ...candidate.keywords
          .map(normaliseChatText)
          .filter((keyword) => {
            if (keyword.includes(" ")) return normalisedQuestion.includes(keyword);

            const words = normalisedQuestion.split(" ");
            return words.some((word) =>
              word === keyword ||
              word === `${keyword}s` ||
              word === `${keyword}es` ||
              (keyword.endsWith("s") && word === keyword.slice(0, -1))
            );
          })
          .map((keyword) => keyword.length)
      );

      return {
        candidate,
        score: keywordScore ? keywordScore + (candidate.priority || 0) : 0
      };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)[0]?.candidate;

  if (topic) {
    lastAdminHelpTopic = topic.id;
    return getDynamicAdminHelpResponse(topic) || topic.responses[Math.floor(Math.random() * topic.responses.length)];
  }

  if (
    lastAdminHelpTopic &&
    /^(y|pero|entonces|ahora|ok|okay|vale|claro|bien|mas|dime|explica|detalla|puedes|como asi|y eso|que sigue)/.test(normalisedQuestion)
  ) {
    const followUp = ADMIN_HELP_FOLLOW_UPS[lastAdminHelpTopic];
    if (followUp) return followUp;
  }

  return "No tengo ese detalle a mano todavía, pero podemos ubicarlo juntos. Puedo orientarte sobre las cuentas y sesiones de Admin, la portada y los proyectos de Inicio, o los planes, precios y contacto de Servicios. ¿Qué estabas intentando hacer?";
}

function addChatMessage(text, sender) {
  if (!adminChatMessages) return;

  const message = document.createElement("div");
  message.className = `chat-message ${sender}-message`;

  const label = document.createElement("strong");
  label.textContent = sender === "user" ? "Tú" : "Asistente";

  const content = document.createElement("p");
  content.textContent = text;

  message.append(label, content);
  adminChatMessages.append(message);
  adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
  return message;
}

async function sendAdminChatMessage(question) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion || !adminChatMessages || adminChatInput?.disabled) return;

  addChatMessage(trimmedQuestion, "user");
  if (getRequestedContentChange(trimmedQuestion)) {
    addChatMessage(getAdminHelpResponse(trimmedQuestion), "assistant");
    return;
  }

  if (!supabase) {
    addChatMessage(supabaseConfigError?.message || "No se pudo conectar el asistente con el servidor de IA.", "assistant");
    return;
  }

  adminChatInput.disabled = true;
  const sendButton = adminChatForm.querySelector("button[type='submit']");
  if (sendButton) sendButton.disabled = true;
  const loading = addChatMessage("Estoy revisando la información de ProgramStyle...", "assistant");
  try {
    const data = await invokeFunction("ai-chat", {
      body: { message: trimmedQuestion, audience: "admin" }
    });
    loading.querySelector("p").textContent = data.reply;
  } catch (error) {
    loading.querySelector("p").textContent = `No se pudo consultar la IA: ${error.message}. Inténtalo de nuevo más tarde.`;
    loading.classList.add("error");
  } finally {
    adminChatInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      setMessage(loginError, "Completa el correo y la contraseña para continuar.", "error");
      return;
    }
    if (!supabase || supabaseConfigError) {
      setMessage(loginError, supabaseConfigError?.message || "Supabase no está configurado.", "error");
      return;
    }
    if (ProgramStyleContent.getLoadError()) {
      setMessage(loginError, "No se pudo cargar el contenido del sitio. Actualiza la página y comprueba la conexión antes de iniciar sesión.", "error");
      return;
    }

    loginForm.querySelector("button[type='submit']").disabled = true;
    supabase.auth.signInWithPassword({ email, password }).then(async ({ data, error }) => {
      if (error) throw error;
      await adminRequest("admins", { method: "GET" });
      showAdminDashboard({ id: data.user.id, email: data.user.email });
      setBackendStatus("Conectado: los cambios se guardan de forma compartida.", "success");
      setMessage(loginError, "Acceso correcto.", "success");
      loginForm.reset();
    }).catch(async (error) => {
      if (supabase.auth.getSession) await supabase.auth.signOut();
      setMessage(loginError, error.message, "error");
    }).finally(() => {
      loginForm.querySelector("button[type='submit']").disabled = false;
    });
  });
}

const recoveryQuery = new URLSearchParams(window.location.search);
const recoveryHash = new URLSearchParams(window.location.hash.slice(1));
if (recoveryQuery.get("type") === "recovery" || recoveryQuery.has("code") || recoveryHash.get("type") === "recovery") {
  isPasswordRecovery = true;
}

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") showPasswordRecoveryForm();
  });
}

if (showResetFormButton && passwordResetForm && loginForm) {
  showResetFormButton.addEventListener("click", () => {
    document.getElementById("password-reset-email").value = document.getElementById("usuario").value.trim();
    passwordResetForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    document.getElementById("password-reset-email").focus();
  });
}

if (backToLoginFromResetButton) {
  backToLoginFromResetButton.addEventListener("click", showLoginForm);
}

if (passwordResetForm) {
  passwordResetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("password-reset-email").value.trim();
    if (!email) {
      setMessage(passwordResetMessage, "Escribe el correo de tu cuenta administradora.", "error");
      document.getElementById("password-reset-email").focus();
      return;
    }
    if (!supabase) {
      setMessage(passwordResetMessage, supabaseConfigError?.message || "Supabase no está configurado.", "error");
      return;
    }

    const submitButton = passwordResetForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setMessage(passwordResetMessage, "Enviando el enlace de recuperación...", "");
    try {
      const redirectTo = new URL(`${import.meta.env.BASE_URL}admin.html`, window.location.origin).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setMessage(passwordResetMessage, "Si el correo corresponde a una cuenta, recibirás un enlace para cambiar la contraseña. Revisa también Spam.", "success");
    } catch (error) {
      setMessage(passwordResetMessage, `No se pudo enviar el enlace: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (passwordRecoveryForm) {
  passwordRecoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("recovery-password").value;
    const confirmation = document.getElementById("recovery-password-confirm").value;
    if (password.length < 12) {
      setMessage(passwordRecoveryMessage, "La contraseña debe tener al menos 12 caracteres.", "error");
      return;
    }
    if (password !== confirmation) {
      setMessage(passwordRecoveryMessage, "Las contraseñas no coinciden.", "error");
      return;
    }
    if (!supabase) {
      setMessage(passwordRecoveryMessage, supabaseConfigError?.message || "Supabase no está configurado.", "error");
      return;
    }

    const submitButton = passwordRecoveryForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setMessage(passwordRecoveryMessage, "Actualizando la contraseña...", "");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      showLoginForm();
      setMessage(loginError, "Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña.", "success");
      setBackendStatus("Contraseña actualizada correctamente.", "success");
      passwordRecoveryForm.reset();
    } catch (error) {
      setMessage(passwordRecoveryMessage, `No se pudo actualizar la contraseña: ${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

if (createAdminForm) {
  createAdminForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("new-admin-user").value.trim();
    const password = document.getElementById("new-admin-pass").value;

    if (!email || !password) {
      setMessage(createAdminMessage, "Completa el correo y la contraseña del nuevo perfil.", "error");
      return;
    }
    if (password.length < 12) {
      setMessage(createAdminMessage, "La contraseña debe tener al menos 12 caracteres.", "error");
      return;
    }

    if (pendingAdminChange) {
      setMessage(createAdminMessage, "Confirma o cancela la propuesta pendiente antes de preparar otra.", "error");
      return;
    }

    const staged = stageAdminChange({
      type: "admin-create",
      user: { email, password },
      title: "Confirma la nueva cuenta administrativa",
      description: `Se creará la cuenta administradora “${email}”. La contraseña no se muestra en la vista previa.`
    });
    if (staged) {
      setMessage(createAdminMessage, "Propuesta lista. La cuenta solo se guardará al confirmar.", "success");
      addChatMessage(`Tengo lista la propuesta para crear “${email}”. Revisa la vista previa y confirma si quieres guardarla.`, "assistant");
    }
  });
}

if (editAdminForm) {
  editAdminForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nuevoCorreo = document.getElementById("updated-admin-user").value.trim();
    const nuevaPassword = document.getElementById("updated-admin-pass").value;

    if (!nuevoCorreo && !nuevaPassword) {
      setMessage(editAdminMessage, "Indica un correo nuevo, una contraseña nueva o ambos.", "error");
      return;
    }
    if (nuevaPassword && nuevaPassword.length < 12) {
      setMessage(editAdminMessage, "La contraseña debe tener al menos 12 caracteres.", "error");
      return;
    }

    if (pendingAdminChange) {
      setMessage(editAdminMessage, "Confirma o cancela la propuesta pendiente antes de preparar otra.", "error");
      return;
    }

    const staged = stageAdminChange({
      type: "admin-profile",
      profile: {
        ...(nuevoCorreo ? { email: nuevoCorreo } : {}),
        ...(nuevaPassword ? { password: nuevaPassword } : {})
      },
      title: "Confirma la actualización de credenciales",
      description: `Se actualizarán las credenciales de “${currentAdmin.email}”. La contraseña no se muestra en la vista previa.`
    });
    if (staged) {
      setMessage(editAdminMessage, "Propuesta lista. Las credenciales solo cambiarán al confirmar.", "success");
      addChatMessage("Preparé la actualización de credenciales. Revisa la vista previa y confirma para guardarla de forma segura.", "assistant");
    }
  });
}

if (siteContentSelectTrigger) {
  siteContentSelectTrigger.addEventListener("click", () => {
    const isExpanded = siteContentSelectTrigger.getAttribute("aria-expanded") === "true";
    if (isExpanded) closeContentFieldMenu();
    else openContentFieldMenu();
  });

  siteContentSelectTrigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeContentFieldMenu();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openContentFieldMenu();
      const options = Array.from(siteContentOptions.querySelectorAll(".custom-select-option"));
      const selectedIndex = options.findIndex((option) => option.dataset.value === siteContentField.value);
      const nextIndex = event.key === "ArrowUp"
        ? Math.max(0, selectedIndex - 1)
        : event.key === "ArrowDown"
          ? Math.min(options.length - 1, selectedIndex + 1)
          : selectedIndex;
      options[nextIndex]?.focus();
    }
  });
}

if (siteContentOptions) {
  siteContentOptions.addEventListener("keydown", (event) => {
    const options = Array.from(siteContentOptions.querySelectorAll(".custom-select-option"));
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") nextIndex = Math.min(options.length - 1, currentIndex + 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else if (event.key === "Escape") {
      closeContentFieldMenu();
      siteContentSelectTrigger?.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    options[nextIndex]?.focus();
  });
}

if (siteContentSelect) {
  document.addEventListener("click", (event) => {
    if (!siteContentSelect.contains(event.target)) closeContentFieldMenu();
  });
}

if (siteContentForm && siteContentField && siteContentValue) {
  siteContentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (pendingAdminChange) {
      addChatMessage("Confirma o cancela la propuesta pendiente antes de preparar otra.", "assistant");
      return;
    }

    if (stageSiteContentChange(siteContentField.value, siteContentValue.value, "editor")) {
      addChatMessage("Ya está lista la vista previa. Revísala y confirma si quieres guardar este cambio para todos.", "assistant");
    } else {
      addChatMessage("No pude preparar el cambio. Comprueba que no esté vacío y que el enlace, correo o teléfono tenga un formato válido.", "assistant");
    }
  });
}

if (confirmChangeBtn) {
  confirmChangeBtn.addEventListener("click", confirmPendingAdminChange);
}

if (cancelChangeBtn) {
  cancelChangeBtn.addEventListener("click", cancelPendingAdminChange);
}

if (adminChatForm && adminChatInput) {
  adminChatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const question = adminChatInput.value.trim();
    if (!question) return;

    void sendAdminChatMessage(question);
    adminChatForm.reset();
    adminChatInput.focus();
  });
}

if (chatQuestionButtons.length) {
  chatQuestionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const question = button.dataset.chatQuestion;
      if (!question) return;

      void sendAdminChatMessage(question);
      adminChatInput?.focus();
    });
  });
}

if (logoutCurrentBtn) {
  logoutCurrentBtn.addEventListener("click", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showLogin();
      setMessage(sessionMessage, "Sesión cerrada.", "success");
    } catch (error) {
      setMessage(sessionMessage, error.message, "error");
    }
  });
}

if (panelToggles.length) {
  panelToggles.forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.dataset.target);
      if (!panel) return;
      panel.classList.toggle("hidden-panel");
    });
  });
}

initializeAdmin().catch((error) => {
  console.error("No se pudo iniciar el panel administrativo:", error);
  setBackendStatus(error.message, "error");
});
