import { ProgramStyleContent } from "./site-content.js";

const SITE_BASE_PATH = import.meta.env.BASE_URL;

ProgramStyleContent.load().then((content) => {
  const homeContent = content.home;

  document.getElementById("home-title").textContent = homeContent.title;
  document.getElementById("home-description").textContent = homeContent.description;
  document.getElementById("home-services-button").textContent = homeContent.servicesButton;
  document.getElementById("home-projects-label").textContent = homeContent.projectsLabel;
  document.getElementById("home-projects-title").textContent = homeContent.projectsTitle;
  document.getElementById("home-projects-description").textContent = homeContent.projectsDescription;

  const projectGrid = document.getElementById("home-project-grid");
  const getProjectUrl = (value) => {
    if (/^(?:https?:)?\/\//i.test(value)) return value;
    const relativePath = value.replace(/^(?:\.\.\/|\/)+/, "");
    return `${SITE_BASE_PATH}${relativePath}`;
  };
  const getProjectImageUrl = (value) => {
    if (/^(?:https?:)?\/\//i.test(value)) return value;
    const relativePath = value.replace(/^(?:\.\.\/|\/)*assets\//i, "");
    return `${SITE_BASE_PATH}${relativePath}`;
  };

  homeContent.projects.forEach((project) => {
    const card = document.createElement("a");
    card.href = getProjectUrl(project.url);
    card.target = "_blank";
    card.rel = "noreferrer";
    card.className = "project-card";

    const image = document.createElement("img");
    image.src = getProjectImageUrl(project.image);
    image.alt = project.alt;
    image.loading = "lazy";
    image.decoding = "async";

    const info = document.createElement("div");
    info.className = "project-info";

    const name = document.createElement("h3");
    name.textContent = project.name;

    const description = document.createElement("p");
    description.textContent = project.description;

    info.append(name, description);
    card.append(image, info);
    projectGrid.appendChild(card);
  });
  const contentStatus = document.getElementById("site-content-status");
  const loadError = ProgramStyleContent.getLoadError();
  if (loadError && contentStatus) {
    contentStatus.textContent = `No se pudo conectar con el contenido actualizado. Se muestran los datos predeterminados. ${loadError.message}`;
    contentStatus.classList.remove("hidden");
    contentStatus.classList.add("error");
  }
}).catch((error) => {
  console.error("No se pudo mostrar el contenido de Inicio:", error);
  const contentStatus = document.getElementById("site-content-status");
  if (contentStatus) {
    contentStatus.textContent = `No se pudo cargar Inicio: ${error.message}`;
    contentStatus.classList.remove("hidden");
    contentStatus.classList.add("error");
  }
});
