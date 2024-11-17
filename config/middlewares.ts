export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'script-src': [
            "'self'",
            'unsafe-inline',
            'https://maps.googleapis.com'
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
            'https://maps.gstatic.com',
            'https://maps.googleapis.com',
            'khmdb0.google.com',
            'khmdb0.googleapis.com',
            'khmdb1.google.com',
            'khmdb1.googleapis.com',
            'khm.google.com',
            'khm.googleapis.com',
            'khm0.google.com',
            'khm0.googleapis.com',
            'khm1.google.com',
            'khm1.googleapis.com',
            'khms0.google.com',
            'khms0.googleapis.com',
            'khms1.google.com',
            'khms1.googleapis.com',
            'khms2.google.com',
            'khms2.googleapis.com',
            'khms3.google.com',
            'khms3.googleapis.com',
            'streetviewpixels-pa.googleapis.com',
            'market-assets.strapi.io'
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
            'https://maps.gstatic.com',
            'https://maps.googleapis.com'
          ],
          'upgradeInsecureRequests': null
        }
      }
    }
  },
  'strapi::poweredBy',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:1337',
        'https://hamsatech-eg.com',
        'https://www.hamsatech-eg.com',
        'http://hamsatech-eg.com',
        'http://www.hamsatech-eg.com'
      ]
    }
  },
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public'
];
