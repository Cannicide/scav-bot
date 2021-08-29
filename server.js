const { Client, interpreter, /** @type {import("elisif/util/Utility")} */ util } = require("elisif");

const client = new Client({
    privilegedIntents: true,
    name: "Scav",
    presences: ["https://scavengercraft.net/", "/help"],
    presenceDuration: 10,
    logs: {
        guildID: "668485643487412234",
        channelName: "logs"
    },
    autoInitialize: {
        enabled: true,
        path: __dirname + "/commands",
    },
    authors: [
        {
            username: "Cannicide",
            id: "274639466294149122"
        }
    ],
    description: "Scavenger is the official ScavengerCraft Discord Bot, created by Cannicide#2753.",
    expansions: {
        enable: ["help", "eval", "games", "vca"],
        games: {
            trivia: {
                cheat_mode: false
            }
        }
    }
});

//Setup website
require("./website").setup(require("elisif").express, client);

//Log guild joins
client.on('guildCreate', guild => {
    client.logs.send("Scav Discord Bot was added to the guild: " + guild.name);
});

//Initialize everything on bot ready
client.once('ready', () => {
    client.logs.edit("751504541756817481", "Scav Discord Bot is up and running again on the optimal port.\nAs of: " + new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}) + " EST");

    //Setup suggestion reactions:
    interpreter.messages.register({
        identifier: "suggestion-reactions",
        filter: (m, args) => args[0].toLowerCase() == "suggestion:" && m.channel.name.toLowerCase().match("suggestions"),
        response: (message) => {
            message.react("713053971757006950")
            .then(r => {
                message.react("713053971211878452");
            });
        }
    });

    //Setup requirement of using suggestion reactions in suggestion channels:
    interpreter.messages.register({
        identifier: "suggestions-only",
        filter: (m, args) => !args[0].toLowerCase() == "suggestion:" && m.channel.name.toLowerCase().match("suggestions") && !m.member?.roles.cache.find(x => x.name == "Staff"),
        response: (message) => {

            util.Message(message);            

            var funSuggestions = [
                "Try to blame Music4lity more",
                "Ban Mouse from saying 'hi'",
                "Avoid using #BlameJay anywhere",
                "Change the IP to scav.computer because TVs are irrelevant",
                "Promote Music to Head-Head Owner",
                "Rename Saturday to Scyxer Day",
                "Remove Herobrine",
                "Change the server version to Minecraft Alpha or else"
            ];

            var sugg = funSuggestions[Math.floor(Math.random() * funSuggestions.length)];

            message.channel.util.embed({
                desc: `Hello ${message.author.tag},\n**Please use the format \`Suggestion: <your suggestion>\` to make suggestions**.\n\nExample:\n\`\`\`fix\nSuggestion: ${sugg}\n\`\`\`\n\nTo make it easier to read through suggestions and avoid clogging up suggestion channels, please take all discussion of suggestions to the general discussion channels.`
            })
            .then(m => {
                util.Message(m).deleteTimeout(15000);
            });

            message.util.deleteTimeout(250);
        }
    });

    //Setup statistics logger and scheduler
    var statistics = require("./commands/statistics");
    statistics.scheduler(client, false); //No RCON at the moment

    //Setup giveaway scheduler
    new (require("./commands/giveaway.js").Giveaway)(client).import();

    //Setup scav properties
    client.scav = {
        //Send message to scavenger-log channel of a given Guild
        log(guild, msg) {
            return guild?.channels?.cache.find(c => c.name.match("scavenger-log"))?.send(msg);
        }
    };

});

client.setting("stats_guild", "717160493088768020");
client.setting("stats_category", "753387453108453457");
client.setting("stats_everyoneid", "717160493088768020");
client.setting("stats_mc_ip", "scav.tv");
client.setting("stats_pingroles", "<@&719051504622764142> <@&725875963795341323> <@&735696829701816404> <@&719051815144128565>");

//Added token
client.login(process.env.TOKEN);