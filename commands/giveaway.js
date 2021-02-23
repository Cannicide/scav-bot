//Command to create giveaways!

var Command = require("../command");
var Reactions = require("../evg").resolve("giveaway");
const schedule = require('node-schedule');
const Interface = require("../interface");

//Currently scheduled giveaway draws
var currentlyScheduled = [];

//Set emote used in giveaway:
const emote = {
    reactable: `813784688433823747`,
    sendable: `<:giveaway:813784688433823747>`
};

function convertToTime(str) {
    //Converts time strings such as "3h" to the proper time (3 hours, in milliseconds)
    //Minimum time allowed is 1m

    let ms = require('ms');

    let result = ms(str);

    if (result > ms("2 months")) result = ms("2 months"); //Maximum time allowed is 2 months

    return result;

    // var time = Number(str.replace(/[^0-9]+/g, ""));
    // var unit = str.replace(/[0-9]+/g, "");

    // if (unit.match(/mi/gi) || unit.toLowerCase() == "m") return time * 1000 * 60; //mins (and avoiding "months")
    // else if (unit.match(/h/gi) && !unit.match(/month/gi)) return time * 1000 * 60 * 60; //hours (and avoiding "months")
    // else if (unit.match(/d/gi) && !unit.match(/sec/gi)) return time * 1000 * 60 * 60 * 24; //days (and avoiding "seconds")
    // else if (unit.match(/w/gi)) return time * 1000 * 60 * 60 * 24 * 7; //weeks
    // else return 60 * 1000; //Set to minimum time, if below minimum is provided
}

function giveawayScheduler(client) {

    var giveaways = Reactions.filter(element => element.type == "giveaway");

    if (giveaways) {

        giveaways.forEach(giveaway => {

            scheduleGiveaway(giveaway, client);

        });

    }

}

function scheduleGiveaway(giveaway, client) {

    if (giveaway) {

        //Execute at proper time
        var job = schedule.scheduleJob(giveaway.date, drawWinners.bind(null, client, giveaway, false));

        currentlyScheduled.push({
            messageID: giveaway.messageID,
            job: job
        });

    }

}

function drawWinners(client, giveaway, redraw) {

    if (!giveaway) return;

    var channelID = giveaway.channelID;
    var messageID = giveaway.messageID;
    var numWinners = giveaway.numWinners;

    client.channels.fetch(channelID, true, true).then(channel => {

        channel.messages.fetch(messageID, true, true).then(m => {
            var winners = {};

            //Fetches all users who reacted to the message, updating the cache
            m.reactions.cache.find(r => r.emoji.name == emote.reactable || r.emoji.id == emote.reactable).users.fetch().then(users => {

                users = users.filter(user => !user.bot);

                //Filter out already drawn users when redrawing
                if (redraw && "filteredIDs" in giveaway) users = users.filter(user => !giveaway.filteredIDs.includes(user.id));

                //Make sure numWinners does not exceed number of users
                if (numWinners > users.size) numWinners = users.size;

                //Obtains all winners without duplicates
                while (Object.keys(winners).length != numWinners && Object.keys(winners).length < users.size) {
                    var winner = users.random();

                    winners[winner.id] = winner;
                }

                //Convert to array
                winners = Object.values(winners);

                var nowinners = "*Nobody joined the giveaway :(*";

                if (winners.length == 0) winners = [nowinners];

                var description = `**Giveaway ended**\n\nWinners:\n${emote.sendable} `;
                var winnersFormatted = winners.join(`\n${emote.sendable} `);
                var winnerPings = winners.join(" ");

                description += winnersFormatted;

                var embed = m.embeds[0];
                embed.description = description;

                if (!redraw) m.edit(embed);

                if (Reactions.values().find(a => a.type == "giveaway" && a.messageID == messageID)) Reactions.splice(Reactions.values().findIndex(a => a.type == "giveaway" && a.messageID == messageID));

                if (!winners.includes(nowinners)) {
                    m.channel.send(new Interface.Embed(m, {
                        title: `**${giveaway.desc}**`,
                        desc: `${emote.sendable} ${winnersFormatted}\n\n💝 **You won [the giveaway](https://discordapp.com/channels/${m.guild.id}/${m.channel.id}/${m.id})${redraw ? " reroll" : ""}!** 💝`,
                        footer: redraw ? [m.author.username, `${numWinners} redrawn winner(s)`] : [m.author.username],
                        content: winnerPings
                    }));
                }
                else if (redraw) {
                    m.channel.send("Unable to redraw giveaway winner(s): nobody else joined the giveaway!");
                }

                var scheduledJob = currentlyScheduled.find(job => job.messageID == messageID);
                var scheduledJobIndex = currentlyScheduled.findIndex(job => job.messageID == messageID);

                if (scheduledJob) {
                    if (scheduledJob.job) scheduledJob.job.cancel();
                    currentlyScheduled.splice(scheduledJobIndex, 1);
                }

            })
            

        });

    });

}

