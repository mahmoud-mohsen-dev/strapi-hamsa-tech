export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  // register(/*{ strapi }*/) {},
//  register({ strapi }) {
//   const extensionService = strapi.plugin('graphql').service('extension');
//   extensionService.use(({ nexus }) => ({
//     types: [
//       nexus.extendType({
//         type: 'UsersPermissionsMe',
//         definition(t) {
//           // Basic fields
//           t.string('full_name');
//           t.string('username');
//           t.string('email');
//           t.string('provider');
//           t.boolean('confirmed');
//           t.boolean('blocked');
//           t.string('phone');
//           t.boolean('aggree_to_our_terms');
//           t.boolean('subscribed_to_new_offers_and_newsletters');
//           t.string('phone_country_code');
//           t.string('total_spending');
          
//           // Relations and media
//           t.field('avatar_photo', {
//             type: 'UploadFile',
//             resolve: (parent) => parent.avatar_photo, // Direct reference if image is populated
//           });

//           // Relations with custom resolvers
//           t.list.field('addresses', {
//             type: 'Address',
//             resolve: async (parent) => {
//               return await strapi.entityService.findMany('api::address.address', {
//                 filters: { user: parent.id },
//               });
//             },
//           });

//           t.list.field('orders', {
//             type: 'Order',
//             resolve: async (parent) => {
//               const result = await strapi.entityService.findMany('api::order.order', {
//                 filters: { user: parent.id },
//               });
//               return result
//             },
//           });

//           t.field('cart', {
//             type: 'Cart', // Specify the return type of your cart model
//             resolve: async (parent) => {
//               try {
//                 // Fetch all carts associated with the user
//                 const carts = await strapi.entityService.findMany('api::cart.cart', {
//                   filters: { users_permissions_user: parent.id }, // Assuming 'users_permissions_user' is the relation field
//                 });

//                 // Get the first cart if exists
//                 const cart = await strapi.entityService.findOne('api::cart.cart', carts[0]?.id ?? null);

//                 if (!cart) {
//                   console.warn(`No cart found for user ID: ${parent.id}`);
//                   return null; // Handle the case where the cart does not exist
//                 }
//                 return cart; // Return the cart data if found
//               } catch (error) {
//                 console.error(`Error fetching cart for user ID: ${parent.id}`, error);
//                 throw new Error('Failed to fetch cart'); // Throw an error if fetching fails
//               }
//             },
//           });

//           t.field('wishlist', {
//             type: 'Wishlist',
//             resolve: async (parent) => {
//               try {
//                 const wishlists = await strapi.entityService.findMany('api::wishlist.wishlist', {
//                   filters: { users_permissions_user: parent.id },
//                 });

//                 const wishlist = await strapi.entityService.findOne('api::wishlist.wishlist', wishlists[0]?.id ?? null);

//                 if (!wishlist) {
//                   console.warn(`No wishlist found for user ID: ${parent.id}`);
//                   return null; // Handle the case where the wishlist does not exist
//                 }
//                 return wishlist; // Return the wishlist data if found
//               } catch (error) {
//                 console.error(`Error fetching wishlist for user ID: ${parent.id}`, error);
//                 throw new Error('Failed to fetch wishlist'); // Throw an error if fetching fails
//               }
//             },
//           });


//           t.list.field('reviews', {
//             type: 'Review', // Replace with your actual Review type
//             resolve: async (parent) => {
//               return await strapi.entityService.findMany('api::review.review', {
//                 filters: { users_permissions_user: parent.id },
//               });
//             },
//           });

