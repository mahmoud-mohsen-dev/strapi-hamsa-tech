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

        console.log('existingEntry');
        console.log(JSON.stringify(existingEntry));

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
        console.log('*'.repeat(30));
        console.log(entry);
        console.log('*'.repeat(30));

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
        console.log(
          entry?.xlsx_file_to_upload?.ext &&
            (entry?.xlsx_file_to_upload?.ext !== '.xlsx' ||
              entry?.xlsx_file_to_upload?.ext !== '.xls')
        );
        console.log(
          entry?.xlsx_file_to_upload?.ext &&
            entry?.xlsx_file_to_upload?.ext !== '.xlsx' &&
            entry?.xlsx_file_to_upload?.ext !== '.xls'
        );
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

        const headers = {
          itemName: 'Description',
          edaraItemCodeName: 'Item code',
          priceName: 'Sales price',
          totalStockName: 'Total'
        };

        const fileUrl = entry.xlsx_file_to_upload.url;
        console.log('📥 Downloading file from:', fileUrl);

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

        const products = await strapi.entityService.findMany(
          'api::product.product'
        );

        let updateCounters = {
          updated: 0,
          unchanged: 0,
          notFoundInSystem: 0,
          updateDisabled: 0,
          notFoundInFile: 0,
          skipped: 0
        };

        let updateStatus = [];

        for (const row of filteredSheet) {
          const {
            fileItemName,
            fileEdaraItemCode,
            filePrice,
            fileTotalStock
          } = extractRowData(row, headers);

          console.log('🔄 Processing:', {
            fileEdaraItemCode,
            filePrice,
            fileTotalStock
          });

          if (
            !fileEdaraItemCode ||
            filePrice === undefined ||
            fileTotalStock === undefined
          ) {
            logSkippedEntry(updateStatus, row, fileItemName);
            updateCounters.skipped++;
            continue;
          }

          const product = await findProductByItemCode(
            strapi,
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

          const {
            canUpdate,
            prevPrice,
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
              prevStock
            );
            updateCounters.updateDisabled++;
            continue;
          }

          if (
            `${prevPrice}` !== `${filePrice}` ||
            `${prevStock}` !== `${fileTotalStock}`
          ) {
            await updateProduct(
              strapi,
              product.id,
              filePrice,
              fileTotalStock
            );
            logUpdatedEntry(
              updateStatus,
              fileEdaraItemCode,
              fileItemName,
              productNameSystem,
              prevPrice,
              filePrice,
              prevStock,
              fileTotalStock
            );
            updateCounters.updated++;
          } else {
            logUnchangedEntry(
              updateStatus,
              fileEdaraItemCode,
              fileItemName,
              productNameSystem,
              prevPrice,
              filePrice,
              prevStock,
              fileTotalStock
            );
            updateCounters.unchanged++;
          }
        }

        const productsNotFoundInFile = findProductsNotInFile(
          products,
          updateStatus
        );
        updateCounters.notFoundInFile = productsNotFoundInFile.length;

        const updateSummary = generateSummary(
          updateCounters,
          products.length,
          filteredSheet.length,
          productsNotFoundInFile,
          findUpdateDisabledProductsInFile(updateStatus)
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

    // function generateTable(updateStatus) {
    //   const headerStyles = 'vertical-align:top; color:#166fd4;';
    //   // Create table header
    //   let tableHTML = `
    // <figure class="table" style="width:100%;">
    //   <table class="ck-table-resized" style="border-color:hsl(0, 0%, 100%);">
    //     <colgroup>
    //       <col style="width:10.88%;">
    //       <col style="width:8.87%;">
    //       <col style="width:15.06%;">
    //       <col style="width:14.4%;">
    //       <col style="width:12.53%;">
    //       <col style="width:13.62%;">
    //       <col style="width:12.15%;">
    //       <col style="width:12.49%;">
    //     </colgroup>
    //     <thead>
    //       <tr>
    //         <th style="${headerStyles}">Status</th>
    //         <th style="${headerStyles}">Item Code</th>
    //         <th style="${headerStyles}">Product Name (File)</th>
    //         <th style="${headerStyles}">Product Name (System)</th>
    //         <th style="${headerStyles}">Previous Price</th>
    //         <th style="${headerStyles}">New Price</th>
    //         <th style="${headerStyles}">Previous Stock</th>
    //         <th style="${headerStyles}">New Stock</th>
    //       </tr>
    //     </thead>
    //     <tbody>`;

    //   // Loop through the update_status data and generate table rows
    //   updateStatus.forEach((item) => {
    //     // Define the inline style based on the status
    //     let colStyle = 'vertical-align:top;';
    //     let statusTextColor = '';

    //     if (item.status === 'Updated') {
    //       statusTextColor = 'color: #388e3c;';
    //     } else if (item.status === 'Not Found In System') {
    //       statusTextColor = 'color: #d32f2f;';
    //     } else if (item.status === 'Skipped') {
    //       statusTextColor = 'color: #fbc02d;';
    //     } else if (item.status === 'Update Disabled') {
    //       statusTextColor = 'color:rgb(251, 45, 76);';
    //     } else if (item.status === 'Unchanged') {
    //       statusTextColor = 'color: #166fd4;';
    //     } else {
    //       statusTextColor = 'color: white;';
    //     }

    //     tableHTML += `
    //   <tr>
    //     <td style="${colStyle} ${statusTextColor}">${
    //       item.status || 'N/A'
    //     }</td>
    //     <td style="${colStyle}">${item.edaraItemCode || 'N/A'}</td>
    //     <td style="${colStyle}">${
    //       item.productNameInTheFile || 'N/A'
    //     }</td>
    //     <td style="${colStyle}">${
    //       item.productNameInTheSystem || 'N/A'
    //     }</td>
    //     <td style="${colStyle}">${item.previousPrice || 'N/A'}</td>
    //     <td style="${colStyle}">${item.newPrice || 'N/A'}</td>
    //     <td style="${colStyle}">${item.previousStock || 'N/A'}</td>
    //     <td style="${colStyle}">${item.newStock || 'N/A'}</td>
    //   </tr>`;
    //   });

    //   // Close table and figure tags
    //   tableHTML += `</tbody></table></figure>`;

    //   return tableHTML;
    // }
    // const generateTable = (rows, cols, data) => {
    //   return {
    //     type: 'table',
    //     content: Array.from({ length: rows }, (_, rowIndex) => ({
    //       type: 'tableRow',
    //       content: Array.from({ length: cols }, (_, colIndex) => ({
    //         type: 'tableCell',
    //         content: data?.[rowIndex]?.[colIndex]
    //           ? [
    //               {
    //                 type: 'paragraph',
    //                 content: [
    //                   { type: 'text', text: data[rowIndex][colIndex] }
    //                 ]
    //               }
    //             ]
    //           : [{ type: 'paragraph', content: [] }]
    //       }))
    //     }))
    //   };
    // };
    // const generateTable = (updateStatus) => {
    //   return {
    //     type: 'table',
    //     content: [
    //       {
    //         type: 'tableRow',
    //         content: [
    //           'Status',
    //           'Item Code',
    //           'Product Name (File)',
    //           'Product Name (System)',
    //           'Previous Price',
    //           'New Price',
    //           'Previous Stock',
    //           'New Stock'
    //         ].map((header) => ({
    //           type: 'tableHeader',
    //           content: [
    //             {
    //               type: 'paragraph',
    //               content: [{ type: 'text', text: header }]
    //             }
    //           ]
    //         }))
    //       },
    //       ...updateStatus.map((row) => ({
    //         type: 'tableRow',
    //         content: [
    //           row.status,
    //           row.edaraItemCode,
    //           row.productNameInTheFile,
    //           row.productNameInTheSystem,
    //           row.previousPrice,
    //           row.newPrice,
    //           row.previousStock,
    //           row.newStock
    //         ].map((cell) => ({
    //           type: 'tableCell',
    //           content: [
    //             {
    //               type: 'paragraph',
    //               content: [
    //                 {
    //                   type: 'text',
    //                   text: cell ? cell.toString() : ''
    //                 }
    //               ]
    //             }
    //           ]
    //         }))
    //       }))
    //     ]
    //   };
    // };
    function generateTable(updateStatus) {
      // Sort updateStatus alphabetically by the 'status' field
      updateStatus.sort((a, b) => a.status.localeCompare(b.status));
      console.log(updateStatus);
      const headerStyles = 'color: #007bff;text-align: center;';

      // Create table header
      let tableHTML = `
      <table>
        <tbody>
          <tr>
            <td><p><span style="${headerStyles}">Status</span></p></td>
            <td><p><span style="${headerStyles}">Item Code</span></p></td>
            <td><p><span style="${headerStyles}">Product Name (File)</span></p></td>
            <td><p><span style="${headerStyles}">Product Name (System)</span></p></td>
            <td><p><span style="${headerStyles}">Previous Price</span></p></td>
            <td><p><span style="${headerStyles}">New Price</span></p></td>
            <td><p><span style="${headerStyles}">Previous Stock</span></p></td>
            <td><p><span style="${headerStyles}">New Stock</span></p></td>
          </tr>`;

      // Loop through the update_status data and generate table rows
      updateStatus.forEach((item) => {
        let statusColor = '';
        const colStyles = 'text-align: center;';

        if (item.status === 'Updated') {
          statusColor = 'color: #388e3c;';
        } else if (item.status === 'Not Found In System') {
          statusColor = 'color: #ff0000;';
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
            <td><p style="${colStyles}">${
          item.previousPrice || 'N/A'
        }</p></td>
            <td><p style="${colStyles}">${
          item.newPrice || 'N/A'
        }</p></td>
            <td><p style="${colStyles}">${
          item.previousStock || 'N/A'
        }</p></td>
            <td><p style="${colStyles}">${
          item.newStock || 'N/A'
        }</p></td>
          </tr>`;
      });

      tableHTML += `</tbody></table>`;

      return tableHTML;
    }

    /**
     * Extracts data from a row based on header mappings.
     */
    function extractRowData(row, headers) {
      const maxStock =
        row[headers.totalStockName] >= 10
          ? 10
          : row[headers.totalStockName] ?? 0;
      return {
        fileItemName: row[headers.itemName] ?? null,
        fileEdaraItemCode: row[headers.edaraItemCodeName] ?? null,
        filePrice: row[headers.priceName] ?? 0,
        fileTotalStock: maxStock
      };
    }

    /**
     * Finds a product by Edara Item Code.
     */
    async function findProductByItemCode(strapi, edaraItemCode) {
      const products = await strapi.entityService.findMany(
        'api::product.product',
        {
          filters: { edara_item_code: edaraItemCode }
        }
      );
      return products[0] || null;
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
        prevStock: product?.stock ?? null,
        productNameSystem: product.name ?? ''
      };
    }

    /**
     * Updates a product's price and stock.
     */
    async function updateProduct(strapi, productId, price, stock) {
      await strapi.entityService.update(
        'api::product.product',
        productId,
        {
          data: { price, sale_price: 0, stock }
        }
      );
    }

    /**
     * Logs skipped entries.
     */
    function logSkippedEntry(updateStatus, row, itemName) {
      console.warn('⚠️ Skipping row due to missing data:', row);
      updateStatus.push({
        status: 'Skipped',
        edaraItemCode: null,
        productNameInTheFile: itemName,
        productNameInTheSystem: null,
        previousPrice: null,
        newPrice: null,
        previousStock: null,
        newStock: null
      });
    }

    /**
     * Logs entries where the product is not found in the system.
     */
    function logNotFoundEntry(updateStatus, edaraItemCode, itemName) {
      console.warn(
        `⚠️ Product not found in system: ${edaraItemCode}`
      );
      updateStatus.push({
        status: 'Not Found In System',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: null,
        previousPrice: null,
        newPrice: null,
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
      prevStock
    ) {
      updateStatus.push({
        status: 'Update Disabled',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice: prevPrice,
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
      prevStock,
      newStock
    ) {
      console.log(
        `✅ Updated product ${productNameSystem}: Price = ${newPrice}, Stock = ${newStock}`
      );
      updateStatus.push({
        status: 'Updated',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice,
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
      prevStock,
      newStock
    ) {
      updateStatus.push({
        status: 'Unchanged',
        edaraItemCode,
        productNameInTheFile: itemName,
        productNameInTheSystem: productNameSystem,
        previousPrice: prevPrice,
        newPrice,
        previousStock: prevStock,
        newStock
      });
    }

    function findProductsNotInFile(products, updateStatus) {
      return products
        .filter((product) => {
          // Check if the product exists in the updateStatus array
          const foundProduct = updateStatus.find(
            (item) =>
              `${item.edaraItemCode}` ===
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
            stock: filteredProduct?.stock ?? null
          };
        });
    }
    function findUpdateDisabledProductsInFile(updateStatus) {
      return updateStatus && updateStatus.length > 0
        ? updateStatus.filter((product) => {
            return product.status === 'Update Disabled';
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
      updateDisabledProductsInFile
    ) {
      return [
        {
          'Total system products': totalProductsSystem,
          'Total file products': totalProductsInFile,
          '⚠️ Total products in file not Found in System':
            updateCounters.notFoundInSystem,
          '⚠️ Total products in stystem not found in file':
            updateCounters.notFoundInFile,

          '✅ Updated': updateCounters.updated,
          'Unchanged products': updateCounters.unchanged,
          'Total number of disabled products to be updated':
            updateCounters.updateDisabled,
          'Total number of skipped products': updateCounters.skipped,
          'Total of failed to update products':
            updateCounters.skipped + updateCounters.notFoundInFile
        },
        {
          'All products in the system not found in the file':
            productsNotFoundInFile
        },
        {
          'All products in the system that is disabled to be updated':
            updateDisabledProductsInFile
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
