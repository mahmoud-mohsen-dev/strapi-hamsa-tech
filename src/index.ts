export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},


  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  // bootstrap(/*{ strapi }*/) {},

  async bootstrap(/*{ strapi }*/) {
    //...

    //  declare a provider function, which gets firstname and lastname
    const googleProvider = ({ purest }) => {
      return async ({ accessToken }) => {
      const google = purest({ provider: 'google' });

      return google
        .query('oauth')
        .get('tokeninfo')
        .qs({ accessToken })
        .request()
        .then(({ body }) => ({
          username: body.email.split('@')[0],
          email: body.email,
          firstname: body.givenName, // added
          lastname: body.surname, // added
        }));
    }}


    // register new provider, overriding existing microsoft provider
    strapi.plugin('users-permissions').service('providers-registry').register('google', googleProvider);
  },

  
};