function redrawWinners(client, giveaway, numWinners, oldWinners) {

    giveaway.numWinners = numWinners;
    giveaway.filteredIDs = oldWinners;

    drawWinners(client, giveaway, true);

}

module.exports = {
    commands: [
        new Command("giveaway", {
            perms: ["ADMINISTRATOR"],
            desc: "Start a giveaway!",
            args: [
                {
                    name: "time",
                    feedback: "Please use the proper syntax: `/giveaway <time> <# of winners> <description>`\n\nEx: `/giveaway 30m 3 Giving away free Steam codes!`\n(Selects 3 winners after 30 minutes)\n\n*Note: Please specify a time (minimum: 1 minute).*"
                },
                {
                    name: "# of winners",
                    feedback: "*Note: Please specify the number of users that will win the giveaway.*"
                },
                {
                    name: "description",
                    feedback: "*Note: Please specify a description for the giveaway.*"
                }
            ]
        }, (message) => {

            var args = message.args;

            if (isNaN(args[1])) return message.channel.send("Please use the proper syntax: `/giveaway <time> <# of winners> <description>`\n\nEx: `/giveaway 30m 3 Giving away free Steam codes!`\n(Selects 3 winners after 30 minutes)\n\n*Note: The minimum time that can be specified is 1 minute.*");

            // if (Reactions.find(element => element.type == "giveaway")) return message.channel.send("Sorry, only one giveaway can be running at a time.");

            var ms_timeout = args[0];
            var now = new Date();
            now.setTime(now.getTime() + convertToTime(ms_timeout));

            message.channel.embed({
                title: `${args.slice(2).join(" ")}`,
                footer: [message.author.username, `${args[1]} winner(s)`],
                thumbnail: message.guild.iconURL({dynamic: true}),
                desc: `Guild: **[${message.guild.name}](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})**\nWinners: **${args[1]}**\nEnds: **${now.toLocaleDateString()}**\nAt: **${now.toLocaleTimeString([], {hour12: true, hour: 'numeric', minute:'2-digit'})} CST**\n\nClick ${emote.sendable} to enter the giveaway!`
            }).then(m => {

                var item = {
                    type: "giveaway",
                    channelID: message.channel.id,
                    messageID: m.id,
                    numWinners: args[1],
                    date: now,
                    desc: args.slice(2).join(" ")
                }

                Reactions.push(item);

                m.react(emote.reactable).then(r => scheduleGiveaway(item, message.client));
                message.delete({timeout: 3000});

            });

        }),

        new Command("reroll", {
            perms: ["ADMINISTRATOR"],
            desc: "Reroll a specified giveaway!",
            args: [
                {
                    name: "message ID",
                    feedback: "*Note: Please specify the ID of the giveaway message.*"
                },
                {
                    name: "# of winners",
                    feedback: "*Note: Please specify the number of users to reroll in the giveaway. Specify `all` to reroll all winners.*"
                }
            ],
            aliases: ["redraw"]
        }, (message) => {

            var numWinners = message.args[1];
            var id = message.args[0];

            message.channel.messages.fetch(id, true, true).then(m => {

                if (m.author.id != m.client.user.id || !m.embeds || !m.embeds[0] || !m.embeds[0].description.match("Giveaway ended")) {
                    message.channel.send("Please specify the message ID of a valid giveaway message. The ID you specified is not the message ID of a giveaway.")
                    return;
                }

                var desc = m.embeds[0].description;
                var prevWinners = desc.match(/(?<=<@)([0-9]{18})(?=>)/gm);
                if (!prevWinners) prevWinners = [];

                if (numWinners.toLowerCase() == "all") numWinners = m.embeds[0].footer.text.split(" • ")[1].split(" ")[0];

                redrawWinners(message.client, {
                    channelID: message.channel.id,
                    messageID: id,
                    desc: m.embeds[0].title
                }, numWinners, prevWinners);

                message.delete({timeout: 3000});

            })
            .catch(err => {

                message.channel.send("I was unable to fetch the giveaway message. Please ensure that you specified the correct message ID, and that you are currently using this command in the same channel as the giveaway.");

            });

        })
    ],
    drawWinners,
    redrawWinners,
    giveawayScheduler,
    convertToTime
};