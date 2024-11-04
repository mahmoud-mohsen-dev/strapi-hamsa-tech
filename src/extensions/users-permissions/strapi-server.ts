module.exports = (plugin) => {
  // Iterate over all routes in the `content-api`
  for (let i = 0; i < plugin.routes["content-api"].routes.length; i++) {
    const route = plugin.routes["content-api"].routes[i];
    
    // Apply the policy to GET (findOne), PUT (update), and DELETE (delete) routes for users
    if (
      (route.method === "GET" && route.path === "/users/:id" && route.handler === "user.findOne") ||
      (route.method === "PUT" && route.path === "/users/:id" && route.handler === "user.update") ||
      (route.method === "DELETE" && route.path === "/users/:id" && route.handler === "user.delete")
    ) {
      console.log(`Applying isOwner policy to route: ${route.method} ${route.path}`);
      plugin.routes["content-api"].routes[i] = {
        ...route,
        config: {
          ...route.config,
          policies: route.config.policies
            ? [...route.config.policies, "global::isOwner"]
            : ["global::isOwner"],
        },
      };
    }
  }

  return plugin;
};
