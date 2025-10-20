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

      beforeUpdate: async ({ result }) => {
        console.log('result');
        console.log(JSON.stringify(result));
        // console.log('state');

        if (!result?.where?.id) {
          console.warn(
            'error result.where.id @beforeUpdate update-prices-and-stock  was not found'
          );
          return;
        }
        // console.log(JSON.stringify(state));
        // Get the existing entry from the database before updating
        const existingEntry = await strapi.entityService.findOne(
          'api::update-prices-and-stock.update-prices-and-stock',
          result.where.id,
          {
            populate: ['xlsx_file_to_upload']
          }
        );

        // console.log('existingEntry');
        // console.log(JSON.stringify(existingEntry));

        // Check if the file is changing
        if (
          existingEntry &&
          result.data.xlsx_file_to_upload &&
          existingEntry.xlsx_file_to_upload?.id !==
            result.data.xlsx_file_to_upload
        ) {
          // If a new file is uploaded, reset the processed field
          result.data.processed = 'not started';

          console.warn(
            'result processed updated successfully',
            result.data.processed
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
          min_stock,
          excel_header_for_item_name,
          excel_header_for_edara_item_code,
          excel_header_to_update_product_price,
          excel_header_to_update_product_sale_price,
          excel_header_to_update_product_stock,
          enable_min_stock,
          enable_max_stock,
          extra_price_addition_by_percentage,
          extra_sale_price_addition_by_percentage,
          migrate_datasheet_to_new_datasheet,
          extra_price_addition_by_value,
          min_price_to_apply_extra_price_addition_by_value,
          extra_sale_price_addition_by_value,
          min_sale_price_to_apply_extra_sale_price_addition_by_value
        } = pricesAndStockConfigEntry;

        if (migrate_datasheet_to_new_datasheet) {
          await migrateDatasheetToNewDatasheet({ strapi });
        }
        console.log('min_stock', min_stock);
        console.log('enable_min_stock', enable_min_stock);
        console.log(
          'extra_price_addition_by_value',
          extra_price_addition_by_value
        );
        console.log(
          'min_price_to_apply_extra_price_addition_by_value',
          min_price_to_apply_extra_price_addition_by_value
        );
        console.log(
          'extra_sale_price_addition_by_value',
          extra_sale_price_addition_by_value
        );
        console.log(
          'min_sale_price_to_apply_extra_sale_price_addition_by_value',
          min_sale_price_to_apply_extra_sale_price_addition_by_value
        );

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
        // console.log('��� Processing products...', products);
        // console.log('ℹ️ Published products...', publishedProducts);
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
            // fileFinalPrice,
            fileTotalStock
          } = extractRowData(
            row,
            headers,
            enable_max_stock,
            max_stock,
            enable_min_stock,
            min_stock
          );

          const salePriceEnabled = headers?.salePriceName
            ? true
            : false;

          // Check if any of the row columns is missing a value
          if (
            !fileEdaraItemCode ||
            typeof filePrice !== 'number' ||
            typeof fileTotalStock !== 'number' ||
            // typeof fileFinalPrice !== 'number' ||
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

          // console.log('✅ Product found in system:', product);

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
              filePriceChecked =
                filePrice + updateExtraPriceAdditionPercentageAmount;
            } else {
              filePriceChecked = filePrice;
            }

            if (
              extra_price_addition_by_value > 0 &&
              filePrice >=
                min_price_to_apply_extra_price_addition_by_value
            ) {
              filePriceChecked =
                filePriceChecked + extra_price_addition_by_value;
            }

            // ✅ Round up to nearest 5
            filePriceChecked = Math.ceil(filePriceChecked / 5) * 5;
          } else {
            filePriceChecked = 0;
          }
          console.log(
            'filePrice, extra_price_addition_by_value',
            filePrice,
            extra_price_addition_by_value
          );
          console.log(
            'filePriceChecked after extra value addition',
            filePriceChecked
          );

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
              fileSalePriceChecked =
                fileSalePrice +
                updateExtraSalePriceAdditionPercentageAmount;
            } else {
              fileSalePriceChecked = fileSalePrice;
            }

            if (
              extra_sale_price_addition_by_value > 0 &&
              fileSalePrice >=
                min_sale_price_to_apply_extra_sale_price_addition_by_value
            ) {
              fileSalePriceChecked =
                fileSalePriceChecked +
                extra_sale_price_addition_by_value;
            }

            // ✅ Round up to nearest 5
            fileSalePriceChecked =
              Math.ceil(fileSalePriceChecked / 5) * 5;
          } else {
            fileSalePriceChecked = 0;
          }

          console.log(
            'fileSalePrice, extra_sale_price_addition_by_value',
            fileSalePrice,
            extra_sale_price_addition_by_value
          );
          console.log(
            'fileSalePriceChecked after extra value addition',
            fileSalePriceChecked
          );

          const fileTotalStockChecked =
            fileTotalStock > 0 ? fileTotalStock : 0;

          const fileFinalPrice = calculateFinalPrice(
            filePriceChecked,
            fileSalePriceChecked
          );

          // console.log('Final Price Calculation:', fileFinalPrice);

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
            prevFinalPrice,
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

          console.log(
            `${prevPrice}` !== `${filePriceChecked}` ||
              `${prevStock}` !== `${fileTotalStockChecked}` ||
              `${prevFinalPrice}` !== `${fileFinalPrice}` ||
              `${prevSalePrice}` !== `${fileSalePriceChecked}`
          );
          console.log('Comparing values for price:', {
            prevPrice,
            filePriceChecked,
            isChanged: `${prevPrice}` !== `${filePriceChecked}`
          });
          console.log('Comparing values for stock:', {
            prevStock,
            fileTotalStockChecked,
            isChanged: `${prevStock}` !== `${fileTotalStockChecked}`
          });
          console.log('Comparing values for sale price:', {
            prevSalePrice,
            fileSalePriceChecked,
            isChanged:
              `${prevSalePrice}` !== `${fileSalePriceChecked}`
          });
          console.log('Comparing values for final price:', {
            prevFinalPrice,
            fileFinalPrice,
            isChanged: `${prevFinalPrice}` !== `${fileFinalPrice}`
          });

          if (
            `${prevPrice}` !== `${filePriceChecked}` ||
            `${prevStock}` !== `${fileTotalStockChecked}` ||
            `${prevFinalPrice}` !== `${fileFinalPrice}` ||
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
        try {
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
        } catch (error) {
          console.warn(error);
        }
      },
      beforeUpdate: async ({
        // result,
        params: { data, where }
      }) => {
        console.log('Before update event triggered');
        const ctx = strapi.requestContext.get();
        const ctxBody = ctx?.request?.body ?? null;

        if (!where.id) return;

        const product = await strapi.entityService.findOne(
          'api::product.product',
          where.id,
          {
            populate: {
              reviews: {
                populate: ['rating'] // Populate relevant fields
              },
              localizations: {
                populate: ['id', 'locale']
              }
            }
          }
        );

        if (
          typeof data?.price !== 'number' ||
          typeof data?.sale_price !== 'number'
        ) {
          console.log('Invalid price or sale_price:', {
            price: data?.price,
            sale_price: data?.sale_price
          });
          return;
        }
        // Calculate final price
        const finalPrice = calculateFinalPrice(
          data.price,
          data.sale_price
        );

        const averageReviews = calculateAverageReviews(
          product?.reviews ?? []
        );
        const totalReviews = calculateTotalReviews(
          product?.reviews ?? []
        );

        const shippingConfig = await strapi.entityService.findMany(
          'api::shipping-config.shipping-config',
          {
            populate: {
              default_package_weight: true,
              default_package_dimensions: {
                populate: [
                  'width_in_cm',
                  'height_in_cm',
                  'length_in_cm'
                ]
              },
              default_shipping_company: {
                populate: {
                  weight: {
                    populate: [
                      'volumetric_weight_applied_if_needed',
                      'volumetric_weight_applied_if_needed_in_grams'
                    ]
                  }
                }
              }
            }
          }
        );

        const finalPackageWeight = calculateFinalPackageWeight({
          productWidth:
            ctxBody?.package_dimensions?.width_in_cm ?? null,
          productHeight:
            ctxBody?.package_dimensions?.height_in_cm ?? null,
          productLength:
            ctxBody?.package_dimensions?.length_in_cm ?? null,
          productWeight: ctxBody?.package_weight_in_grams ?? null,
          volumetricDivisor:
            shippingConfig?.default_shipping_company?.weight
              ?.volumetric_weight_applied_if_needed_in_grams ?? null,
          applyVolumetricInput:
            shippingConfig?.default_shipping_company?.weight
              ?.volumetric_weight_applied_if_needed ?? null,
          defaultPackageWidth:
            shippingConfig?.default_package_dimensions?.width_in_cm ??
            null,
          defaultPackageHeight:
            shippingConfig?.default_package_dimensions
              ?.height_in_cm ?? null,
          defaultPackageLength:
            shippingConfig?.default_package_dimensions
              ?.length_in_cm ?? null,
          defaultPackageWeight:
            shippingConfig?.default_package_weight ?? null
        });

        console.warn('finalPackageWeight', finalPackageWeight);

        // Update the product with final_product_price only if it differs
        // Update the product with totla_reviews only if it differs
        // Update the product with average_reviews only if it differs
        // Update the product with final_package_weight_in_grams only if it differs
        if (
          finalPrice !== product.final_product_price ||
          totalReviews !== product.total_reviews ||
          averageReviews !== product.average_reviews ||
          finalPackageWeight !== product.final_package_weight_in_grams
        ) {
          data.final_product_price = finalPrice;
          data.average_reviews = averageReviews;
          data.total_reviews = totalReviews;
          data.final_package_weight_in_grams = finalPackageWeight;
        }

        const strapiProductIds = {
          arId: null,
          enId: null
        };

        if (product?.locale === 'ar' && product?.id) {
          strapiProductIds.arId = product.id;
        }
        if (
          product?.localizations?.at(0)?.locale === 'en' &&
          product?.localizations?.at(0)?.id
        ) {
          strapiProductIds.enId = product.localizations[0].id;
        }

        if (product?.locale === 'en' && product?.id) {
          strapiProductIds.enId = product.id;
        }
        if (
          product?.localizations?.at(0)?.locale === 'ar' &&
          product?.localizations?.at(0)?.id
        ) {
          strapiProductIds.arId = product.id;
        }
        // console.log(JSON.stringify(strapiProductIds));
        // console.log(typeof strapiProductIds.arId);

        // Update the frontend
        const frontendURL = process.env.FRONTEND_URL;
        const frontendToken = process.env.FRONTEND_API_TOKEN;

        console.log(`${frontendURL}/api/products/${product.id}`);

        // try {
        const frontendResponse = await fetch(
          `${frontendURL}/api/products/${product.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${frontendToken}`
            },
            body: JSON.stringify(strapiProductIds)
          }
        );
        // console.log('response', response);

        const frontendResponseData =
          (await frontendResponse.json()) as {
            data: { message: string };
            error: string;
          };
        if (!frontendResponse.ok) {
          console.warn(
            frontendResponseData?.error || 'Request failed'
          );
          return;
        }
        // console.log(data);

        if (
          frontendResponseData?.data?.message ===
          `Product paths has been updated successfully`
        ) {
          console.log(
            `Product paths {arId: ${strapiProductIds.arId}, enId: ${strapiProductIds.enId}} has been updated successfully`
          );
        }

        // try {
        const rawCarts = await strapi.entityService.findMany(
          'api::cart.cart',
          {
            filters: {
              product_details: {
                $or: [
                  { product: strapiProductIds?.arId ?? 0 },
                  { product: strapiProductIds?.enId ?? 0 }
                ]
              }
            },
            populate: {
              product_details: {
                populate: ['product'] // 👈 populate the product inside the component
              }
            }
          }
        );

        // const data = response.json();
        const filteredCarts: {
          id: number;
          total_cart_cost: number;
          product_details: {
            quantity: number;
            total_cost: number;
            description: string;
            product: number;
            final_product_price: number;
            productStock: number;
          }[];
        }[] = rawCarts
          .map(
            (cart: {
              id: number | null;
              total_cart_cost: number | null;
              product_details: {
                quantity: number | null;
                total_cost: number | null;
                description: string | null;
                product: {
                  id: number | null;
                  final_product_price: number | null;
                  stock: number | null;
                };
              }[];
            }) => ({
              id: cart?.id ?? null,
              total_cart_cost: cart?.total_cart_cost ?? 0,
              product_details: cart.product_details.map((detail) => ({
                quantity: detail?.quantity ?? 0,
                total_cost: detail?.total_cost ?? 0,
                description: detail?.description ?? null,
                product: detail?.product?.id ?? null,
                final_product_price:
                  (detail?.product?.id &&
                    detail?.product?.id === strapiProductIds?.arId) ||
                  (detail?.product?.id &&
                    detail?.product?.id === strapiProductIds?.enId)
                    ? (finalPrice as number | null | undefined) ?? 0
                    : detail?.product?.final_product_price ?? 0,
                productStock:
                  (detail?.product?.id &&
                    detail?.product?.id === strapiProductIds?.arId) ||
                  (detail?.product?.id &&
                    detail?.product?.id === strapiProductIds?.enId)
                    ? (data?.stock as number | null | undefined) ?? 0
                    : (detail?.product?.stock as
                        | number
                        | null
                        | undefined) ?? 0
              }))
            })
          )
          .filter(
            (cart: {
              id: number | null;
              total_cart_cost: number;
              product_details: {
                quantity: number;
                total_cost: number;
                description: string | null;
                product: number | null;
                final_product_price: number;
                productStock: number;
              }[];
            }) => {
              if (
                cart?.id !== null &&
                cart?.total_cart_cost !== null
              ) {
                return true;
              } else {
                false;
              }
            }
          );

        // console.log(JSON.stringify(filteredCarts));

        const updatedCarts =
          filteredCarts.length > 0
            ? filteredCarts.map((cart) => {
                if (cart?.product_details.length > 0) {
                  const filteredProductsDetails =
                    cart.product_details.filter((productDetail) => {
                      return productDetail.productStock > 0
                        ? true
                        : false;
                    });
                  const totalCartCost =
                    filteredProductsDetails.reduce(
                      (acc, productDetail) => {
                        productDetail.quantity =
                          productDetail.quantity <=
                          productDetail.productStock
                            ? productDetail.quantity
                            : productDetail.productStock;

                        // console.log(productDetail.quantity);

                        productDetail.total_cost =
                          productDetail.quantity *
                          productDetail.final_product_price;

                        return (acc += productDetail.total_cost);
                      },
                      0
                    );
                  // console.log(totalCartCost);
                  cart.total_cart_cost = totalCartCost;

                  return {
                    id: cart.id,
                    total_cart_cost: cart.total_cart_cost,
                    product_details:
                      filteredProductsDetails.length > 0
                        ? filteredProductsDetails.map(
                            (productDetail) => ({
                              quantity: productDetail.quantity,
                              total_cost: productDetail.total_cost,
                              description: productDetail.description,
                              product: productDetail.product
                            })
                          )
                        : []
                    // quantity:
                    //   cart?.product_details.quantity ?? null,
                    // total_cost: cart.total_cost,
                    // description: detail?.description ?? null,
                    // product: detail?.product?.id ?? null
                    // final_product_price: finalPrice
                  };
                } else {
                  return {
                    id: cart.id,
                    total_cart_cost: 0,
                    product_details: []
                  };
                }
              })
            : null;

        // console.log(JSON.stringify(updatedCarts));
        // console.log('updatedCarts', updatedCarts);

        if (updatedCarts && updatedCarts.length > 0) {
          const responseResult = await Promise.all(
            updatedCarts.map((cart) =>
              strapi.entityService.update('api::cart.cart', cart.id, {
                data: {
                  product_details: cart.product_details,
                  total_cart_cost: cart.total_cart_cost
                }
              })
            )
          );
          // console.log(responseResult);
        }

        // console.log('data', data);
        // return data;
      }

      // // After updating a product
      // afterUpdate: async ({ result }) => {
      //   // try {
      //   console.log('After update event triggered result:', result);
      //   // console.log('After update event triggered');
      //   // } catch (error) {
      //   //   console.warn(error);
      //   // }
      // }
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
    strapi.db.lifecycles.subscribe({
      models: ['api::order.order'],

      // After creating a new order
      afterCreate: async ({ result, params: { data } }) => {
        try {
          console.log(
            'After order create event triggered result:',
            result
          );
          console.log(
            'After order create event triggered data:',
            data
          );

          if (!result?.id) {
            console.warn('id was not found for the new order.');
          }

          const orderCustomFieldsPopulated =
            await strapi.entityService.findOne(
              'api::order.order',
              result.id,
              {
                populate: {
                  cart: {
                    populate: ['product'] // Populate relevant fields
                  }
                }
              }
            );

          console.log(JSON.stringify(orderCustomFieldsPopulated));
          const cart = orderCustomFieldsPopulated?.cart ?? null;

          if (!Array.isArray(cart) || cart.length === 0) {
            console.warn(
              'No products was found in the new order, and no update was made'
            );
            return;
          }

          console.log('cart:', JSON.stringify(cart));
          const products = cart
            .map((cartItem) => {
              return typeof cartItem?.product?.id === 'number' &&
                cartItem.quantity > 0 &&
                cartItem?.product?.stock > 0 &&
                cartItem?.product?.stock >= cartItem.quantity
                ? {
                    id: cartItem.product.id,
                    newQuantity:
                      cartItem.product.stock - cartItem.quantity
                  }
                : null;
            })
            .filter((cartItem) => cartItem !== null);
          console.log('products:', JSON.stringify(products));

          if (!Array.isArray(products) || products.length === 0) {
            console.warn(
              'No products was found in the new order, and no update was made'
            );
            return;
          }

          for (const product of products) {
            const response = await strapi.entityService.update(
              'api::product.product',
              product.id,
              {
                data: { stock: product.newQuantity }
              }
            );

            console.log(response);
          }
        } catch (error) {
          console.warn(error);
        }
      }
    });
    strapi.db.lifecycles.subscribe({
      models: ['api::shipping-company.shipping-company'],
      // beforeUpdate: async ({
      //   // result,
      //   params: { data, where }
      // }) => {
      //   console.log(
      //     'Before update event triggered for shipping company'
      //   );
      //   const ctx = strapi.requestContext.get();
      //   const ctxBody = ctx?.request?.body ?? null;

      //   console.log('ctxBody', ctxBody);
      //   console.log('where', where);
      //   console.log('data', data);

      //   if (!where?.id) {
      //     return;
      //   }
      //   if (
      //     !Array.isArray(ctxBody?.delivery_zones) ||
      //     ctxBody.delivery_zones.length === 0
      //   ) {
      //     return;
      //   }

      //   // const deliveryZonesIds = data?.delivery_zones
      //   //   .map((zone) => zone?.id ?? null)
      //   //   .filter((id) => id);

      //   const cashOnDeliveryCost =
      //     ctxBody?.include_cash_on_delivery_in_total_shipping_cost
      //       ? ctxBody?.cash_on_delivery_cost ?? 0
      //       : 0;

      //   console.log(
      //     'ctxBody.delivery_zones Before',
      //     ctxBody.delivery_zones
      //   );

      //   const updatedDeliveryZones = ctxBody.delivery_zones.map(
      //     (zone, i) => {
      //       const deliveryCost = zone?.delivery_cost ?? 0;
      //       const vatCost = zone?.VAT ?? 0;
      //       const zoneCost =
      //         (vatCost / 100) * deliveryCost + deliveryCost;

      //       console.log('zone', zone);
      //       return {
      //         id: zone.id ?? i + 1,
      //         // __temp_key__: zone.__temp_key__,
      //         delivery_cost: zone.delivery_cost,
      //         minimum_delivery_duration_in_days:
      //           zone.minimum_delivery_duration_in_days,
      //         maximum_delivery_duration_in_days:
      //           zone.maximum_delivery_duration_in_days,
      //         VAT: zone.VAT,
      //         zone_name_in_arabic: zone.zone_name_in_arabic,
      //         zone_name_in_english: zone.zone_name_in_english,
      //         calculated_delivery_cost:
      //           Math.round((zoneCost + cashOnDeliveryCost) * 100) /
      //           100
      //       };
      //     }
      //   );

      //   data.delivery_zones = [...updatedDeliveryZones];

      //   console.log('updatedDeliveryZones', updatedDeliveryZones);
      //   console.log('data.delivery_zones', data.delivery_zones);

      //   //CtxBody

      //   // {
      //   //   id: 1,
      //   //   createdAt: '2025-05-08T14:54:43.350Z',
      //   //   updatedAt: '2025-05-14T16:46:10.804Z',
      //   //   publishedAt: '2025-05-08T16:07:16.842Z',
      //   //   cash_on_delivery_cost: 0,
      //   //   include_cash_on_delivery_in_total_shipping_cost: false,
      //   //   shipping_company_name: 'ABS',
      //   //   delivery_zones: [
      //   //     {
      //   //       id: 6,
      //   //       delivery_cost: 80,
      //   //       minimum_delivery_duration_in_days: 3,
      //   //       maximum_delivery_duration_in_days: 5,
      //   //       VAT: 0,
      //   //       zone_name_in_arabic: 'القاهرة',
      //   //       zone_name_in_english: 'Cairo',
      //   //       calculated_delivery_cost: null,
      //   //       __temp_key__: 0
      //   //     },
      //   //     {
      //   //       id: 7,
      //   //       delivery_cost: 50,
      //   //       minimum_delivery_duration_in_days: 4,
      //   //       maximum_delivery_duration_in_days: 6,
      //   //       VAT: 0,
      //   //       zone_name_in_arabic: 'سوهاج',
      //   //       zone_name_in_english: 'Sohag',
      //   //       calculated_delivery_cost: null,
      //   //       __temp_key__: 1
      //   //     }
      //   //   ],
      //   //   bank_fees_for_each_transfer: [
      //   //     {
      //   //       id: 13,
      //   //       include_the_fee_in_total_shipping_cost: true,
      //   //       minimum_total_order_price_to_apply_fee: 2000,
      //   //       fixed_fee_amount: 15,
      //   //       percentage_based_fee: 0,
      //   //       comment: 'مصاريف بنكيه لكل تحويله',
      //   //       money_increment_for_fixed_fee: 0,
      //   //       VAT: 0,
      //   //       __temp_key__: 0
      //   //     }
      //   //   ],
      //   //   extra_shipping_company_fees_for_cash_on_delivery: [
      //   //     {
      //   //       id: 14,
      //   //       include_the_fee_in_total_shipping_cost: true,
      //   //       minimum_total_order_price_to_apply_fee: 2000,
      //   //       fixed_fee_amount: 10,
      //   //       percentage_based_fee: 0,
      //   //       comment: 'الاسعار شامله التوصيل والتحصيل وضريبه البريد وضريبه القيمه المضافه لحد 2000ج لو المبلغ اكثر بيتم اضافه 10 جنيه علي كل 1000ج زياده',
      //   //       money_increment_for_fixed_fee: 1000,
      //   //       VAT: 0,
      //   //       __temp_key__: 0
      //   //     }
      //   //   ],
      //   //   pickup: {
      //   //     id: 7,
      //   //     pickup_cost: 50,
      //   //     pickup_start_time: '12:00:00',
      //   //     pickup_end_time: '14:00:00',
      //   //     include_pickup_cost_in_shipping_total_cost: false,
      //   //     __temp_key__: 0
      //   //   },
      //   //   flyers: {
      //   //     id: 7,
      //   //     include_flyer_cost_in_total_shipping_cost: true,
      //   //     total_flyers_free_every_month: 100,
      //   //     average_cost_per_flyer: 5,
      //   //     __temp_key__: 0
      //   //   },
      //   //   weight: {
      //   //     id: 7,
      //   //     enable_maximum_weight_for_standard_shipping_in_grams: true,
      //   //     maximum_weight_for_standard_shipping_in_grams: 1000,
      //   //     volumetric_weight_applied_if_needed: true,
      //   //     volumetric_weight_applied_if_needed_in_grams: 5000,
      //   //     fixed_fee_amount_for_exceeding_weight: 5,
      //   //     weight_increment_for_fixed_fee_in_grams: 1000,
      //   //     __temp_key__: 0
      //   //   },
      //   //   other_compnay_fees: [
      //   //     {
      //   //       include_the_fee_in_total_shipping_cost: false,
      //   //       minimum_total_order_price_to_apply_fee: 0,
      //   //       fixed_fee_amount: 0,
      //   //       percentage_based_fee: 0,
      //   //       money_increment_for_fixed_fee: 0,
      //   //       VAT: 0,
      //   //       __temp_key__: 0
      //   //     }
      //   //   ]
      //   // }
      // }
      // beforeUpdate: async ({ result, params }) => {
      //   console.log(
      //     'Before update event triggered for shipping company'
      //   );
      //   const { where, data } = params;
      //   const ctx = strapi.requestContext.get();
      //   const ctxBody = ctx?.request?.body ?? null;

      //   console.log('params', JSON.stringify(params));
      //   console.log('result', result);
      //   console.log('ctxBody', ctxBody);
      //   console.log('where', where);
      //   console.log('data', data);

      //   if (!where?.id) {
      //     return;
      //   }
      //   if (
      //     !Array.isArray(ctxBody?.delivery_zones) ||
      //     ctxBody.delivery_zones.length === 0
      //   ) {
      //     return;
      //   }

      //   // const deliveryZonesIds = data?.delivery_zones
      //   //   .map((zone) => zone?.id ?? null)
      //   //   .filter((id) => id);

      //   const cashOnDeliveryCost =
      //     ctxBody?.include_cash_on_delivery_in_total_shipping_cost
      //       ? ctxBody?.cash_on_delivery_cost ?? 0
      //       : 0;

      // console.log(
      //   'ctxBody.delivery_zones Before',
      //   ctxBody.delivery_zones
      // );

      // const updatedDeliveryZones = ctxBody.delivery_zones.map(
      //   (zone, i) => {
      //     const deliveryCost = zone?.delivery_cost ?? 0;
      //     const vatCost = zone?.VAT ?? 0;
      //     const zoneCost =
      //       (vatCost / 100) * deliveryCost + deliveryCost;

      //     console.log('zone', zone);
      //     return {
      //       id: zone.id ?? i + 1,
      //       // __temp_key__: zone.__temp_key__,
      //       delivery_cost: zone.delivery_cost,
      //       minimum_delivery_duration_in_days:
      //         zone.minimum_delivery_duration_in_days,
      //       maximum_delivery_duration_in_days:
      //         zone.maximum_delivery_duration_in_days,
      //       VAT: zone.VAT,
      //       zone_name_in_arabic: zone.zone_name_in_arabic,
      //       zone_name_in_english: zone.zone_name_in_english,
      //       calculated_delivery_cost:
      //         Math.round((zoneCost + cashOnDeliveryCost) * 100) /
      //         100
      //     };
      //   }
      // );

      // data.delivery_zones = [...updatedDeliveryZones];

      // console.log('updatedDeliveryZones', updatedDeliveryZones);
      // console.log('data.delivery_zones', data.delivery_zones);

      //CtxBody

      // {
      //   id: 1,
      //   createdAt: '2025-05-08T14:54:43.350Z',
      //   updatedAt: '2025-05-14T16:46:10.804Z',
      //   publishedAt: '2025-05-08T16:07:16.842Z',
      //   cash_on_delivery_cost: 0,
      //   include_cash_on_delivery_in_total_shipping_cost: false,
      //   shipping_company_name: 'ABS',
      //   delivery_zones: [
      //     {
      //       id: 6,
      //       delivery_cost: 80,
      //       minimum_delivery_duration_in_days: 3,
      //       maximum_delivery_duration_in_days: 5,
      //       VAT: 0,
      //       zone_name_in_arabic: 'القاهرة',
      //       zone_name_in_english: 'Cairo',
      //       calculated_delivery_cost: null,
      //       __temp_key__: 0
      //     },
      //     {
      //       id: 7,
      //       delivery_cost: 50,
      //       minimum_delivery_duration_in_days: 4,
      //       maximum_delivery_duration_in_days: 6,
      //       VAT: 0,
      //       zone_name_in_arabic: 'سوهاج',
      //       zone_name_in_english: 'Sohag',
      //       calculated_delivery_cost: null,
      //       __temp_key__: 1
      //     }
      //   ],
      //   bank_fees_for_each_transfer: [
      //     {
      //       id: 13,
      //       include_the_fee_in_total_shipping_cost: true,
      //       minimum_total_order_price_to_apply_fee: 2000,
      //       fixed_fee_amount: 15,
      //       percentage_based_fee: 0,
      //       comment: 'مصاريف بنكيه لكل تحويله',
      //       money_increment_for_fixed_fee: 0,
      //       VAT: 0,
      //       __temp_key__: 0
      //     }
      //   ],
      //   extra_shipping_company_fees_for_cash_on_delivery: [
      //     {
      //       id: 14,
      //       include_the_fee_in_total_shipping_cost: true,
      //       minimum_total_order_price_to_apply_fee: 2000,
      //       fixed_fee_amount: 10,
      //       percentage_based_fee: 0,
      //       comment: 'الاسعار شامله التوصيل والتحصيل وضريبه البريد وضريبه القيمه المضافه لحد 2000ج لو المبلغ اكثر بيتم اضافه 10 جنيه علي كل 1000ج زياده',
      //       money_increment_for_fixed_fee: 1000,
      //       VAT: 0,
      //       __temp_key__: 0
      //     }
      //   ],
      //   pickup: {
      //     id: 7,
      //     pickup_cost: 50,
      //     pickup_start_time: '12:00:00',
      //     pickup_end_time: '14:00:00',
      //     include_pickup_cost_in_shipping_total_cost: false,
      //     __temp_key__: 0
      //   },
      //   flyers: {
      //     id: 7,
      //     include_flyer_cost_in_total_shipping_cost: true,
      //     total_flyers_free_every_month: 100,
      //     average_cost_per_flyer: 5,
      //     __temp_key__: 0
      //   },
      //   weight: {
      //     id: 7,
      //     enable_maximum_weight_for_standard_shipping_in_grams: true,
      //     maximum_weight_for_standard_shipping_in_grams: 1000,
      //     volumetric_weight_applied_if_needed: true,
      //     volumetric_weight_applied_if_needed_in_grams: 5000,
      //     fixed_fee_amount_for_exceeding_weight: 5,
      //     weight_increment_for_fixed_fee_in_grams: 1000,
      //     __temp_key__: 0
      //   },
      //   other_compnay_fees: [
      //     {
      //       include_the_fee_in_total_shipping_cost: false,
      //       minimum_total_order_price_to_apply_fee: 0,
      //       fixed_fee_amount: 0,
      //       percentage_based_fee: 0,
      //       money_increment_for_fixed_fee: 0,
      //       VAT: 0,
      //       __temp_key__: 0
      //     }
      //   ]
      // }
      // }
      afterUpdate: async ({ result }) => {
        const shippingCompanyId = result.id;

        const includeCashOnDelivery =
          result?.include_cash_on_delivery_in_total_shipping_cost ??
          false;
        const cashOnDeliveryCost = includeCashOnDelivery
          ? result?.cash_on_delivery_cost || 0
          : 0;

        const includePickupCost =
          result?.pickup
            ?.include_pickup_cost_in_shipping_total_cost ?? false;
        const pickupCost = includePickupCost
          ? result?.pickup?.pickup_cost || 0
          : 0;

        // const includeFlyersCost =
        //   result?.flyers?.include_flyer_cost_in_total_shipping_cost ??
        //   false;
        // const flyerCost = includeFlyersCost
        //   ? result?.flyers.average_cost_per_flyer || 0
        //   : 0;

        // console.log('result', result);

        if (
          !Array.isArray(result.delivery_zones) ||
          !result?.delivery_zones ||
          result.delivery_zones.length === 0 ||
          !result.id
        ) {
          console.warn(
            'error result.delivery_zones or result.id @afterUpdate shipping_company was not found'
          );
          return;
        }

        // const updatedZones = await Promise.all(
        const calculatedUpdatedZones = result.delivery_zones.map(
          (zone) => {
            const deliveryCost = zone.delivery_cost || 0;
            const vat = zone.VAT || 0;
            const baseCost =
              deliveryCost + (vat / 100) * deliveryCost;
            const calculatedDeliveryCost =
              Math.round(
                (baseCost + cashOnDeliveryCost + pickupCost) * 100
              ) / 100;

            // Update the individual component (delivery zone)
            return {
              ...zone,
              calculated_delivery_cost: calculatedDeliveryCost
            };
          }
        );
        // );
        console.log('calculatedUpdatedZones', calculatedUpdatedZones);

        const updatedZones = await strapi.entityService.update(
          'api::shipping-company.shipping-company', // Replace with correct UID if needed
          result.id,
          {
            data: {
              delivery_zones: [...calculatedUpdatedZones]
            }
          }
        );

        console.log('updatedZones', updatedZones);

        console.log(
          `Updated delivery_zones with calculated_delivery_cost for shipping company #${shippingCompanyId}`
        );
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
      // console.log(price, salePrice);
      if (typeof price !== 'number') return 0;

      if (typeof salePrice !== 'number' || salePrice === 0) {
        return price; // If sale price is not defined or invalid, use price
      }

      if (salePrice > price) {
        console.warn('Sale price should be less than price.');
        console.warn(
          `price: ${price}, sale_price: ${salePrice} and final_product_price: error.`
        );
        // return 0;
        throw new Error('Sale price should be less than price.');
      }
      return salePrice; // Use sale price if valid
    }

    function calculateFinalPackageWeight({
      productWidth,
      productHeight,
      productLength,
      productWeight,
      volumetricDivisor,
      applyVolumetricInput,
      defaultPackageWidth,
      defaultPackageHeight,
      defaultPackageLength,
      defaultPackageWeight
    }: {
      productWidth: number | null;
      productHeight: number | null;
      productLength: number | null;
      productWeight: number | null;
      volumetricDivisor: number | null;
      applyVolumetricInput: boolean | null;
      defaultPackageWidth: number | null;
      defaultPackageHeight: number | null;
      defaultPackageLength: number | null;
      defaultPackageWeight: number | null;
    }) {
      const productHasValidWeight =
        typeof productWeight === 'number' && productWeight > 0;
      const hasValidVolumetricDivisor =
        typeof volumetricDivisor === 'number' &&
        volumetricDivisor > 0;
      const applyVolumetric = applyVolumetricInput === true;

      const productHasValidDimensions =
        typeof productWidth === 'number' &&
        productWidth > 0 &&
        typeof productHeight === 'number' &&
        productHeight > 0 &&
        typeof productLength === 'number' &&
        productLength > 0;

      const defaultPackageHasValidDimensions =
        typeof defaultPackageWidth === 'number' &&
        defaultPackageWidth > 0 &&
        typeof defaultPackageHeight === 'number' &&
        defaultPackageHeight > 0 &&
        typeof defaultPackageLength === 'number' &&
        defaultPackageLength > 0;
      const defaultPackageHasValidWeight =
        typeof defaultPackageWeight === 'number' &&
        defaultPackageWeight > 0;

      // console.log(
      //   JSON.stringify({
      //     productWidth,
      //     productHeight,
      //     productLength,
      //     productWeight,
      //     volumetricDivisor,
      //     applyVolumetricInput,
      //     defaultPackageWidth,
      //     defaultPackageHeight,
      //     defaultPackageLength,
      //     defaultPackageWeight
      //   })
      // );

      // console.log('======= Start =======');
      // console.log('productHasValidWeight', productHasValidWeight);
      // console.log(
      //   'hasValidVolumetricDivisor',
      //   hasValidVolumetricDivisor
      // );
      // console.log('applyVolumetric', applyVolumetric);
      // console.log(
      //   'productHasValidDimensions',
      //   productHasValidDimensions
      // );
      // console.log('productHasValidWeight', productHasValidWeight);
      // console.log(
      //   'defaultPackageHasValidDimensions',
      //   defaultPackageHasValidDimensions
      // );
      // console.log(
      //   'defaultPackageHasValidWeight',
      //   defaultPackageHasValidWeight
      // );
      // console.log('======= End =======');

      if (
        applyVolumetric &&
        productHasValidDimensions &&
        hasValidVolumetricDivisor
      ) {
        const volume = productWidth * productHeight * productLength;
        const volumetricWeight = volume / volumetricDivisor;
        const volumetricWeightInGramsTemp = volumetricWeight * 1000;
        const volumetricWeightInGrams = Number(
          volumetricWeightInGramsTemp.toFixed(0)
        );

        console.log(
          'volumetricWeightInGrams',
          volumetricWeightInGrams
        );

        if (productHasValidWeight) {
          const finalWeightGrams = Math.max(
            volumetricWeightInGrams,
            productWeight
          );
          return finalWeightGrams; // grams
        }

        if (defaultPackageHasValidWeight) {
          const finalWeightGrams = Math.max(
            volumetricWeightInGrams,
            defaultPackageWeight
          );
          return finalWeightGrams; // grams
        }
        return 0; // grams
      }

      if (
        applyVolumetric &&
        defaultPackageHasValidDimensions &&
        hasValidVolumetricDivisor
      ) {
        const volume =
          defaultPackageWidth *
          defaultPackageHeight *
          defaultPackageLength;
        const defaultVolumetricWeight = volume / volumetricDivisor;
        const defaultVolumetricWeightInGramsTemp =
          defaultVolumetricWeight * 1000;
        const defaultVolumetricWeightInGrams = Number(
          defaultVolumetricWeightInGramsTemp.toFixed(0)
        );

        if (productHasValidWeight) {
          const finalWeightGrams = Math.max(
            defaultVolumetricWeightInGrams,
            productWeight
          );
          return finalWeightGrams; // grams
        }

        if (defaultPackageHasValidWeight) {
          const finalWeightGrams = Math.max(
            defaultVolumetricWeightInGrams,
            defaultPackageWeight
          );
          return finalWeightGrams; // grams
        }
        return 0; // grams
      }

      if (productHasValidWeight) {
        return productWeight; // grams
      }

      if (defaultPackageHasValidWeight) {
        return defaultPackageHasValidWeight; // grams
      }

      return 0;
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
    function extractRowData(
      row,
      headers,
      enableMaxStock,
      maxStock,
      enableMinStock,
      minStock
    ) {
      const totalStock = row[headers.totalStockName];
      let fileTotalStock = null;

      if (typeof totalStock === 'number') {
        if (
          enableMinStock &&
          typeof minStock === 'number' &&
          totalStock < minStock
        ) {
          fileTotalStock = 0;
        } else if (
          enableMaxStock &&
          typeof maxStock === 'number' &&
          totalStock >= maxStock
        ) {
          fileTotalStock = maxStock;
        } else {
          fileTotalStock = totalStock;
        }
      }

      // console.log(
      //   'Final Price Calculation:',
      //   calculateFinalPrice(
      //     headers?.priceName ? row[headers.priceName] ?? null : null,
      //     headers?.salePriceName
      //       ? row[headers.salePriceName] ?? null
      //       : null
      //   )
      // );

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
        // fileFinalPrice: calculateFinalPrice(
        //   headers?.priceName ? row[headers.priceName] ?? null : null,
        //   headers?.salePriceName
        //     ? row[headers.salePriceName] ?? null
        //     : null
        // ),
        fileTotalStock
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
        productNameSystem: product?.name ?? '',
        prevFinalPrice: product?.final_product_price ?? null
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
        console.error(error);
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

    async function migrateDatasheetToNewDatasheet({ strapi }) {
      console.log('🚀 Starting datasheet migration...');

      // 1️⃣ Get all base (Arabic) products with their localizations
      const products = await strapi.entityService.findMany(
        'api::product.product',
        {
          populate: ['localizations', 'datasheet', 'new_datasheet'],
          filters: { locale: 'ar' }, // Only Arabic base entries
          limit: -1
        }
      );

      console.log(
        `🔍 Found ${products.length} Arabic base products to process.`
      );

      let updatedCount = 0;
      let skippedCount = 0;

      for (const product of products) {
        const datasheet = product.datasheet;
        const currentNewDatasheet = product.new_datasheet;

        if (!datasheet) {
          console.log(
            `⚠️ Skipping Product ID: ${product.id} (${product.name}) - No datasheet found.`
          );
          skippedCount++;
          continue;
        }

        if (currentNewDatasheet && currentNewDatasheet.datasheet) {
          console.log(
            `ℹ️ Skipping Product ID: ${product.id} (${product.name}) - Already migrated.`
          );
          skippedCount++;
          continue;
        }

        if (
          !product?.name ||
          !product?.modal_name ||
          !datasheet?.id
        ) {
          console.log(
            `⚠️ Skipping Product ID: ${product.id} (${product.name}) - Missing required fields.`
          );
          skippedCount++;
          continue;
        }

        console.log(
          `📦 Migrating Product ID: ${product.id} (${product.name})`
        );

        // 2️⃣ Arabic (default) datasheet
        const newDatasheetComponentAr = {
          title: product.name,
          applicable_model: product.modal_name,
          datasheet: { ...datasheet }
        };

        await strapi.entityService.update(
          'api::product.product',
          product.id,
          {
            data: { new_datasheet: newDatasheetComponentAr }
          }
        );

        // 3️⃣ English localized version
        if (product.localizations?.length) {
          const enLocalization = product.localizations.find(
            (loc) => loc.locale === 'en'
          );

          if (enLocalization) {
            // Get the English version’s full data to access its name & model
            const enProduct = await strapi.entityService.findOne(
              'api::product.product',
              enLocalization.id,
              { populate: ['datasheet', 'new_datasheet'] }
            );

            const enCurrentNewDatasheet = enProduct.new_datasheet;

            if (
              enCurrentNewDatasheet &&
              enCurrentNewDatasheet.datasheet
            ) {
              console.log(
                `ℹ️ Skipping Product ID: ${enLocalization.id} (${enProduct.name}) - Already migrated.`
              );
              skippedCount++;
              continue;
            }

            if (
              !enProduct?.name ||
              !enProduct?.modal_name ||
              !enLocalization.id
            ) {
              console.log(
                `⚠️ Skipping Product ID: ${enLocalization.id} (${enProduct.name}) - Missing required fields.`
              );
              skippedCount++;
              continue;
            }

            const newDatasheetComponentEn = {
              title: enProduct.name || product.name,
              applicable_model:
                enProduct.modal_name || product.modal_name,
              datasheet: { ...datasheet }
            };

            await strapi.entityService.update(
              'api::product.product',
              enLocalization.id,
              {
                data: { new_datasheet: newDatasheetComponentEn }
              }
            );

            console.log(
              `🌍 Updated English version for Product ID: ${product.id} (${enProduct.name})`
            );
          }
        }

        updatedCount++;
      }

      console.log(
        `✅ Migration completed: ${updatedCount} updated, ${skippedCount} skipped.`
      );
    }
  }
};
