const Handler = require("./handler");
const intents = ["GUILDS", "GUILD_MEMBERS", "GUILD_BANS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "DIRECT_MESSAGES", "GUILD_PRESENCES"];
const client = new Handler.Client({
    intents: intents,
    name: "Scav Discord Bot"
});

var Interpreter = require("./interpreter");

//Setup website
require("./website").setup(Handler.express, client);

//Setup Presence Cycler
var Cycler = require("./presence-cycler");
const PresenceHandler = new Cycler.PresenceHandler(client);

//Setup statistics logger and scheduler
var statistics = require("./commands/statistics");
statistics.logger(client);
statistics.scheduler(client);

//Setup moderation events
var moderation = require("./commands/moderation");
moderation.moderation.keepPermabanned(client);
moderation.moderation.keepMuted(client);

//Log guild joins
client.on('guildCreate', guild => {
    var guildX = client.guilds.cache.get("668485643487412234");
    guildX.channels.cache.get(guildX.channels.cache.find(c => c.name == "logs").id).send("Scav Discord Bot was added to the guild: " + guild.name);
});

//Initialize everything on bot ready
client.on('ready', () => {
    console.log('Scav Discord Bot is up and running!');

    //Allows the status of the bot to be PURPLE (I don't stream on twitch anyways)
    var presence = new Cycler.Presence();
    PresenceHandler.set(presence);

    //Cycles the presence every 10 minutes
    setInterval(() => {
        var presence = new Cycler.Presence();
        PresenceHandler.set(presence);
    }, 10 * 60 * 1000);

    var guild = client.guilds.cache.get("668485643487412234");
    guild.channels.cache.get(guild.channels.cache.find(c => c.name == "logs").id).messages.fetch("751504541756817481").then(m => m.edit("Scav Discord Bot is up and running again on the optimal port.\nAs of: " + new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}) + " EST"));
    
    //Initialize command handler
    client.commands.initialize("commands");

    //Fetch reaction interpreters:
    Interpreter.initialize(client);

    //Setup suggestion reactions:
    Interpreter.register({
        type: "message",
        filter: (m, args) => args[0].toLowerCase().match("suggestion:") && m.channel.name.toLowerCase().match("suggestions"),
        response: (message) => {
            message.react("713053971757006950")
            .then(r => {
                message.react("713053971211878452");
            });
        }
    });

    //Register Sibyll interpreter:
    const sibyll = require("./sibyll/sibyll");
    Interpreter.register({
        type: "message",
        filter: (message) => message.mentions.members.first() && message.mentions.members.first().id == "751503579457519656",
        response: (message) => {
            var input = message.content.substring(message.content.indexOf(" ") + 1);

            if (input == "" || input == " " || !input || input.startsWith("<@")) return;

            input = input.replace(/\@everyone/gi, "[@]everyone").replace(/\@here/gi, "[@]here");

            sibyll.respond(input).then((output) => {

                message.channel.send(output);

            });
        }
    });

    //Register poll interpreters:
    const polls = require("./commands/poll");
    polls.initialize();

    //Setup DiscordSRZ
    const DiscordSRZ = require("./discordsrz");
    DiscordSRZ.initialize(client);

    //Setup giveaway scheduler
    require("./commands/giveaway.js").giveawayScheduler(client);

});

//Setup message event listener
client.on('message', message => {
    try {

        // Avoid bot messages, DM and otherwise:
        if (message.author.bot) return false;

        // DM determination:
        if (message.guild === null) {
            
            //Interpret for DiscordSRZ code
            Interpreter.dm(message, message.content.split(" "));

            return false;
        }

        //Handle command:
        var cmd = client.commands.handle(message);

        //Handle messages to be interpreted:
        if (!cmd) {
            Interpreter.message(message, message.content.split(" "));
        }

    }
    catch (err) {
        message.channel.send(`Errors found:\n\`\`\`${err}\nAt ${err.stack}\`\`\``);
    }
});

client.on("messageReactionAdd", (r, user) => {
    Interpreter.reaction(r, user, true);
});

client.on("messageReactionRemove", (r, user) => {
    Interpreter.reaction(r, user, false);
});

//Added token
client.login(process.env.TOKEN);