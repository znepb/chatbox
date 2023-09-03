# Setup Instructions

## NodeJS server setup
(Docker will be coming soon for this)
Copy config.example.yml to config.yml, and edit it to your liking. Add a .env file with 
`SUPER_AUTH_TOKEN` variable. This will be the authorization token the Minecraft server
will use to interface with the NodeJS server.

## Minecraft server setup
Install the Minecraft mod onto your Fabric server. Start the mod once. In the mod's 
config file(config/chatbox.json), edit the settings to your liking. The super auth 
token will be the same as it is in the NodeJS server.