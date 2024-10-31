export default ({env}) => ({
    graphql: {
      config: {
        endpoint: '/graphql',
        shadowCRUD: true,
        playgroundAlways: false,
        depthLimit: 12,
        amountLimit: 100,
        apolloServer: {
          tracing: false,
        },
      },
    },          
    seo: {
      enabled: true,
    },
    upload: {
        config: {
          provider: 'cloudinary',
          providerOptions: {
            cloud_name: env('CLOUDINARY_NAME'),
            api_key: env('CLOUDINARY_KEY'),
            api_secret: env('CLOUDINARY_SECRET'),
          },
          actionOptions: {
            upload: {},
            delete: {},
          },
        },
      },
    email: {
      config: {
        provider: 'sendgrid',
        providerOptions: {
          apiKey: env('SENDGRID_API_KEY'),
        },
        settings: {
          defaultFrom: 'mahmoud.mohsen.developer@gmail.com',
          defaultReplyTo: 'mahmoud.mohsen.developer@gmail.com',
        },
      },
    },
    
});
