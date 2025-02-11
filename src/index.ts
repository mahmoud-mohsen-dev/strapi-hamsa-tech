import { stat } from 'fs';

const { sanitize } = require('@strapi/utils');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xlsx = require('xlsx');

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  // register(/*{ strapi }*/) {},
  register({ strapi }) {
    const graphqlExtensionService = strapi.service(
      'plugin::graphql.extension'
    );

    // Custom query to get a user's profile by validating the token
    graphqlExtensionService.use(({ strapi }) => ({
      typeDefs: `
        type Query {
          usersPermissionsUser(id: ID!): UsersPermissionsUserEntityResponse
        }
      `,
      resolvers: {
        Query: {
          usersPermissionsUser: {
            resolve: async (parent, { id }, context) => {
              try {
                const { toEntityResponse } = strapi.service(
                  'plugin::graphql.format'
                ).returnTypes;
                // Extract the authenticated user's ID from the context
                // console.log('context', JSON.stringify(context));
                // console.log('=================================');
                // console.log('id', JSON.stringify(id));
                // console.log(
                //   'parent.id',
                //   JSON.stringify(parent?.id ?? null)
                // );
                const userIdFromToken =
                  // context.state.user?.id ||
                  context?.state?.user?.id || null;
                // console.log('userIdFromToken', userIdFromToken);

                if (!userIdFromToken) {
                  throw new Error(
                    'Unauthorized: No user found in token.'
                  );
                }
                // console.log(
                //   !userIdFromToken ||
                //     !id ||
                //     `${userIdFromToken}` !== `${id}`
                // );
                // console.log(`${userIdFromToken}`);
                // console.log(`${id}`);

                // Check if the ID from the token matches the requested ID
                if (
                  !userIdFromToken ||
                  !id ||
                  `${userIdFromToken}` !== `${id}`
                ) {
                  console.error(
                    'Unauthorized - You can only access your own profile.'
                  );
                  throw new Error(
                    'Unauthorized - You can only access your own profile.'
                  );
                }

                // Fetch the user profile if the IDs match
                const user = await strapi.entityService.findOne(
                  'plugin::users-permissions.user',
                  id,
                  {
                    // populate: [
                    //   'avatar_photo',
                    //   'addresses',
                    //   'orders',
                    //   'cart',
                    //   'wishlist'
                    // ]
                    populate: ['*']
                  }
                );

                if (!user) {
                  throw new Error('User not found.');
                }
                // console.log('user', user);

                // Sanitize user data
                const sanitizedUser =
                  await sanitize.contentAPI.output(
                    user,
                    strapi.getModel('plugin::users-permissions.user')
                  );

                // console.log('sanitizedUser', sanitizedUser);

                const response = toEntityResponse(sanitizedUser);

                // console.log(
                //   '##################',
                //   JSON.stringify(response),
                //   '##################'
                // );

                return response;
              } catch (error) {
                console.error(`Error fetching user( `, error + ' )');
                throw new Error(error);
              }
            }
          }
        }
      }
    }));

    graphqlExtensionService.use(({ strapi }) => ({
      typeDefs: `
    type Mutation {
      updateUser(id: ID!, input: UpdateUserInput): UsersPermissionsUserEntityResponse
    }

    input UpdateUserInput {
      username: String
      email: String
      provider: String
      password: String
      resetPasswordToken: String
      confirmationToken: String
      confirmed: Boolean
      blocked: Boolean
      role: ID # Assuming you will pass the role ID for the update
      addresses: [ID] # Array of address IDs for the one-to-many relation
      orders: [ID] # Array of order IDs for the one-to-many relation
      cart: ID # ID for the related cart
      wishlist: ID # ID for the related wishlist
      reviews: [ID] # Array of review IDs for the one-to-many relation
      blog_comments: [ID] # Array of review IDs for the one-to-many relation
      blog_liked_comments: [ID] # Array of review IDs for the one-to-many relation
      avatar_photo: ID # ID for the media object (image)
      phone: String
      aggree_to_our_terms: Boolean
      subscribed_to_new_offers_and_newsletters: Boolean
      phone_country_code: String
      total_spending: String
      first_name: String
      last_name: String
      birth_date: String
    }
  `,
      resolvers: {
        Mutation: {
          updateUser: {
            resolve: async (parent, { id, input }, context) => {
              try {
                const userIdFromToken =
                  context?.state?.user?.id || null;
                const { toEntityResponse } = strapi.service(
                  'plugin::graphql.format'
                ).returnTypes;

                // Validate if the user is authorized to update
                if (
                  !userIdFromToken ||
                  `${userIdFromToken}` !== `${id}`
                ) {
                  throw new Error(
                    'Unauthorized: You can only update your own profile.'
                  );
                }

                // Update the user
                const updatedUser = await strapi.entityService.update(
                  'plugin::users-permissions.user',
                  id,
                  {
                    data: input,
                    // Populate any relations if needed
                    populate: ['*']
                  }
                );

                // Sanitize the output
                const sanitizedUser =
                  await sanitize.contentAPI.output(
                    updatedUser,
                    strapi.getModel('plugin::users-permissions.user')
                  );

                const response = toEntityResponse(sanitizedUser);

                // console.log(
                //   '##################',
                //   JSON.stringify(response),
                //   '##################'
                // );

                return response;
              } catch (error) {
                console.error(`Error updating user: ${error}`);
                throw new Error('Failed to update user.');
              }
            }
          }
        }
      }
    }));

    graphqlExtensionService.use(({ strapi }) => ({
      typeDefs: `
    type Mutation {
      deleteUser(id: ID!): Boolean
    }
  `,
      resolvers: {
        Mutation: {
          deleteUser: {
            resolve: async (parent, { id }, context) => {
              try {
                const userIdFromToken =
                  context?.state?.user?.id || null;
                // const { toEntityResponse } = strapi.service(
                //   'plugin::graphql.format'
                // ).returnTypes;

                // Validate if the user is authorized to delete
                if (
                  !userIdFromToken ||
                  `${userIdFromToken}` !== `${id}`
                ) {
                  throw new Error(
                    'Unauthorized: You can only delete your own profile.'
                  );
                }

                // Delete the user
                await strapi.entityService.delete(
                  'plugin::users-permissions.user',
                  id
                );

                return true; // Indicate success
              } catch (error) {
                console.error(`Error deleting user: ${error}`);
                throw new Error('Failed to delete user.');
              }
            }
          }
        }
      }
    }));

    // I didn't add update blog_comments, blog_liked_comments in UsersPermissionsMe
    const extensionService = strapi
      .plugin('graphql')
      .service('extension');
    extensionService.use(({ nexus }) => ({
      types: [
        nexus.extendType({
          type: 'UsersPermissionsMe',
          definition(t) {
            // Basic fields
            t.string('first_name');
            t.string('last_name');
            t.string('username');
            t.string('email');
            t.string('provider');
            t.boolean('confirmed');
            t.boolean('blocked');
            t.string('phone');
            t.boolean('aggree_to_our_terms');
            t.boolean('subscribed_to_new_offers_and_newsletters');
            t.string('phone_country_code');
            t.string('total_spending');
            t.date('birth_date');

            // Relations and media
            // t.field('avatar_photo', {
            //   type: 'UploadFile',
            //   resolve: (parent) => parent.avatar_photo // Direct reference if image is populated
            // });

            // Relations with custom resolvers
            t.list.field('addresses', {
              type: 'Address',
              resolve: async (parent) => {
                try {
                  return await strapi.entityService.findMany(
                    'api::address.address',
                    {
                      filters: { user: parent.id }
                    }
                  );
                } catch (error) {
                  console.error(
                    `Error fetching addresses for user ID: ${parent.id}`,
                    error
                  );
                  throw new Error('Failed to fetch addresses');
                }
              }
            });

            t.list.field('orders', {
              type: 'Order',
              resolve: async (parent) => {
                try {
                  const result = await strapi.entityService.findMany(
                    'api::order.order',
                    {
                      filters: { user: parent.id }
                    }
                  );
                  console.log('Orders', result);
                  return result;
                } catch (error) {
                  console.error(
                    `Error fetching orders for user ID: ${parent.id}`,
                    error
                  );
                  throw new Error('Failed to fetch orders');
                }
              }
            });

            t.field('cart', {
              type: 'Cart', // Specify the return type of your cart model
              resolve: async (parent) => {
                try {
                  // Fetch all carts associated with the user
                  const carts = await strapi.entityService.findMany(
                    'api::cart.cart',
                    {
                      filters: { users_permissions_user: parent.id } // Assuming 'users_permissions_user' is the relation field
                    }
                  );

                  // Get the first cart if exists
                  const cart = await strapi.entityService.findOne(
                    'api::cart.cart',
                    carts[0]?.id ?? null
                  );

                  if (!cart) {
                    console.warn(
                      `No cart found for user ID: ${parent.id}`
                    );
                    return null; // Handle the case where the cart does not exist
                  }
                  return cart; // Return the cart data if found
                } catch (error) {
                  console.error(
                    `Error fetching cart for user ID: ${parent.id}`,
                    error
                  );
                  throw new Error('Failed to fetch cart'); // Throw an error if fetching fails
                }
              }
            });

            t.field('wishlist', {
              type: 'Wishlist',
              resolve: async (parent) => {
                try {
                  const wishlists =
                    await strapi.entityService.findMany(
                      'api::wishlist.wishlist',
                      {
                        filters: { users_permissions_user: parent.id }
                      }
                    );

                  const wishlist = await strapi.entityService.findOne(
                    'api::wishlist.wishlist',
                    wishlists[0]?.id ?? null
                  );

                  if (!wishlist) {
                    console.warn(
                      `No wishlist found for user ID: ${parent.id}`
                    );
                    return null; // Handle the case where the wishlist does not exist
                  }
                  return wishlist; // Return the wishlist data if found
                } catch (error) {
                  console.error(
                    `Error fetching wishlist for user ID: ${parent.id}`,
                    error
                  );
                  throw new Error('Failed to fetch wishlist'); // Throw an error if fetching fails
                }
              }
            });

            t.list.field('reviews', {
              type: 'Review', // Replace with your actual Review type
              resolve: async (parent) => {
                try {
                  return await strapi.entityService.findMany(
                    'api::review.review',
                    {
                      filters: { users_permissions_user: parent.id }
                    }
                  );
                } catch (error) {
                  console.error(
                    `Error fetching reviews for user ID: ${parent.id}`,
                    error
                  );
                  throw new Error('Failed to fetch reviews');
                }
              }
            });
          }
        })
        // Add custom queries
        // nexus.extendType({
        //   type: 'Query',
        //   definition(t) {
        //     t.field('user', {
        //       type: 'UsersPermissionsUser',
        //       args: {
        //         id: nexus.nonNull(nexus.stringArg()) // Use nonNull helper for required args
        //       },
        //       resolve: async (_parent, { id }, { context }) => {
        //         try {
        //           console.log('Fetching user with ID:', id);
        //           const userFromToken =
        //             strapi.plugins[
        //               'users-permissions'
        //             ].services.jwt.getUser(context); // Get user from token
        //           console.log('_parent', _parent);
        //           console.log('id', id);
        //           console.log('userFromToken', userFromToken);
        //           console.log(userFromToken.id === id);

        //           // Check if the ID from the token matches the requested ID
        //           if (userFromToken.id !== id) {
        //             throw new Error('Unauthorized'); // If IDs do not match, throw an error
        //           }

        //           const user = await strapi.entityService.findOne(
        //             'plugin::users-permissions.user',
        //             {
        //               populate: [
        //                 'addresses',
        //                 'avatar_photo',
        //                 'orders'
        //               ]
        //             }
        //           );
        //           console.log('user', user);

        //           if (!user) {
        //             throw new Error('User not found');
        //           }

        //           return user; // Return the user data
        //         } catch (error) {
        //           console.error(`Error fetching user data`, error);
        //           throw new Error('Failed to fetch user');
        //         }
        //       }
        //     });
        //   }
        // })

        // // Add custom mutations
        // nexus.extendType({
        //   type: 'Mutation',
        //   definition(t) {
        //     t.field('updateUser', {
        //       type: 'UsersPermissionsUser',
        //       args: {
        //         id: nexus.stringArg({ required: true }), // Changed to stringArg
        //         input: nexus.arg({ type: 'UsersPermissionsUserInput', required: true }),
        //       },
        //       resolve: async (_, { id, input }) => {
        //         const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', id, {
        //           data: input,
        //         });
        //         if (updatedUser.id !== id) {
        //           throw new Error('Unauthorized');
        //         }
        //         if (!updatedUser) {
        //           throw new Error('User update failed');
        //         }
        //         return updatedUser;
        //       },
        //     });

        //     t.field('deleteUser', {
        //       type: 'UsersPermissionsUser',
        //       args: {
        //         id: nexus.stringArg({ required: true }), // Changed to stringArg
        //       },
        //       resolve: async (_, { id }) => {
        //         const deletedUser = await strapi.entityService.delete('plugin::users-permissions.user', id);
        //          if (deletedUser.id !== id) {
        //           throw new Error('Unauthorized');
        //         }
        //         if (!deletedUser) {
        //           throw new Error('User deletion failed');
        //         }
        //         return deletedUser;
        //       },
        //     });
        //   },
        // }),
      ]
    }));
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  // bootstrap(/*{ strapi }*/) {},
  async bootstrap({ strapi }) {
    // Subscribe to lifecycle events for the "Update Prices And Stock" collection
    strapi.db.lifecycles.subscribe({
      models: [
        'api::update-prices-and-stock.update-prices-and-stock'
      ],

      beforeUpdate: async ({ params }) => {
        // console.log('params');
        // console.log(JSON.stringify(params));
        // console.log('state');
        // console.log(JSON.stringify(state));
        // Get the existing entry from the database before updating
        const existingEntry = await strapi.entityService.findOne(
          'api::update-prices-and-stock.update-prices-and-stock',
          params.where.id,
          {
            populate: ['xlsx_file_to_upload']
          }
        );

        // console.log('existingEntry');
        // console.log(JSON.stringify(existingEntry));

        // Check if the file is changing
        if (
          existingEntry &&
          params.data.xlsx_file_to_upload &&
          existingEntry.xlsx_file_to_upload?.id !==
            params.data.xlsx_file_to_upload
        ) {
          // If a new file is uploaded, reset the processed field
          params.data.processed = 'not started';

          console.warn(
            'params processed updated successfully',
            params.data.processed
          );
        }
      },

      // After an XLSX file is uploaded and the entry is created or updated
      afterCreate: async ({ result }) => {
        await processUploadedFile(result);
      },
      afterUpdate: async ({ result }) => {
        await processUploadedFile(result);
      }
    });

    async function processUploadedFile(entry) {
      try {
        // console.log('*'.repeat(30));
        // console.log(entry);
        // console.log('*'.repeat(30));

        if (entry.processed === 'done') {
          console.log(
            '✅ File has already been processed. Skipping...'
          );
          return; // Exit early if already processed
        }

        if (entry.processed === 'error') {
          console.log('⚠️ Error has occured. Skipping...');
          return; // Exit early if already error happened
        }

        if (
          !entry?.xlsx_file_to_upload?.ext ||
          !entry?.xlsx_file_to_upload?.url
        ) {
          // console.log(entry);
          console.warn('⚠️ No file found in the entry.');
          throw new Error('⚠️ No file found in the entry.');
        }

        if (
          entry?.xlsx_file_to_upload?.ext &&
          entry?.xlsx_file_to_upload?.ext !== '.xlsx' &&
          entry?.xlsx_file_to_upload?.ext !== '.xls'
        ) {
          console.warn(
            '⚠️ File type should be .xlsx or .xls to be correctly processed.',
            entry?.xlsx_file_to_upload?.ext
          );
          throw new Error(
            '⚠️ File type should be .xlsx or .xls to be correctly processed.'
          );
        }

        const pricesAndStockConfigEntry =
          await strapi.entityService.findMany(
            'api::prices-and-stock-config.prices-and-stock-config'
          );

        const {
          max_stock,
          excel_header_for_item_name,
          excel_header_for_edara_item_code,
          excel_header_to_update_product_price,
          excel_header_to_update_product_sale_price,
          excel_header_to_update_product_stock,
          enable_max_stock,
          extra_price_addition_by_percentage,
          extra_sale_price_addition_by_percentage
        } = pricesAndStockConfigEntry;

        const headers = {
          itemName: excel_header_for_item_name ?? '',
          edaraItemCodeName: excel_header_for_edara_item_code ?? '',
          priceName: excel_header_to_update_product_price ?? '',
          salePriceName:
            excel_header_to_update_product_sale_price ?? '',
          totalStockName: excel_header_to_update_product_stock ?? ''
        };

        const fileUrl = entry.xlsx_file_to_upload.url;
        // console.log('📥 Downloading file from:', fileUrl);

        const tempFilePath = path.join(__dirname, 'temp.xlsx');
        //tempFilePath D:\Codes\Hamsa Tech\strapi-hamsa-tech\dist\src\temp.xlsx

        // Download file
        const response = await axios.get(fileUrl, {
          responseType: 'arraybuffer'
        });

        // Write the downloaded file to the local system
        fs.writeFileSync(tempFilePath, response.data);
        console.log('✅ File downloaded successfully.');

        // Read XLSX file
        const workbook = xlsx.readFile(tempFilePath);
        const sheet =
          xlsx.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]]
          ) || [];

        const filteredSheet = sheet.filter(
          (row) =>
            typeof row[headers.edaraItemCodeName] === 'string' ||
            typeof row[headers.edaraItemCodeName] === 'number'
        );

        let duplicateFileItemCodes = new Set();
        let duplicateSystemItemCodes = new Set();
        let duplicateFileLog = [];
        let duplicateSystemLog = [];

        // Step 1: Identify duplicate item codes in the file
        let itemFileCodeMap = new Map();
        filteredSheet.forEach((row) => {
          let itemCode = row[headers.edaraItemCodeName];
          if (!itemCode) return;

          if (itemFileCodeMap.has(itemCode)) {
            duplicateFileItemCodes.add(itemCode);
          } else {
            itemFileCodeMap.set(itemCode, row);
          }
        });

        console.log(
          `Found ${duplicateFileItemCodes.size} duplicate item codes in file.`
        );
        if (duplicateFileItemCodes.size > 0) {
          duplicateFileLog.push(
            `${[...duplicateFileItemCodes].join(', ')}`
          );
        }

        const products = await strapi.entityService.findMany(
          'api::product.product',
          {
            // filters: {
            //   publishedAt: { $notNull: true } // Only get published products
            // },
            populate: ['localizations']
          }
        );
        const publishedProducts = products.filter(
          (product) => product.publishedAt
        );
        console.log('��� Processing products...', products);
        console.log('ℹ️ Published products...', publishedProducts);
        //  canUpdate:
        //   product?.edara_can_change_price_and_stock_for_this_product ??
        //   false,
        // prevPrice: product?.price ?? null,
        // prevSalePrice: product?.sale_price ?? null,
        // prevStock: product?.stock ?? null,
        // productNameSystem: product.name ?? ''

        //  ��� Processing products... [
        //   {
        //     id: 642,
        //     name: 'CASH DRAWER/SEETHING',
        //     price: 1500,
        //     sale_price: 1300,
        //     average_reviews: 0,
        //     total_reviews: 0,
        //     description: 's',
        //     stock: 6,
        //     connectivity: null,
        //     modal_name: 'CASH DRAWER/SEETHING',
        //     long_description: [[Object]],
        //     spotlight_description: null,
        //     final_product_price: 1300,
        //     sort_by_order: null,
        //     edara_item_code: '3111',
        //     edara_can_change_price_and_stock_for_this_product: true,
        //     createdAt: '2025-02-02T16:13:25.623Z',
        //     updatedAt: '2025-02-10T18:02:24.808Z',
        //     publishedAt: '2025-02-10T16:56:38.980Z',
        //     locale: 'ar',
        //     localizations: [[Object]]
        //   },
        //   {
        //     id: 646,
        //     name: 'nxc0',
        //     price: 5000,
        //     sale_price: 100,
        //     average_reviews: 0,
        //     total_reviews: 0,
        //     description: 'mj',
        //     stock: 3,
        //     connectivity: null,
        //     modal_name: 'k',
        //     long_description: [[Object]],
        //     spotlight_description: null,
        //     final_product_price: 100,
        //     sort_by_order: null,
        //     edara_item_code: '10000',
        //     edara_can_change_price_and_stock_for_this_product: true,
        //     createdAt: '2025-02-03T17:00:21.459Z',
        //     updatedAt: '2025-02-03T17:00:36.441Z',
        //     publishedAt: '2025-02-03T17:00:36.430Z',
        //     locale: 'ar',
        //     localizations: []
        //   },
        //   {
        //     id: 644,
        //     name: 'SOLAR PANEL/EZVIZ/CS-CMT-SOLAR PANEL-E',
        //     price: 500,
        //     sale_price: 400,
        //     average_reviews: 0,
        //     total_reviews: 0,
        //     description: '1',
        //     stock: 6,
        //     connectivity: null,
        //     modal_name: '1',
        //     long_description: [[Object]],
        //     spotlight_description: null,
        //     final_product_price: 400,
        //     sort_by_order: null,
        //     edara_item_code: '3109',
        //     edara_can_change_price_and_stock_for_this_product: true,
        //     createdAt: '2025-02-02T16:14:54.749Z',
        //     updatedAt: '2025-02-10T18:02:37.584Z',
        //     publishedAt: '2025-02-02T16:14:59.520Z',
        //     locale: 'ar',
        //     localizations: [[Object]]
        //   }
        // ];

        // Step 3: Identify duplicate edara_item_code in the system
        let itemSystemCodeMap = new Map();
        products.forEach((product) => {
          let edaraItemCode = product.edara_item_code;
          if (!edaraItemCode) return;

          if (itemSystemCodeMap.has(edaraItemCode)) {
            duplicateSystemItemCodes.add(edaraItemCode);
          } else {
            itemSystemCodeMap.set(edaraItemCode, product);
          }
        });

        console.log(
          `Found ${duplicateSystemItemCodes.size} duplicate edara_item_codes in system.`
        );
        if (duplicateSystemItemCodes.size > 0) {
          duplicateSystemLog.push(
            `${[...duplicateSystemItemCodes].join(', ')}`
          );
        }

        let updateCounters = {
          updated: 0,
          unchanged: 0,
          notFoundInSystem: 0,
          updateDisabled: 0,
          notFoundInFile: 0,
          skipped: 0,
          errorWhileUpdating: 0,
          duplicateProductsInFile: duplicateFileItemCodes.size,
          duplicateProductsInSystem: duplicateSystemItemCodes.size,
          matched: 0
        };

        let updateStatus = [];

        for (const row of filteredSheet) {
          const {
            fileItemName,
            fileEdaraItemCode,
            filePrice,
            fileSalePrice,
            fileTotalStock
          } = extractRowData(
            row,
            headers,
            enable_max_stock,
            max_stock
          );

          const salePriceEnabled = headers?.salePriceName
            ? true
            : false;

          // Check if any of the row columns is missing a value
          if (
            !fileEdaraItemCode ||
            typeof filePrice !== 'number' ||
            typeof fileTotalStock !== 'number' ||
            (salePriceEnabled && typeof fileSalePrice !== 'number')
          ) {
            logSkippedEntry(
              updateStatus,
              row,
              fileEdaraItemCode,
              fileItemName
            );
            updateCounters.skipped++;
            continue;
          }

          const product = await findProductByItemCode(
            publishedProducts,
            fileEdaraItemCode
          );
          if (!product) {
            logNotFoundEntry(
              updateStatus,
              fileEdaraItemCode,
              fileItemName
            );
            updateCounters.notFoundInSystem++;
            continue;
          }

          updateCounters.matched++;

          if (duplicateFileItemCodes.has(fileEdaraItemCode)) {
            // updateCounters.duplicateProductsInFile++;
            continue;
          }

          if (duplicateSystemItemCodes.has(fileEdaraItemCode)) {
            // updateCounters.duplicateProductsInSystem++;
            continue;
          }

          // const filePriceChecked =
          //   filePrice > 0
          //     ? extra_price_addition_by_percentage > 0
          //       ? Math.round(
          //           // filePrice + extra_price_addition_by_percentage
          //           filePrice +
          //             (filePrice *
          //               extra_price_addition_by_percentage) /
          //               100
          //         )
          //       : Math.round(filePrice)
          //     : 0;

          let filePriceChecked = 0;

          if (filePrice > 0) {
            if (extra_price_addition_by_percentage > 0) {
              const updateExtraPriceAdditionPercentageAmount =
                (filePrice * extra_price_addition_by_percentage) /
                100;
              filePriceChecked = Math.round(
                filePrice + updateExtraPriceAdditionPercentageAmount
              );
            } else {
              filePriceChecked = Math.round(filePrice);
            }
          } else {
            filePriceChecked = 0;
          }

          // const fileSalePriceChecked =
          //   salePriceEnabled && typeof fileSalePrice === 'number'
          //     ? extra_sale_price_addition_by_percentage > 0
          //       ? Math.round(
          //           // fileSalePrice + extra_sale_price_addition
          //           (fileSalePrice *
          //             extra_sale_price_addition_by_percentage) /
          //             100
          //         )
          //       : Math.round(fileSalePrice)
          //     : 0;

          let fileSalePriceChecked = 0;

          if (salePriceEnabled && typeof fileSalePrice === 'number') {
            if (extra_sale_price_addition_by_percentage > 0) {
              const updateExtraSalePriceAdditionPercentageAmount =
                (fileSalePrice *
                  extra_sale_price_addition_by_percentage) /
                100;
              fileSalePriceChecked = Math.round(
                fileSalePrice +
                  updateExtraSalePriceAdditionPercentageAmount
              );
            } else {
              fileSalePriceChecked = Math.round(fileSalePrice);
            }
          } else {
            fileSalePriceChecked = 0;
          }

          const fileTotalStockChecked =
            fileTotalStock > 0 ? fileTotalStock : 0;

          // console.log('🔄 Processing:', {
          //   fileEdaraItemCode,
          //   filePriceChecked,
          //   fileSalePriceChecked,
          //   fileTotalStock
          // });

          const {
            canUpdate,
            prevPrice,
            prevSalePrice,
            prevStock,
            productNameSystem
          } = extractProductDetails(product);

          if (!canUpdate) {
            logUpdateDisabledEntry(
              updateStatus,
              fileEdaraItemCode,
              fileItemName,
              productNameSystem,
              prevPrice,
              prevSalePrice,
              prevStock
            );
            updateCounters.updateDisabled++;
            continue;
          }

          if (
            `${prevPrice}` !== `${filePriceChecked}` ||
            `${prevStock}` !== `${fileTotalStockChecked}` ||
            `${prevSalePrice}` !== `${fileSalePriceChecked}`
          ) {
            await updateProduct(
              // strapi,
              product,
              updateStatus,
              updateCounters,
              fileEdaraItemCode,
              fileItemName,
              productNameSystem,
              prevPrice,
              filePriceChecked,
              prevSalePrice,
              fileSalePriceChecked,
              prevStock,
              fileTotalStockChecked
            );
          } else {
            logUnchangedEntry(
              updateStatus,
              fileEdaraItemCode,
              fileItemName,
              productNameSystem,
              prevPrice,
              filePriceChecked,
              prevSalePrice,
              fileSalePriceChecked,
              prevStock,
              fileTotalStockChecked
            );
            updateCounters.unchanged++;
          }
        }

        const productsNotFoundInFile = findProductsNotInFile(
          publishedProducts,
          filteredSheet,
          headers.edaraItemCodeName
        );
        updateCounters.notFoundInFile = productsNotFoundInFile.length;

        updateStatus.map((statusObj, i) => (statusObj.index = i + 1));

        // console.log(JSON.stringify(updateCounters));

        const updateSummary = generateSummary(
          updateCounters,
          publishedProducts.length,
          filteredSheet.length,
          productsNotFoundInFile,
          filterProductsByStatusText(updateStatus, 'Update Disabled'),
          filterProductsByStatusText(
            updateStatus,
            'Error occurred during update (not updated)'
          ),
          filterProductsByStatusText(updateStatus, 'Skipped'),
          duplicateFileLog,
          duplicateSystemLog
        );

        // Generate and store the update status table
        const tableHTML = generateTable(updateStatus);
        await storeUpdateStatus(
          strapi,
          entry.id,
          updateStatus,
          updateSummary,
          tableHTML,
          'done'
        );

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);
        console.log('🗑️ Temporary file removed.');
      } catch (error) {
        console.error('❌ Error processing uploaded file:', error);

        await storeUpdateStatus(
          strapi,
          entry.id,
          null,
          [
            {
              '❌ Error has occured':
                error?.message ?? JSON.stringify(error)
            }
          ],
          null,
          'error'
        );
      }
    }

    // Subscribe to lifecycle events for the product model
    strapi.db.lifecycles.subscribe({
      // Only listen to events for the product model
      models: ['api::product.product'],

      // After creating a new product
      afterCreate: async ({ result }) => {
        console.log('After create event triggered:', result);

        // Calculate final price
        const finalPrice = calculateFinalPrice(
          result.price,
          result.sale_price
        );

        // Update the product with final_product_price only if it differs
        if (finalPrice !== result.final_product_price) {
          await strapi.entityService.update(
            'api::product.product',
            result.id,
            {
              data: { final_product_price: finalPrice }
            }
          );
          console.log(
            'Product created and final price set:',
            finalPrice
          );
        } else {
          console.log(
            'Final price is already set correctly:',
            finalPrice
          );
        }
      },

      // After updating a product
      afterUpdate: async ({ result }) => {
        console.log('After update event triggered:', result);

        // Calculate final price
        const finalPrice = calculateFinalPrice(
          result.price,
          result.sale_price
        );

        const productCustomFieldsPopulated =
          await strapi.entityService.findOne(
            'api::product.product',
            result.id,
            {
              populate: {
                reviews: {
                  populate: ['rating'] // Populate relevant fields
                }
              }
            }
          );

        console.log('product', productCustomFieldsPopulated);

        const averageReviews = calculateAverageReviews(
          productCustomFieldsPopulated?.reviews ?? []
        );
        console.log('Average reviews:', averageReviews);

        const totalReviews = calculateTotalReviews(
          productCustomFieldsPopulated?.reviews ?? []
        );
        console.log('Total reviews:', totalReviews);

        // Update the product with final_product_price only if it differs
        // Update the product with totla_reviews only if it differs
        // Update the product with average_reviews only if it differs
        if (
          finalPrice !== result.final_product_price ||
          totalReviews !== result.total_reviews ||
          averageReviews !== result.average_reviews
        ) {
          await strapi.entityService.update(
            'api::product.product',
            result.id,
            {
              data: {
                final_product_price: finalPrice,
                average_reviews: averageReviews,
                total_reviews: totalReviews
              }
            }
          );
          console.log(
            'Product updated and final price set:',
            finalPrice
          );
          console.log(
            'Product updated and total reviews set:',
            totalReviews
          );
          console.log(
            'Product updated and average reviews set:',
            averageReviews
          );
        } else {
          console.log(
            'Final price is already set correctly:',
            finalPrice
          );
          console.log(
            'Total reviews is already set correctly:',
            totalReviews
          );
          console.log(
            'Average reviews is already set correctly:',
            averageReviews
          );
        }
      }
    });

    let productsOfDeletedReview = null; // Temporary storage for associated products during deletion

    // Subscribe to lifecycle events for the review model
    strapi.db.lifecycles.subscribe({
      models: ['api::review.review'],

      // After a review is created
      afterCreate: async ({ result }) => {
        await handleReviewLifecycleEvent(result);
      },

      // After a review is updated
      afterUpdate: async ({ result }) => {
        await handleReviewLifecycleEvent(result);
      },

      beforeDelete: async (event) => {
        console.log(
          'beforeDelete Review ID: ',
          event?.params?.where?.id
        );
        const reviewCustomFieldsPopulated =
          await strapi.entityService.findOne(
            'api::review.review',
            event?.params?.where?.id ?? null,
            {
              populate: ['products']
            }
          );

        console.log(
          'Review event triggered:',
          reviewCustomFieldsPopulated
        );

        // Find associated products
        const associatedProducts =
          reviewCustomFieldsPopulated?.products ?? [];
        console.log('Associated Products: ', associatedProducts);

        const associatedProductsId = associatedProducts
          .map((product) => product?.id ?? null)
          .filter((id) => id);

        console.log('Associated products ID:', associatedProductsId);

        if (!associatedProductsId.length) {
          console.warn('Review has no associated products.');
          productsOfDeletedReview = null;
          return;
        }

        productsOfDeletedReview = [...associatedProductsId];
      },
      afterDelete: async () => {
        if (
          !productsOfDeletedReview ||
          productsOfDeletedReview.length === 0
        ) {
          console.warn('Deleted review had no associated products.');
          return;
        }
        console.log(
          'AfterDelete productsOfDeletedReview',
          productsOfDeletedReview
        );
        for (const productId of productsOfDeletedReview) {
          await updateProductReviews(productId);
        }

        productsOfDeletedReview = null;
      }
    });

    // Helper functions
    // Handle shared logic for lifecycle events
    async function handleReviewLifecycleEvent(review) {
      const reviewCustomFieldsPopulated =
        await strapi.entityService.findOne(
          'api::review.review',
          review.id,
          {
            populate: ['products']
          }
        );

      console.log(
        'Review event triggered:',
        reviewCustomFieldsPopulated
      );

      // Find associated products
      const associatedProducts =
        reviewCustomFieldsPopulated?.products ?? [];
      console.log('Associated Products: ', associatedProducts);

      const associatedProductsId = associatedProducts
        .map((product) => product?.id ?? null)
        .filter((id) => id);

      console.log('Associated products ID:', associatedProductsId);

      if (!associatedProductsId.length) {
        console.warn('Review has no associated products.');
        return;
      }

      for (const productId of associatedProductsId) {
        await updateProductReviews(productId);
      }
    }

    // Update product reviews
    async function updateProductReviews(productId) {
      const productWithReviews = await strapi.entityService.findOne(
        'api::product.product',
        productId,
        {
          populate: {
            reviews: {
              populate: ['rating']
            }
          }
        }
      );

      const reviews = productWithReviews?.reviews ?? [];
      const averageReviews = calculateAverageReviews(reviews);
      const totalReviews = calculateTotalReviews(reviews);

      if (
        totalReviews !== productWithReviews.total_reviews ||
        averageReviews !== productWithReviews.average_reviews
      ) {
        await strapi.entityService.update(
          'api::product.product',
          productId,
          {
            data: {
              average_reviews: averageReviews,
              total_reviews: totalReviews
            }
          }
        );

        console.log(`Product ID ${productId} updated`);
        console.log('Total reviews set:', totalReviews);
        console.log('Average reviews set:', averageReviews);
      } else {
        console.log(`Product ID ${productId} already up-to-date`);
        console.log('Total reviews:', totalReviews);
        console.log('Average reviews:', averageReviews);
      }
    }

    // Function to calculate the final price
    function calculateFinalPrice(price, salePrice) {
      if (!salePrice || salePrice === 0) {
        return price; // If sale price is not defined or invalid, use price
      }
      return salePrice; // Use sale price if valid
    }

    // Calculate average reviews
    function calculateAverageReviews(reviews) {
      if (!reviews.length) return 0;

      const filteredReviews = reviews.filter(
        (review) => review.rating >= 0 && review.hidden === false
      );

      const totalRating = filteredReviews.reduce(
        (sum, review) => sum + (review.rating ?? 0),
        0
      );

      const averageRating = parseFloat(
        (totalRating / filteredReviews.length).toFixed(2)
      );

      return isNaN(averageRating) ? 0 : averageRating;
    }

    // Calculate total reviews
    function calculateTotalReviews(reviews) {
      if (!reviews.length) return 0;

      return reviews.filter(
        (review) => review.rating >= 0 && review.hidden === false
      ).length;
    }

    function generateTable(updateStatus) {
      // Sort updateStatus alphabetically by the 'status' field
      updateStatus.sort((a, b) => a.status.localeCompare(b.status));
      // console.log(updateStatus);
      const headerPStyles = 'text-align: center;';
      const headerSpanStyles = 'color: #007bff;';

      // Create table header
      let tableHTML = `
      <table>
        <tbody>
          <tr>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Index</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Status</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Item Code</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Product Name (File)</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Product Name (System)</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Previous Price</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">New Price</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Previous Sale Price</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">New Sale Price</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">Previous Stock</span></p></td>
            <td><p style="${headerPStyles}"><span style="${headerSpanStyles}">New Stock</span></p></td>
          </tr>`;

      // Loop through the update_status data and generate table rows
      updateStatus.forEach((item) => {
        let statusColor = '';
        const colStyles = 'text-align: center;';

        if (item.status === 'Updated') {
          statusColor = 'color: #388e3c;';
        } else if (item.status === 'Not Found In System') {
          statusColor = 'color: #ff0000;';
        } else if (
          item.status === 'Error occurred during update (not updated)'
        ) {
          statusColor = 'color:#ff8000;';
        } else if (item.status === 'Skipped') {
          statusColor = 'color: #fbc02d;';
        } else if (item.status === 'Update Disabled') {
          statusColor = 'color: rgb(251, 45, 76);';
        } else if (item.status === 'Unchanged') {
          statusColor = 'color: #166fd4;';
        } else {
          statusColor = 'color: white;';
        }

        tableHTML += `
          <tr>
            <td><p style="${colStyles}"><span style="${statusColor}">${
          item.index || 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}"><span style="${statusColor}">${
          item.status || 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}">${
          item.edaraItemCode || 'N/A'
        }</p></td>
            <td><p style="${colStyles}">${
          item.productNameInTheFile || 'N/A'
        }</p></td>
            <td><p style="${colStyles}">${
          item.productNameInTheSystem || 'N/A'
        }</p></td>
            <td><p style="${colStyles}"><span style="color:#ff6a00;">${
          typeof item.previousPrice === 'number' &&
          item.previousPrice >= 0
            ? item.previousPrice
            : 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}"><span style="color:#3ec045;">${
          typeof item.newPrice === 'number' && item.newPrice >= 0
            ? item.newPrice
            : 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}"><span style="color:#ff6a00;">${
          typeof item.previousSalePrice === 'number' &&
          item.previousSalePrice >= 0
            ? item.previousSalePrice
            : 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}"><span style="color:#3ec045;">${
          typeof item.newSalePrice === 'number' &&
          item.newSalePrice >= 0
            ? item.newSalePrice
            : 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}"><span style="color:#ff6a00;">${
          typeof item.previousStock === 'number' &&
          item.previousStock >= 0
            ? item.previousStock
            : 'N/A'
        }</span></p></td>
            <td><p style="${colStyles}"><span style="color:#3ec045;">${
          typeof item.newStock === 'number' && item.newStock >= 0
            ? item.newStock
            : 'N/A'
        }</span></p></td>
          </tr>`;
      });

      tableHTML += `</tbody></table>`;

      return tableHTML;
    }

    /**
     * Extracts data from a row based on header mappings.
     */
    function extractRowData(row, headers, enableMaxStock, maxStock) {
      return {
        fileItemName: row[headers.itemName] ?? null,
        fileEdaraItemCode: row[headers.edaraItemCodeName] ?? null,
        filePrice:
          typeof row[headers.priceName] === 'number'
            ? row[headers.priceName]
            : null,
        fileSalePrice:
          typeof row[headers.salePriceName] === 'number'
            ? row[headers.salePriceName]
            : null,
        fileTotalStock:
          typeof row[headers.totalStockName] === 'number'
            ? enableMaxStock &&
              typeof maxStock === 'number' &&
              row[headers.totalStockName] >= maxStock
              ? maxStock
              : row[headers.totalStockName]
            : null
      };
    }

    /**
     * Finds a product by Edara Item Code.
     */
    async function findProductByItemCode(
      products,
      fileEdaraItemCode
    ) {
      // const product = await strapi.entityService.find(
      //   'api::product.product',
      //   {
      //     filters: { id: productId }
      //   }
      // );

      if (!products || products.length <= 0) {
        return null;
      }

      const product = products.find(
        (product) =>
          `${product.edara_item_code}` === `${fileEdaraItemCode}`
      );

      // console.log(product || null);

      // if (!products.length) {
      //   // console.log(
      //   //   `🚨 Product not found in system: ${edaraItemCode}`
      //   // );
      // }

      return product || null;
    }

    /**
     * Extracts relevant details from a product.
     */
    function extractProductDetails(product) {
      return {
        canUpdate:
          product?.edara_can_change_price_and_stock_for_this_product ??
          false,
        prevPrice: product?.price ?? null,
        prevSalePrice: product?.sale_price ?? null,
        prevStock: product?.stock ?? null,
        productNameSystem: product.name ?? ''
      };
    }

    /**
     * Updates a product's price and stock.
     */
    async function updateProduct(
      // strapi,
      productData,
      updateStatus,
      updateCounters,
      fileEdaraItemCode,
      fileItemName,
      productNameSystem,
      prevPrice,
      filePriceChecked,
      prevSalePrice,
      fileSalePriceChecked,
      prevStock,
      fileTotalStockChecked
    ) {
      try {
        // // Fetch the product with its localizations
        // const existingProduct = await strapi.entityService.findOne(
        //   'api::product.product',
        //   productId,
        //   {
        //     populate: ['localizations']
        //   }
        // );

        // console.log(JSON.stringify(productData));

        if (!productData) {
          throw new Error(
            `Product with ID ${productData.id} not found`
          );
        }

        // Data to update (stock, price, and sale_price)
        let updateData = {
          price: filePriceChecked,
          sale_price: fileSalePriceChecked,
          stock: fileTotalStockChecked
        };

        // Update the main product (default locale)
        await strapi.entityService.update(
          'api::product.product',
          productData.id,
          {
            data: updateData
          }
        );

        // Filter only published localizations
        if (
          productData.localizations &&
          productData.localizations.length > 0
        ) {
          for (const localeProduct of productData.localizations) {
            if (localeProduct.publishedAt) {
              // Only update if it's published
              await strapi.entityService.update(
                'api::product.product',
                localeProduct.id,
                {
                  data: updateData
                }
              );
            }
          }
        }
        // await strapi.entityService.update(
        //   'api::product.product',
        //   productId,
        //   {
        //     data: {
        //       price: filePriceChecked,
        //       sale_price: fileSalePriceChecked,
        //       stock: fileTotalStockChecked
        //     }
        //   }
        // );

        logUpdatedEntry(
          updateStatus,
          fileEdaraItemCode,
          fileItemName,
          productNameSystem,
          prevPrice,
          filePriceChecked,
          prevSalePrice,
          fileSalePriceChecked,
          prevStock,
          fileTotalStockChecked
        );
        updateCounters.updated++;
      } catch (error) {
        logErrorWhileUpdatingEntry(
          updateStatus,
          fileEdaraItemCode,
          fileItemName,
          productNameSystem,
          prevPrice,
          prevSalePrice,
          prevStock
        );
        updateCounters.errorWhileUpdating++;
      }
    }

    /**
     * Logs skipped entries.
     */
    function logSkippedEntry(
      updateStatus,
      row,
      edaraItemCode,
      itemName
    ) {
      console.warn('⚠️ Skipping row due to missing data:', row);
      updateStatus.push({
        status: 'Skipped',
        edaraItemCode: edaraItemCode ?? null,
        productNameInTheFile: itemName,
        productNameInTheSystem: null,
        previousPrice: null,
        newPrice: null,
        previousSalePrice: null,
        newSalePrice: null,
        previousStock: null,
        newStock: null
      });
    }

    /**
     * Error while updating entries.
     */
    function logErrorWhileUpdatingEntry(
      updateStatus,
      edaraItemCode,
      itemName,
      productNameSystem,
      prevPrice,
      prevSalePrice,
      prevStock
    ) {
      console.warn(
        `⚠️ Product was not updated in system: ${edaraItemCode}`
      );
      updateStatus.push({
        status: 'Error occurred during update (not updated)',
        edaraItemCode: edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice: null,
        previousSalePrice: prevSalePrice,
        newSalePrice: null,
        previousStock: prevStock,
        newStock: null
      });
    }

    /**
     * Logs entries where the product is not found in the system.
     */
    function logNotFoundEntry(updateStatus, edaraItemCode, itemName) {
      // console.warn(
      //   `⚠️ Product not found in system: ${edaraItemCode}`
      // );
      updateStatus.push({
        status: 'Not Found In System',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: null,
        previousPrice: null,
        newPrice: null,
        previousSalePrice: null,
        newSalePrice: null,
        previousStock: null,
        newStock: null
      });
    }

    /**
     * Logs entries where updating is disabled.
     */
    function logUpdateDisabledEntry(
      updateStatus,
      edaraItemCode,
      itemName,
      productNameSystem,
      prevPrice,
      prevSalePrice,
      prevStock
    ) {
      console.log(`🔒 Update disabled for product: ${edaraItemCode}`);
      updateStatus.push({
        status: 'Update Disabled',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice: prevPrice,
        previousSalePrice: prevSalePrice,
        newSalePrice: prevSalePrice,
        previousStock: prevStock,
        newStock: prevStock
      });
    }

    /**
     * Logs successfully updated entries.
     */
    function logUpdatedEntry(
      updateStatus,
      edaraItemCode,
      itemName,
      productNameSystem,
      prevPrice,
      newPrice,
      prevSalePrice,
      newSalePrice,
      prevStock,
      newStock
    ) {
      // console.log(
      //   `✅ Updated product ${productNameSystem}: Price = ${newPrice}, Sale Price: ${newSalePrice}, Stock = ${newStock}`
      // );
      updateStatus.push({
        status: 'Updated',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice,
        previousSalePrice: prevSalePrice,
        newSalePrice: newSalePrice,
        previousStock: prevStock,
        newStock
      });
    }

    /**
     * Logs unchanged products.
     */
    function logUnchangedEntry(
      updateStatus,
      edaraItemCode,
      itemName,
      productNameSystem,
      prevPrice,
      newPrice,
      prevSalePrice,
      newSalePrice,
      prevStock,
      newStock
    ) {
      console.log(
        `🟦 Unchanged product: ${edaraItemCode} (Price: ${prevPrice}, Stock: ${prevStock})`
      );
      updateStatus.push({
        status: 'Unchanged',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice,
        previousSalePrice: prevSalePrice,
        newSalePrice: newSalePrice,
        previousStock: prevStock,
        newStock
      });
    }

    function findProductsNotInFile(
      products,
      filteredSheet,
      edaraItemCodeName
    ) {
      return products
        .filter((product) => {
          // Check if the product exists in the filteredSheet array
          const foundProduct = filteredSheet.find(
            (item) =>
              `${item[edaraItemCodeName]}` ===
              `${product['edara_item_code']}`
          );
          return !foundProduct;
        })
        .map((filteredProduct) => {
          return {
            status: 'Not Found in File',
            edaraItemCode: filteredProduct['edara_item_code'] ?? null,
            productNameInTheSytem: filteredProduct?.name ?? null,
            price: filteredProduct?.price ?? null,
            stock: filteredProduct?.stock ?? null,
            salePrice: filteredProduct?.sale_price ?? null
          };
        });
    }

    function filterProductsByStatusText(updateStatus, statusText) {
      return updateStatus && updateStatus.length > 0
        ? updateStatus.filter((product) => {
            return product.status === statusText;
          })
        : null;
    }

    /**
     * Generates an update summary.
     */
    function generateSummary(
      updateCounters,
      totalProductsSystem,
      totalProductsInFile,
      productsNotFoundInFile,
      updateDisabledProductsInFile,
      errorOccuredWhileUpdatingProducts,
      SkippedProducts,
      duplicateFileLog,
      duplicateSystemLog
    ) {
      console.warn(`Duplicate Products In File:
            ${updateCounters.duplicateProductsInFile},
          'Duplicate Products In System':
            ${updateCounters.duplicateProductsInSystem}`);
      return [
        {
          '📊 Products in System (Published)': totalProductsSystem,
          '📂 Products in File': totalProductsInFile,
          '⚠️ Products in file not Found in System':
            updateCounters.notFoundInSystem, // 4
          '⚠️ Products in stystem not found in file':
            updateCounters.notFoundInFile, // 5
          '✅ Updated Products': updateCounters.updated, // 2
          '🔄 Unchanged Products': updateCounters.unchanged, // 1
          '🚫 Disabled Products (Not Updated)':
            updateCounters.updateDisabled, // 3
          '⏭️ Skipped Products in file': updateCounters.skipped, // 6
          '❌ Total of Failed products to be Updated':
            // updateCounters.errorWhileUpdating +
            // updateCounters.notFoundInFile,
            totalProductsSystem -
            (updateCounters.updated +
              updateCounters.unchanged +
              updateCounters.updateDisabled),
          '❌ Error happened While updating products (Not Updated)':
            updateCounters.errorWhileUpdating,
          '🗐 Duplicate Products In File':
            updateCounters.duplicateProductsInFile,
          '🗐 Duplicate Products In System (published + unpublished)':
            updateCounters.duplicateProductsInSystem,
          '🟰 Matched Products': updateCounters.matched
        },
        {
          '📉 Products in System Not Found in File':
            productsNotFoundInFile
        },
        {
          '⏭️ Skipped Products in file': SkippedProducts
        },
        {
          '🛑 Disabled Products in System (Not Updated)':
            updateDisabledProductsInFile
        },
        {
          '🚨 Error happened While updating products (Not Updated)':
            errorOccuredWhileUpdatingProducts
        },
        {
          'Duplicate item codes in file': duplicateFileLog
        },
        {
          'Duplicate edara_item_codes in system': duplicateSystemLog
        }
      ];
    }

    /**
     * Stores update status in Strapi.
     */
    async function storeUpdateStatus(
      strapi,
      entryId,
      updateStatus,
      updateSummary,
      tableHTML,
      processed
    ) {
      await strapi.entityService.update(
        'api::update-prices-and-stock.update-prices-and-stock',
        entryId,
        {
          data: {
            update_status: updateStatus,
            update_summary: updateSummary,
            update_status_table: tableHTML,
            processed
          }
        }
      );
    }
  }
};
