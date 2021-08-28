// @ts-check
// Command to create giveaways!

const schedule = require('node-schedule');
const ms = require("ms");
const { SlashCommand: { SlashCommandBuilder }, evg } = require("elisif");

class Giveaway {

    client;

    //Custom giveaway emote
    static emote = {
        reactable: `813784688433823747`,
        sendable: `<:giveaway:813784688433823747>`
    };

    //Currently scheduled giveaways
    static scheduled = new Map();


    constructor(client, table) {
        this.client = client;
        this.db = evg.resolve(table ?? "giveaway");
    }

    /**
     * Converts time strings such as "3h" into milliseconds.
     * Maximum time allowed is 1 month.
     * Ex: "3h" -> 10800000
    */
    static convertTime(str) {
    
        let result = Number(ms(str));
        if (result > ms("1 month")) result = ms("1 month");
        return result;
    }

    /**
     * Imports giveaways from a database table, automatically (re)scheduling each giveaway
    */
    import() {

        var giveaways = this.db.filter(element => element.type == "giveaway");
        if (giveaways) giveaways.forEach(this.schedule.bind(this));

    }

    /**
     * Schedules a giveaway.
     * Winners are drawn after the specific time limit configured for the giveaway.
     * If the end time has already passed (i.e. if the bot was down during the end time), the giveaway will be drawn immediately.
    */
    schedule(giveaway) {

        if (!giveaway) return;
        if (giveaway.date < Date.now()) return this.draw(giveaway, false);

        //Execute at proper time
        var job = schedule.scheduleJob(giveaway.date, this.draw.bind(this, giveaway, false));
        Giveaway.scheduled.set(giveaway.messageID, job);

    }

    /**
     * Draws unique winner(s) for a giveaway.
     * If the 'redraw' parameter is `true`, new unique winner(s) will be redrawn.
    */
    async draw(giveaway, redraw) {

        if (!giveaway) return;
    
        let channelID = giveaway.channelID;
        let messageID = giveaway.messageID;
        let numWinners = giveaway.numWinners;
    
        try {
            let channel = await this.client.channels.fetch(channelID, true, true);
            var m = await channel.messages.fetch(messageID, true, true);
        }
        catch (err) {
            //Failed to find the channel or message of the giveaway (may be deleted); cancel giveaway
            this.cancel(giveaway);
            return;
        }

        let winners = new Map();

        //Fetches all users who reacted to the message, updating the cache
        let users = await m.reactions.cache.find(r => [r.emoji.name, r.emoji.id].includes(Giveaway.emote.reactable)).users.fetch();
        users = users.filter(user => !user.bot);

        //Filter out already drawn users when redrawing
        if (redraw && giveaway.filteredIDs) users = users.filter(user => !giveaway.filteredIDs.includes(user.id));

        //Make sure numWinners does not exceed number of users
        if (numWinners > users.size) numWinners = users.size;

        //Obtain all winners without duplicates
        while (Object.keys(winners).length != numWinners && Object.keys(winners).length < users.size) {
            var winner = users.random();
            winners.set(winner.id, winner);
        }

        //Convert to array
        let results = [...winners.values()]
        let noWinners = "*Nobody joined the giveaway :(*";

        if (results.length == 0) results = [noWinners];

        let description = `**Giveaway ended**\n\nWinners:\n${Giveaway.emote.sendable} `;
        let winnersFormatted = results.join(`\n${Giveaway.emote.sendable} `);
        let winnerPings = results.join(" ");

        description += winnersFormatted;

        let embed = m.embeds[0];
        embed.description = description;
        if (!redraw) m.edit(embed);

        if (!results.includes(noWinners)) {
            this.client.util.Message(m).channel().embed({
                title: `**${giveaway.desc}**`,
                desc: `${Giveaway.emote.sendable} ${winnersFormatted}\n\n💝 **You won [the giveaway](https://discordapp.com/channels/${m.guild.id}/${m.channel.id}/${m.id})${redraw ? " reroll" : ""}!** 💝`,
                footer: redraw ? [m.author.username, `${numWinners} redrawn winner(s)`] : [m.author.username],
                content: winnerPings
            });
        }
        else if (redraw) {
            m.channel.send("Unable to redraw giveaway winner(s): nobody else joined the giveaway!");
        }

        //End giveaway
        await this.cancel(giveaway);
    
    }

    /**
     * A utility method that redraws winners for a giveaway.
    */
    async redraw(giveaway, numWinners, oldWinners) {

        giveaway.numWinners = numWinners;
        giveaway.filteredIDs = oldWinners;
    
        return await this.draw(giveaway, true);
    
    }

    /**
     * Cancels or ends a scheduled giveaway. Also used internally to end giveaways after winners are drawn.
    */
    async cancel(giveaway) {

        //Remove giveaway from database
        if (this.db.values().some(a => a.type == "giveaway" && a.messageID == giveaway.messageID)) this.db.splice(this.db.values().findIndex(a => a.type == "giveaway" && a.messageID == giveaway.messageID));

        //Remove scheduled giveaway from map
        if (Giveaway.scheduled.has(giveaway.messageID)) Giveaway.scheduled.delete(giveaway.messageID);
    }

