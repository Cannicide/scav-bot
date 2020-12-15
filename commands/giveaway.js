//Command to create giveaways!

var Command = require("../command");
var Interface = require("../interface");
var Reactions = new (require("../evg"))("reactions");
const schedule = require('node-schedule');

//Currently scheduled giveaway draw
var currentlyScheduled = false;

function convertToTime(str) {
    //Converts time strings such as "3h" to the proper time (3 hours, in milliseconds)
    //Minimum time allowed is 1m

    var time = Number(str.replace(/[^0-9]+/g, ""));
    var unit = str.replace(/[0-9]+/g, "");

    if (unit.match(/mi/gi) || unit.toLowerCase() == "m") return time * 1000 * 60; //mins (and avoiding "months")
    else if (unit.match(/h/gi) && !unit.match(/month/gi)) return time * 1000 * 60 * 60; //hours (and avoiding "months")
    else if (unit.match(/d/gi) && !unit.match(/sec/gi)) return time * 1000 * 60 * 60 * 24; //days (and avoiding "seconds")
    else if (unit.match(/w/gi)) return time * 1000 * 60 * 60 * 24 * 7; //weeks
    else return 60 * 1000; //Set to minimum time, if below minimum is provided
}

function giveawayScheduler(client) {

    var cache = Reactions.get();
    var giveaway = cache.find(element => element.type == "giveaway");

    if (giveaway) {

        //Execute at proper time
        currentlyScheduled = schedule.scheduleJob(giveaway.date, drawWinners.bind(null, client, giveaway));

    }

}

function drawWinners(client, giveaway) {

    if (!giveaway) return;

    var channelID = giveaway.channelID;
    var messageID = giveaway.messageID;
    var numWinners = giveaway.numWinners;

    client.channels.fetch(channelID).then(channel => {

        channel.messages.fetch(messageID).then(m => {
            var winners = {};

            //Fetches all users who reacted to the message, updating the cache
            m.reactions.cache.find(r => r.emoji.name == "🎁").users.fetch().then(users => {

                users = users.filter(user => !user.bot);

                //Obtains all winners without duplicates
                while (Object.keys(winners).length != numWinners && Object.keys(winners).length < users.size) {
                    var winner = users.random();

                    winners[winner.username] = winner;
                }

                //Convert to array
                winners = Object.values(winners);

                if (winners.length == 0) winners = ["*Nobody joined the giveaway :(*"]

                var description = "**Giveaway ended**\n\nWinners:\n🎁 ";
                winners = winners.join("\n🎁 ");

                description += winners;

                var embed = m.embeds[0];
                embed.description = description;

                m.edit(embed);

                var cache = Reactions.get();
                cache.splice(cache.findIndex(a => a.type == "giveaway"), 1);

                Reactions.set(cache);

                m.channel.send(`🎁${winners}\n\n💝 **You won the giveaway!** 💝`).then(c => c.delete({timeout:5000}));

                if (currentlyScheduled) {
                    currentlyScheduled.cancel();
                    currentlyScheduled = false;
                }

            })
            

        });

    });

}

module.exports = {
    commands: [
        new Command("giveaway", (message, args) => {

            if (!args[0] || !args[1] || !args[2] || isNaN(args[1])) return message.channel.send("Please use the proper syntax: `/giveaway <time> <# of winners> <description>`\n\nEx: `/giveaway 30m 3 Giving away free Steam codes!`\n(Selects 3 winners after 30 minutes)\n\n*Note: The minimum time that can be specified is 1 minute.*");

            var cache = Reactions.get();

            if (cache.find(element => element.type == "giveaway")) return message.channel.send("Sorry, only one giveaway can be running at a time.");

            var embed = new Interface.Embed(message, false, [], `Click 🎁 to enter the giveaway!`);
            embed.embed.title = `${args.slice(2).join(" ")}`;
            embed.embed.footer.text = `${message.author.username}  •  ${args[1]} winner(s)`;
            embed.embed.footer["icon_url"] = message.author.displayAvatarURL();
            embed.embed.author = {};


            message.channel.send(embed).then(m => {

                var ms_timeout = args[0];
                var now = new Date();
                now.setTime(now.getTime() + convertToTime(ms_timeout));

                var item = {
                    name: "", //Not necessary since this does not require interpreter
                    id: "",
                    type: "giveaway",
                    channelID: message.channel.id,
                    messageID: m.id,
                    numWinners: args[1],
                    date: now
                }

                cache.push(item);

                Reactions.set(cache);

                m.react("🎁").then(r => giveawayScheduler(message.client));
                message.delete({timeout: 3000});

            });

        }, {perms: ["ADMINISTRATOR"]}, false, "Start a giveaway!").attachArguments([
            {
                name: "time",
                optional: false
            },
            {
                name: "# of winners",
                optional: false
            },
            {
                name: "description",
                optional: false
            }
        ])
    ],
    drawWinners,
    giveawayScheduler,
    convertToTime
};