//         },
//       }),
//     ],
//   }));
// },
register({ strapi }) {
  const extensionService = strapi.plugin('graphql').service('extension');
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
            resolve: (parent) => parent.avatar_photo, // Direct reference if image is populated
          });

          // Relations with custom resolvers
          t.list.field('addresses', {
            type: 'Address',
            resolve: async (parent) => {
              try {
                return await strapi.entityService.findMany('api::address.address', {
                  filters: { user: parent.id },
                });
              } catch (error) {
                console.error(`Error fetching addresses for user ID: ${parent.id}`, error);
                throw new Error('Failed to fetch addresses');
              }
            },
          });

          t.list.field('orders', {
            type: 'Order',
            resolve: async (parent) => {
              try {
                const result = await strapi.entityService.findMany('api::order.order', {
                  filters: { user: parent.id },
                });
                console.log('Orders', result);
                return result;
              } catch (error) {
                console.error(`Error fetching orders for user ID: ${parent.id}`, error);
                throw new Error('Failed to fetch orders');
              }
            },
          });

          t.field('cart', {
            type: 'Cart', // Specify the return type of your cart model
            resolve: async (parent) => {
              try {
                // Fetch all carts associated with the user
                const carts = await strapi.entityService.findMany('api::cart.cart', {
                  filters: { users_permissions_user: parent.id }, // Assuming 'users_permissions_user' is the relation field
                });

                // Get the first cart if exists
                const cart = await strapi.entityService.findOne('api::cart.cart', carts[0]?.id ?? null);

                if (!cart) {
                  console.warn(`No cart found for user ID: ${parent.id}`);
                  return null; // Handle the case where the cart does not exist
                }
                return cart; // Return the cart data if found
              } catch (error) {
                console.error(`Error fetching cart for user ID: ${parent.id}`, error);
                throw new Error('Failed to fetch cart'); // Throw an error if fetching fails
              }
            },
          });

          t.field('wishlist', {
            type: 'Wishlist',
            resolve: async (parent) => {
              try {
                const wishlists = await strapi.entityService.findMany('api::wishlist.wishlist', {
                  filters: { users_permissions_user: parent.id },
                });

                const wishlist = await strapi.entityService.findOne('api::wishlist.wishlist', wishlists[0]?.id ?? null);

                if (!wishlist) {
                  console.warn(`No wishlist found for user ID: ${parent.id}`);
                  return null; // Handle the case where the wishlist does not exist
                }
                return wishlist; // Return the wishlist data if found
              } catch (error) {
                console.error(`Error fetching wishlist for user ID: ${parent.id}`, error);
                throw new Error('Failed to fetch wishlist'); // Throw an error if fetching fails
              }
            },
          });

          t.list.field('reviews', {
            type: 'Review', // Replace with your actual Review type
            resolve: async (parent) => {
              try {
                return await strapi.entityService.findMany('api::review.review', {
                  filters: { users_permissions_user: parent.id },
                });
              } catch (error) {
                console.error(`Error fetching reviews for user ID: ${parent.id}`, error);
                throw new Error('Failed to fetch reviews');
              }
            },
          });

        },
      }),
    ],
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
        const finalPrice = calculateFinalPrice(result.price, result.sale_price);

        // Update the product with final_product_price only if it differs
        if (finalPrice !== result.final_product_price) {
          await strapi.entityService.update('api::product.product', result.id, {
            data: { final_product_price: finalPrice },
          });
          console.log('Product created and final price set:', finalPrice);
        } else {
          console.log('Final price is already set correctly:', finalPrice);
        }
      },

      // After updating a product
      afterUpdate: async ({ result }) => {
        console.log('After update event triggered:', result);

        // Calculate final price
        const finalPrice = calculateFinalPrice(result.price, result.sale_price);

        // Update the product with final_product_price only if it differs
        if (finalPrice !== result.final_product_price) {
          await strapi.entityService.update('api::product.product', result.id, {
            data: { final_product_price: finalPrice },
          });
          console.log('Product updated and final price set:', finalPrice);
        } else {
          console.log('Final price is already set correctly:', finalPrice);
        }
      },
    });

    // Function to calculate the final price
    function calculateFinalPrice(price, salePrice) {
      if (!salePrice || salePrice === 0 || salePrice >= price) {
        return price; // If sale price is not defined or invalid, use price
      }
      return salePrice; // Use sale price if valid
    }
  },
};