    /**
     * A utility method that returns a Date representing the end time for a giveaway, based on a time string.
    */
    static getEndTime(timeStr) {
        let date = new Date();
        date.setTime(date.getTime() + Giveaway.convertTime(timeStr));

        return date;
    }

    /**
     * Creates a new giveaway based on parameters for time (string form), number of winners, giveaway description, and the Message object of the giveaway.
    */
    create(time, numWinners, desc, message) {

        let date = Giveaway.getEndTime(time);

        let giveaway = {
            type: "giveaway",
            channelID: message.channel.id,
            messageID: message.id,
            numWinners,
            date,
            desc
        };

        this.db.push(giveaway);
        return giveaway;

    }

}

module.exports = {
    commands: [
        //@ts-ignore
        new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create or redraw a giveaway in the server!')
        .setPerms(['MANAGE_CHANNELS'])
        .setGuilds(JSON.parse(process.env.SLASH_GUILDS))
        .addSubCommand(cmd =>
            //@ts-ignore 
            cmd.setName("create")
            .setDescription('Create a new giveaway!')
            .addStringArg(arg => 
                arg.setName("time")
                .setDescription("The amount of time until winners are drawn (e.g. 3h).")
            )
            .addIntegerArg(arg =>
                arg.setName("winners")
                .setDescription("The number of users that can win this giveaway.")    
            )
            .addStringArg(arg => 
                arg.setName("description")
                .setDescription("The description of the giveaway (i.e. what is being given away).")    
            )
            .addChannelArg(arg => 
                arg.setName("channel")
                .setDescription("The channel to send the giveaway in. Defaults to the current channel.")
                .setOptional(true)
            )
        )
        .addSubCommand(cmd =>
            //@ts-ignore
            cmd.setName("redraw")
            .setDescription("Reroll a specified giveaway.")
            .addStringArg(arg => 
                arg.setName("message")    
                .setDescription("The message ID of the giveaway to be redrawn.")
            )
            .addIntegerArg(arg =>
                arg.setName("winners")
                .setDescription("The number of users to reroll in this giveaway. Defaults to the originally set number of winners.")
                .setOptional(true)
            )
        )
        .setMethod(async slash => {

            slash.deferReply();

            if (slash.subcommand == "create") {
                //Giveaway creation logic

                let channel = slash.getArg("channel") ?? slash.channel;
                let message = await slash.client.util.Channel(channel, slash).embed({
                    title: slash.getArg("description"),
                    footer: [slash.author.username, `${slash.getArg("winners")} winner(s)`],
                    thumbnail: slash.guild.iconURL({dynamic: true}),
                    desc: `Guild: **[${slash.guild.name}](https://discordapp.com/channels/${slash.guild.id}/${slash.channel.id}/${slash.id})**\nWinners: **${slash.getArg("winners")}**\nEnds: **${Giveaway.getEndTime(slash.getArg("time")).toLocaleDateString()}**\nAt: **${Giveaway.getEndTime(slash.getArg("time")).toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'})} CST**\n\nClick ${Giveaway.emote.sendable} to enter the giveaway!`
                });

                let system = new Giveaway(slash.client, "giveaway");
                let giveaway = system.create(slash.getArg("time"), slash.getArg("winners"), slash.getArg("description"), message);
                await system.schedule(giveaway);

                slash.editReply(`Giveaway created!\n${channel.id != slash.channel.id ? "View it [here](" + message.url + ")." : "*Deleting message in (3) seconds...*"}`);
                if (channel.id == slash.channel.id) slash.deleteReply(3);

            }
            else if (slash.subcommand == "redraw") {
                //Giveaway redraw logic

                let numWinners = slash.getArg("winners");
                let id = slash.getArg("message");

                try {
                    var m = await slash.channel.messages.fetch(id, true, true);
                }
                catch (err) {
                    slash.editReply("I was unable to fetch the giveaway message. Please ensure that you specified the correct message ID, and that you are currently using this command in the same channel as the giveaway.");
                    return;
                }

                if (m.author.id != m.client.user.id || !m.embeds || !m.embeds[0] || !m.embeds[0].description.match("Giveaway ended"))
                    return slash.editReply("Please specify the message ID of a valid giveaway message. The ID you specified is not the message ID of a giveaway.");

                let desc = m.embeds[0].description;
                let prevWinners = desc.match(/(?<=<@)([0-9]{18})(?=>)/gm) ?? [];
                numWinners = numWinners ?? m.embeds[0].footer.text.split(" • ")[1].split(" ")[0];

                let system = new Giveaway(slash.client, "giveaway");
                await system.redraw({
                    channelID: m.channel.id,
                    messageID: id,
                    desc: m.embeds[0].title
                }, numWinners, prevWinners);

                slash.editReply(`Redrew winners for the giveaway!\n${m.channel.id != slash.channel.id ? "View the new winners [here](" + m.url + ")." : "*Deleting message in (3) seconds...*"}`);
                if (m.channel.id == slash.channel.id) slash.deleteReply(3);

            }

        })
        .build()
    ],
    Giveaway
}