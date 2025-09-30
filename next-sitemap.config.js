/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://e-tianguis.com", // cambia por tu dominio
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ["/admin/*"], // opcional, rutas que no quieres indexar
};
