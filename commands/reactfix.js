//For manually adding reaction votes if someone sends a suggestion while the bot is down

var Command = require("../command");

module.exports = new Command("reactfix", {
    roles: ["System Administrator", "Admin", "Developer", "Mod"],
    desc: "Manually add a reaction vote to a suggestion message if that suggestion was sent while the bot was down.",
    args: [
        {
            name: "channel-name",
            feedback: "Please specify the name of the channel to fix the reaction in."
        },
        
        {
            name: "message-ID",
            feedback: "Please specify the ID of the message to fix the reaction on."
        }
    ]
}, (message) => {

    try {
        message.guild.channels.cache.find(c => c.name == message.args[0]).messages.fetch(message.args[1]).then(msg => {

            msg.react("713053971757006950")
            .then(() => {
                msg.react("713053971211878452");
                message.channel.send("Successfully added a reaction vote to message:" + message.args[1]);
            });
            
        });
    }
    catch (err) {
        message.reply("failed to add a reaction vote; either the specified channel-name or message-ID is invalid.");
    }

});