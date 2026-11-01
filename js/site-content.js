import { invokeFunction, supabase, supabaseConfigError, useVercelApi } from "./supabase-client.js";

(() => {
  const DEFAULT_CONTENT = {
    home: {
      title: "Desarrollo de páginas web empresariales",
      description: "Creamos sitios corporativos modernos, funcionales y adaptados a móviles, con identidad visual en negro, dorado y blanco para transmitir elegancia y confianza.",
      servicesButton: "Ver servicios",
      adminButton: "Panel admin",
      projectsLabel: "Proyectos realizados",
      projectsTitle: "Casos de éxito recientes",
      projectsDescription: "Ejemplos de páginas empresariales entregadas por ProgramStyle. Haz clic en cada proyecto para ver el sitio en vivo.",
      projects: [
        {
          name: "Shinsushii",
          description: "Landing web elegante para marca de sushi con enfoque visual y navegación fluida.",
          url: "https://shinsushii.vercel.app/",
          image: "../assets/img/Shinsushii_referencia.png",
          alt: "Shinsushii proyecto web"
        },
        {
          name: "SMPH Compresores",
          description: "Sitio corporativo industrial con enfoque en confianza, servicios y contacto rápido.",
          url: "https://smphcompresores.vercel.app/",
          image: "../assets/img/SMPH_Industrial_referencia.png",
          alt: "SMPH Compresores proyecto web"
        }
      ]
    },
    services: {
      title: "Nuestros Planes y Servicios Web",
      description: "Presentamos los paquetes de desarrollo empresarial de ProgramStyle. Los precios son sugeridos y pueden variar según urgencia, integraciones de IA y detalle del proyecto.",
      packages: [
        {
          name: "Landing Page",
          price: "$1.500.000 COP",
          features: [
            "Diseño responsive para móviles y escritorio",
            "Sección de contacto con formulario",
            "Optimización básica SEO",
            "Integración con WhatsApp para clientes",
            "Contrata una Landing Page y recibe 25% de descuento en tu siguiente proyecto con ProgramStyle."
          ],
          observation: "Ideal para presentar tu empresa con presencia profesional en línea."
        },
        {
          name: "Sitio Corporativo",
          price: "$4.300.000 COP",
          features: [
            "Múltiples secciones de servicios y equipo",
            "Blog o noticias empresariales",
            "Optimización SEO avanzada",
            "Panel de administración básico"
          ],
          observation: "Perfecto para empresas que necesitan una presencia digital sólida y escalable."
        },
        {
          name: "E-commerce",
          price: "$3.000.000 COP",
          features: [
            "Catálogo de productos con filtros",
            "Pasarela de pago y carrito de compras",
            "Integración de stock y seguimiento de pedidos",
            "Optimización orientada a conversión"
          ],
          observation: "Para tiendas en línea que desean vender de forma profesional y segura."
        },
        {
          name: "Mantenimiento Web",
          price: "$350.000 COP",
          features: [
            "Mantenimiento de páginas web desarrolladas por ProgramStyle",
            "10% de descuento en el mantenimiento de una Landing Page, Sitio Corporativo o E-commerce creado por nosotros",
            "Alcance y frecuencia del mantenimiento definidos según las necesidades del sitio"
          ],
          observation: "El descuento del 10% aplica únicamente al mantenimiento de una Landing Page, Sitio Corporativo o E-commerce desarrollado por ProgramStyle. Solicita una cotización para definir el alcance."
        }
      ],
      aiTitle: "Asistencia con IA",
      aiDescription: "Recibe orientación rápida sobre el tipo de proyecto, presupuesto estimado y la mejor opción para tu negocio. Este servicio puede requerir detalles adicionales según el alcance del proyecto.",
      aiButton: "Consultar con IA",
      aiPanelTitle: "Selecciona una consulta rápida:",
      aiOptions: [
        { label: "Landing Page", prompt: "Necesito una Landing Page para presentar mi negocio y captar clientes por WhatsApp." },
        { label: "Sitio corporativo", prompt: "Quiero un sitio corporativo para mi empresa con secciones de servicios, proyectos y contacto." },
        { label: "E-commerce", prompt: "Necesito un ecommerce para vender productos online con catálogo y pagos seguros." }
      ],
      contactTitle: "Contacto directo",
      phoneLabel: "Teléfono / WhatsApp",
      phone: "+57 302 747 3875",
      whatsapp: "573027473875",
      emailLabel: "Correo electrónico",
      email: "programstyle1212@gmail.com",
      contactNote: "Completa el formulario para solicitar una cotización o describir tu requerimiento. Incluye el tipo de servicio si ya sabes qué plan te interesa.",
      nameLabel: "Nombre completo",
      namePlaceholder: "Tu nombre completo",
      emailFieldLabel: "Correo electrónico",
      emailPlaceholder: "nombre@ejemplo.com",
      phoneFieldLabel: "Teléfono / WhatsApp (opcional)",
      phonePlaceholder: "+57 321 1234567",
      packageFieldLabel: "Tipo de servicio",
      packagePlaceholder: "Seleccione un plan",
      otherPackageLabel: "Otro",
      messageLabel: "Mensaje o detalle del requerimiento",
      messagePlaceholder: "Cuéntanos qué necesitas",
      submitLabel: "Enviar solicitud",
      quoteButtonLabel: "Cotizar este plan",
      requestGreeting: "Hola, quiero solicitar una cotización.",
      requestSubject: "Solicitud de cotización ProgramStyle",
      aiSentMessage: "Consulta IA enviada por WhatsApp. También puedes escribirnos por correo.",
      requiredFieldsMessage: "Por favor completa los campos obligatorios.",
      invalidEmailMessage: "Ingresa un correo electrónico válido."
    }
  };

  let currentContent = clone(DEFAULT_CONTENT);
  let loadError = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function migrate(value) {
    const content = clone(value);
    if (content.services.email?.trim().toLowerCase() === "stevan121210@gmail.com") {
      content.services.email = "programstyle1212@gmail.com";
    }
    if (!content.services.quoteButtonLabel || !content.services.quoteButtonLabel.trim()) {
      content.services.quoteButtonLabel = DEFAULT_CONTENT.services.quoteButtonLabel;
    }
    const priceUpdates = {
      "Landing Page": ["Desde $2.200.000 COP (aprox. USD 550)", "$1.500.000 COP"],
      "Sitio Corporativo": ["Desde $4.500.000 COP (aprox. USD 1.125)", "$4.300.000 COP"],
      "E-commerce": ["Desde $7.500.000 COP (aprox. USD 1.875)", "$3.000.000 COP"],
      "Mantenimiento Web": ["Cotización personalizada", "$350.000 COP"]
    };
    content.services.packages.forEach((plan) => {
      const update = priceUpdates[plan.name];
      if (update && plan.price === update[0]) {
        plan.price = update[1];
      }
    });

    const discountPlan = content.services.packages.find((plan) => plan.name === "Descuento especial Landing");
    if (discountPlan) {
      discountPlan.features = discountPlan.features.filter((feature) => feature !== "Ideal para fidelizar clientes empresariales");
      if (discountPlan.price === "40% de descuento en tu siguiente proyecto") {
        discountPlan.price = "25% de descuento en tu siguiente proyecto";
      }
      discountPlan.features = discountPlan.features.map((feature) =>
        feature === "Recibe 40% de descuento en tu próximo proyecto"
          ? "Recibe 25% de descuento en tu próximo proyecto"
          : feature
      );

      const landingPlan = content.services.packages.find((plan) => plan.name === "Landing Page");
      if (landingPlan) {
        const promotion = "Contrata una Landing Page y recibe 25% de descuento en tu siguiente proyecto con ProgramStyle.";
        const hasPromotion = landingPlan.features.some((feature) =>
          /25%\s+de descuento/i.test(feature) && /(siguiente|pr[oó]ximo)\s+proyecto/i.test(feature)
        );
        if (!hasPromotion) landingPlan.features.push(promotion);
        content.services.packages = content.services.packages.filter((plan) => plan !== discountPlan);
      }
    }

    const maintenancePlan = DEFAULT_CONTENT.services.packages.find((plan) => plan.name === "Mantenimiento Web");
    if (!content.services.packages.some((plan) => plan.name === maintenancePlan.name)) {
      content.services.packages.push(clone(maintenancePlan));
    }

    return content;
  }

  function get() {
    return clone(currentContent || DEFAULT_CONTENT);
  }

  async function load() {
    try {
      if (useVercelApi) {
        const data = await invokeFunction("site-content", { method: "GET" });
        if (data?.content) currentContent = migrate(data.content);
      } else {
        if (supabaseConfigError || !supabase) throw supabaseConfigError;
        const { data, error } = await supabase
          .from("site_content")
          .select("content")
          .eq("id", 1)
          .maybeSingle();
        if (error) throw error;
        if (data?.content) currentContent = migrate(data.content);
      }
      loadError = null;
    } catch (error) {
      loadError = error;
      console.error("No se pudo cargar el contenido compartido de ProgramStyle:", error);
    }
    return get();
  }

  async function save(content) {
    if (useVercelApi) {
      await invokeFunction("site-content", { method: "PUT", body: { content } });
      currentContent = migrate(content);
      loadError = null;
      return get();
    }

    if (supabaseConfigError || !supabase) throw supabaseConfigError;
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Inicia sesión como administrador para guardar los cambios.");
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: 1, content, updated_by: user.id }, { onConflict: "id" });
    if (error) throw error;
    currentContent = migrate(content);
    loadError = null;
    return get();
  }

  function defaults() {
    return clone(DEFAULT_CONTENT);
  }

  window.ProgramStyleContent = { get, load, save, defaults, getLoadError: () => loadError };
})();

export const ProgramStyleContent = window.ProgramStyleContent;
