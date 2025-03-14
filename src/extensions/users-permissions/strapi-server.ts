import crypto from 'crypto';
import _ from 'lodash';
import utils, { yup, validateYupSchema } from '@strapi/utils';

const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;

const forgotPasswordSchema = yup
  .object({
    email: yup.string().email().required()
  })
  .noUnknown();

const otpValidationSchema = yup
  .object({
    email: yup.string().email().required(),
    otp: yup.string().length(6).required() // OTP is assumed to be 6 digits long
  })
  .noUnknown();

const sanitizeUser = (user: any, ctx: any) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel(
    'plugin::users-permissions.user'
  );

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

module.exports = (plugin: any) => {
  // This will add the policy to GET (findOne), PUT (update), and DELETE (delete) routes for users-permissions
  // Iterate over all routes in the `content-api`
  for (
    let i = 0;
    i < plugin.routes['content-api'].routes.length;
    i++
  ) {
    const route = plugin.routes['content-api'].routes[i];

    // Apply the policy to GET (findOne), PUT (update), and DELETE (delete) routes for users
    if (
      (route.method === 'GET' &&
        route.path === '/users/:id' &&
        route.handler === 'user.findOne') ||
      (route.method === 'PUT' &&
        route.path === '/users/:id' &&
        route.handler === 'user.update') ||
      (route.method === 'DELETE' &&
        route.path === '/users/:id' &&
        route.handler === 'user.delete')
    ) {
      console.log(
        `Applying isOwner policy to route: ${route.method} ${route.path}`
      );
      plugin.routes['content-api'].routes[i] = {
        ...route,
        config: {
          ...route.config,
          policies: route.config.policies
            ? [...route.config.policies, 'global::isOwner']
            : ['global::isOwner']
        }
      };
    }
  }

  // This will add a custom route to /api/auth/forgot-password-otp to make send OTP 6 digit code by email to the users
  plugin.controllers.auth.forgotPasswordOTP = async (ctx: any) => {
    const { email: email } = await validateYupSchema(
      forgotPasswordSchema
    )(ctx.request.body);
    const pluginStore = strapi.store({
      type: 'plugin',
      name: 'users-permissions'
    });
    const emailSettings: any = await pluginStore.get({
      key: 'email'
    });
    const advancedSettings: any = await pluginStore.get({
      key: 'advanced'
    });

    // Find the user by email.
    const user = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { email: email.toLowerCase() } });

    if (!user || user.blocked) {
      return ctx.send({
        data: { ok: false },
        error: { message: 'Invalid email address' }
      });
    }
    console.log('start custom controller2');
    // Generate random token.
    const userInfo: any = await sanitizeUser(user, ctx);

    // console.log('userInfo', userInfo);
    // console.log('userInfo', JSON.stringify(userInfo));

    if (
      userInfo?.provider === 'facebook' ||
      userInfo?.provider === 'google'
    ) {
      return ctx.send({
        data: { ok: false },
        error: {
          message:
            'This email address was registered using Facebook or Google login and cannot be used to change the password.'
        }
      });
    }

    const resetPasswordToken = crypto
      .randomInt(100000, 999999)
      .toString(); //crypto.randomBytes(3).toString("hex");

    const resetPasswordSettings: any = _.get(
      emailSettings,
      'reset_password.options',
      {}
    );

    const emailBody = await strapi
      .plugin('users-permissions')
      .service('users-permissions')
      .template(resetPasswordSettings.message, {
        URL: advancedSettings.email_reset_password,
        SERVER_URL: getAbsoluteServerUrl(strapi.config),
        ADMIN_URL: getAbsoluteAdminUrl(strapi.config),
        USER: userInfo,
        TOKEN: resetPasswordToken
      });

    const emailObject = await strapi
      .plugin('users-permissions')
      .service('users-permissions')
      .template(resetPasswordSettings.object, {
        USER: userInfo
      });

    const emailToSend = {
      to: user.email,
      from:
        resetPasswordSettings.from.email ||
        resetPasswordSettings.from.name
          ? `${resetPasswordSettings.from.name} <${resetPasswordSettings.from.email}>`
          : undefined,
      replyTo: resetPasswordSettings.response_email,
      subject: emailObject,
      text: emailBody,
      html: emailBody
    };

    // NOTE: Update the user before sending the email so an Admin can generate the link if the email fails
    await strapi
      .plugin('users-permissions')
      .service('user')
      .edit(user.id, { resetPasswordToken });

    // Send an email to the user.
    await strapi.plugin('email').service('email').send(emailToSend);

    ctx.send({
      data: { ok: true },
      error: null
    });
  };

  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/auth/forgot-password-otp',
    handler: 'auth.forgotPasswordOTP',
    config: {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: ''
    }
  });

  // OTP Validation Controller
  plugin.controllers.auth.validateOtp = async (ctx: any) => {
    const { email, otp } = await validateYupSchema(
      otpValidationSchema
    )(ctx.request.body);

    // Find the user by email
    const user = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { email: email.toLowerCase() } });

    if (!user || user.blocked) {
      return ctx.send({
        data: { ok: false },
        error: { message: 'Invalid email address' }
      });
    }

    // Check if the OTP matches the stored resetPasswordToken for the user
    if (user.resetPasswordToken !== otp) {
      return ctx.send({
        data: { ok: false },
        error: { message: 'Invalid OTP' }
      });
    }

    // If OTP is valid
    ctx.send({
      data: { ok: true, error: null }
    });
  };

  console.log(plugin.routes['content-api'].routes);
  // Adding the route for OTP validation
  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/auth/validate-otp',
    handler: 'auth.validateOtp',
    config: {
      middlewares: ['plugin::users-permissions.rateLimit'],
      prefix: ''
    }
  });
  console.log(plugin.routes['content-api'].routes);

  return plugin;
};
