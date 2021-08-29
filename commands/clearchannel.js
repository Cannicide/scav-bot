//Clears an entire channel by cloning and deleting it.

const { SlashCommand } = require("elisif");

module.exports = new SlashCommand({
    name: "clearchannel",
    roles: ["Admin", "System Administrator", "Head Admin", "Owner"],
    desc: "Clears all messages in this channel. Use with caution.",
    guilds: JSON.parse(process.env.SLASH_GUILDS),
    args: [],

    async execute(slash) {

        slash.deferReply({ephemeral: true});

        //Clear channel, clone it, and set its position to the same position
        var pos = slash.channel.position;
        var name = slash.channel.name;

        if (name == "dyno-reports" || name.match("scavenger-log")) return slash.editReply("Sorry, you cannot clear the dyno-reports or scavenger-log channels.");
        if (name.toLowerCase().match("suggestions")) return slash.editReply("Sorry, you must use `/clearsuggestions` to clear a suggestions channel.");

        try {
            let ch = await slash.channel.clone();
            await ch.setPosition(pos);
        }
        catch (err) {
            return slash.editReply("An error occurred: failed to clear the channel.");
        }

        slash.editReply("Clearing channel...");

        //Delete channel and log the channel clearing in the logs channel
        await slash.channel.delete(`Cleared ${name} channel.`)
        
        let embed = slash.interface.genEmbeds({
            thumbnail: slash.guild.iconURL(),
            desc: `**${name} channel was cleared by ${slash.author.tag}.**`
        }, slash);

        slash.client.scav.log(slash.guild, embed); 

    }
});