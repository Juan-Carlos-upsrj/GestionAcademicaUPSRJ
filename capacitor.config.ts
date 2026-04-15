const config = {
  appId: 'com.iaev.gestionacademica',
  appName: 'Gestion Academica IAEV',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email", "https://www.googleapis.com/auth/classroom.courses.readonly"],
      serverClientId: "767265465776-8niav477563870tl4ug3emv6lcb12fe1.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;