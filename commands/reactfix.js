//For manually adding reaction votes if someone sends a suggestion while the bot is down

var Command = require("../command");

module.exports = new Command("reactfix", (message, args) => {

    if (!args || !args[0] || !args[1]) {
        message.reply("please specify all necessary command arguments, including channel-name and message-ID.");
    }
    else {
        try {
            message.guild.channels.cache.find(c => c.name == args[0]).messages.fetch(args[1]).then(msg => {
                msg.react("713053971757006950");

                    //Send nay after yea
                    setTimeout(() => {
                        msg.react("713053971211878452");
                        message.channel.send("Successfully added a reaction vote to message:" + args[1]);
                    }, 100);
            });
        }
        catch (err) {
            message.reply("failed to add a reaction vote; either the specified channel-name or message-ID is invalid.");
        }
    }

}, {
    roles: ["System Administrator", "Admin", "Developer", "Mod"]
}, false, "Manually add a reaction vote to a suggestion message if that suggestion was sent while the bot was down.").attachArguments([
    {
        name: "channel-name",
        optional: false
    },
    
    {
        name: "message-ID",
        optional: false
    }
])