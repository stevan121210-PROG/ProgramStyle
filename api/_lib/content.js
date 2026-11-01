function updateContactEmail(content) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return content;
  const services = content.services;
  if (!services || typeof services !== "object" || Array.isArray(services)) return content;
  if (typeof services.email !== "string" || services.email.trim().toLowerCase() !== "stevan121210@gmail.com") {
    return content;
  }

  return {
    ...content,
    services: {
      ...services,
      email: "programstyle1212@gmail.com"
    }
  };
}

module.exports = { updateContactEmail };
