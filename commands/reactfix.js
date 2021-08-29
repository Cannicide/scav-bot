//For manually adding reaction votes if someone sends a suggestion while the bot is down

const { SlashCommand } = require("elisif");
const { ArgumentBuilder } = SlashCommand;

module.exports = new SlashCommand({
    name: "reactfix",
    roles: ["System Administrator", "Admin", "Developer", "Mod"],
    guilds: JSON.parse(process.env.SLASH_GUILDS),
    desc: "Manually adds yea and nay emotes to a suggestion message.",
    args: [
        new ArgumentBuilder()
        .setName("message")
        .setType("string")
        .setDescription("The ID of the message to fix the reaction on.")
        .setOptional(false),

        new ArgumentBuilder()
        .setType("channel")
        .setName("channel")
        .setDescription("The name of the channel to fix the reaction in.")
        .setOptional(true)
    ],
    execute(slash) {

        var { message, channel } = slash.mappedArgs.toObject();
        channel = channel ?? slash.channel;

        slash.deferReply({ ephemeral: true });

        try {
            channel.messages.fetch(message).then(msg => {

                msg.react("713053971757006950")
                .then(() => {
                    msg.react("713053971211878452");
                    slash.editReply("Successfully added a reaction vote to message with ID: " + message);
                });
                
            });
        }
        catch (err) {
            slash.editReply("Failed to add a reaction vote; the specified message ID may be invalid, or I may not have permission to use reactions in the specified channel.");
        }
    }
});