export default {
    async afterCreate(event) {    // Connected to "Save" button in admin panel
        const { result } = event;

        try{
            console.log(event)
            console.log(result)
            await strapi.plugins['email'].services.email.send({
              to: 'mahmoud.mohsen.developer@gmail.com',
              from: 'mahmoud.mohsen.developer@gmail.com', // e.g. single 
              subject: 'The Strapi Email plugin worked successfully',
              text: `Your todo is: ${result.name}`, // Replace with a valid field ID
                
            })
        } catch(err) {
            console.log(err);
        }
    }
}