export default ({ env }) => ({
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 16,
      amountLimit: 100,
      apolloServer: {
        tracing: false
      }
    }
  },
  seo: {
    enabled: true
  },
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET')
      },
      actionOptions: {
        upload: {},
        delete: {}
      }
    }
  },
  email: {
    logger: {
      debug: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    },
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST'),
        port: env('SMTP_PORT', 587),
        secure: env('SMTP_SECURE', false),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD')
        }
      },
      settings: {
        defaultFrom: env('EMAIL_DEFAULT_FROM'),
        defaultReplyTo: env('EMAIL_DEFAULT_REPLY_TO')
      }
    }
  },
  meilisearch: {
    config: {
      host: env('MEILISEARCH_HOST'),
      apiKey: env('MEILI_MASTER_KEY'),
      product: {
        indexName: 'products',
        // entriesQuery: {
        //   locale: 'all'
        // },
        filterEntry({ entry }) {
          // console.log(entry);
          return entry.locale === `ar`;
        },
        transformEntry({ entry }) {
          console.log(JSON.stringify(entry));
          const transformedEntry = {
            id: entry.id,
            name: entry.name,
            description: entry.description,
            price: entry.price,
            sale_price: entry.sale_price,
            final_product_price: entry.final_product_price,
            // connectivity: entry.connectivity,
            // long_description: entry.long_description,
            // spotlight_description: entry.spotlight_description,
            modal_name: entry.modal_name,
            sub_category: entry.sub_category,
            image_thumbnail: entry.image_thumbnail,
            brand: entry.brand,
            // features: entry.features,
            // specification: entry.sepcification,
            tags: entry.tags,
            // seo: entry.seo,
            locale: entry.locale,
            localizations: entry.localizations
          };
          return transformedEntry;
        }
      }
    }
  },
  ckeditor5: {
    enabled: true
  }
});
