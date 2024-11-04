const { sanitize } = require('@strapi/utils');

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
                console.log('context', JSON.stringify(context));
                console.log('=================================');
                console.log('id', JSON.stringify(id));
                console.log(
                  'parent.id',
                  JSON.stringify(parent?.id ?? null)
                );
                const userIdFromToken =
                  // context.state.user?.id ||
                  context?.state?.user?.id || null;
                console.log('userIdFromToken', userIdFromToken);

                if (!userIdFromToken) {
                  throw new Error(
                    'Unauthorized: No user found in token.'
                  );
                }
                console.log(
                  !userIdFromToken ||
                    !id ||
                    `${userIdFromToken}` !== `${id}`
                );
                console.log(`${userIdFromToken}`);
                console.log(`${id}`);

                // Check if the ID from the token matches the requested ID
                if (
                  !userIdFromToken ||
                  !id ||
                  `${userIdFromToken}` !== `${id}`
                ) {
                  console.error(
                    'Unauthorized: You can only access your own profile.'
                  );
                  throw new Error(
                    'Unauthorized: You can only access your own profile.'
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
                console.log('user', user);

                // Sanitize user data
                const sanitizedUser =
                  await sanitize.contentAPI.output(
                    user,
                    strapi.getModel('plugin::users-permissions.user')
                  );

                console.log('sanitizedUser', sanitizedUser);

                const response = toEntityResponse(sanitizedUser);

                console.log(
                  '##################',
                  JSON.stringify(response),
                  '##################'
                );

                return response;
              } catch (error) {
                console.error(`Error fetching user( `, error + ' )');
                throw new Error(
                  'Failed to fetch user( ' + error + ' )'
                );
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
      avatar_photo: ID # ID for the media object (image)
      phone: String
      aggree_to_our_terms: Boolean
      subscribed_to_new_offers_and_newsletters: Boolean
      phone_country_code: String
      total_spending: String
      full_name: String
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

                console.log(
                  '##################',
                  JSON.stringify(response),
                  '##################'
                );

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

    const extensionService = strapi
      .plugin('graphql')
      .service('extension');
    extensionService.use(({ nexus }) => ({
      types: [
        nexus.extendType({
          type: 'UsersPermissionsMe',
          definition(t) {
            // Basic fields
            t.string('full_name');
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

            // Relations and media
            t.field('avatar_photo', {
              type: 'UploadFile',
              resolve: (parent) => parent.avatar_photo // Direct reference if image is populated
            });

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
            'Product updated and final price set:',
            finalPrice
          );
        } else {
          console.log(
            'Final price is already set correctly:',
            finalPrice
          );
        }
      }
    });

    // Function to calculate the final price
    function calculateFinalPrice(price, salePrice) {
      if (!salePrice || salePrice === 0 || salePrice >= price) {
        return price; // If sale price is not defined or invalid, use price
      }
      return salePrice; // Use sale price if valid
    }
  }
};
