"use strict";

/**
 * `isOwner` policy to ensure that users can only access or modify their own data.
 */

module.exports = async (policyContext, config, { strapi }) => {
  strapi.log.info("In isOwner policy.");

  // Get the authenticated user from the context
  const { user } = policyContext.state;
  console.log("user",user)
  console.log("policyContext.request.path",policyContext.request.path)
  console.log("policyContext.request.body",policyContext.request.body)

  // Determine the request type (REST or GraphQL) and get the ID parameter accordingly
  let requestedId;

  if (policyContext.request.path.startsWith('/graphql')) {
    // For GraphQL, extract the ID from the request body (variables.input)
    requestedId = policyContext.request.body?.variables?.input?.id || policyContext.request.body?.variables?.id;
  } else {
    // For REST API, extract the ID from the URL params
    requestedId = policyContext.params.id;
  }
  console.log("requestedId",requestedId)
  console.log(!isNaN(Number(user.id)) &&!isNaN(Number(requestedId)) && Number(user.id) === Number(requestedId))

  // If the user is authenticated and the ID matches the user's ID, allow access
  if (!isNaN(Number(user.id)) &&!isNaN(Number(requestedId)) && Number(user.id) === Number(requestedId)) {
    return true; // Allow access
  }

  // Deny access if the ID doesn't match
console.log("You are not authorized to access or modify this data.")
  return false;
};

