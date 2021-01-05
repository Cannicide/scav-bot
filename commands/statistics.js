var ping = require("minecraft-server-util").status;
var Command = require("../command");
var Interface = require("../interface");

function getServerInfo(callback, err) {

    var info = {
        players: 0,
        icon: "",
        version: "",
    }

    ping(process.env.SERVER_IP)
        .then((response) => {
            info.players = response.onlinePlayers;
            info.icon = response.favicon;
            info.version = response.version;
            return callback(info);
        })
        .catch((error) => {
            console.log(error);
            if (err) err();
        });
}

var stats = new Command("statistics", {
    desc: "View discord and minecraft server statistics.",
    cooldown: 30,
    aliases: ["stats"]
}, (message) => {

    getServerInfo((info) => {

        var memOnline = message.guild.members.cache.filter(m => m.presence.status != 'offline').size;
        var memTotal = message.guild.memberCount;
        var memPercent = memOnline / memTotal * 100;

        message.channel.embed({
            desc: "View all statistics [here](https://scav-bot.glitch.me/statistics)",
            title: "**Statistics**",
            thumbnail: message.guild.iconURL({dynamic: true}),
            fields: [
                {
                    name: "Minecraft Server",
                    value: `Players Online: ${info.players}\nVersion: 1.8.x-1.12.x`
                },
                {
                    name: "Discord Server",
                    value: `Total Member Count: ${memTotal} users\nTotal Online Members: ${memOnline}\nPercent of Members Online: ${Math.round(memPercent)}%`
                }
            ]
        });

    }, (err) => {

        message.channel.embed({
            desc: "The server appears to be down.\nView all statistics [here](https://scav-bot.glitch.me/statistics)",
            title: "**Statistics**",
            thumbnail: message.guild.iconURL({dynamic: true})
        });

    });

        

});

var evg = require("../evg").resolve("statistics");

function logStatistics(client) {

    setInterval(() => {
      
        var fulldate = new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York'
        });
        
        let parts = fulldate.split(", ");

        var date = parts[0];
        var fulltime = parts[1];

        //Time:

        var time = {
            raw: fulltime.split(" ")[0],
            ampm: fulltime.split(" ")[1]
        }
        time.hours = Number(time.raw.split(":")[0]);
        time.mins = Number(time.raw.split(":")[1]);
        time.secs = time.raw.split(":")[2];

        if (time.ampm == "PM" && time.hours != 12) {
            time.hours += 12;
        }
        else if (time.ampm == "AM" && time.hours == 12) {
            time.hours = 0;
        }

        //Get storage and fetch stats:

        var response = {};

        if (!evg.has(date)) {
            evg.set(date, {});
          }

        if (time.mins == 0 && !(time.hours in evg.get(date))) {
            getServerInfo((info) => {

                var guild = client.guilds.cache.find(g => g.id == "717160493088768020");
                response.onlineDiscordMembers = guild.members.cache.filter(m => m.presence.status != 'offline').size;
                response.totalDiscordMembers = guild.memberCount;
                response.percentDiscordOnline = response.onlineDiscordMembers / response.totalDiscordMembers * 100;

                response.onlineMinecraftPlayers = info.players;
                response.recordedTime = fulltime;

                //Set storage
                evg.table(date).set(time.hours, response);
            });
        }

    }, 1 * 60 * 1000);

}

//Scheduler automatically updates parts of the discord with minecraft/guild info and stats
function scheduler(client) {
    setInterval(() => {

        getServerInfo((info) => {

            var guild = client.guilds.cache.find(g => g.id == "717160493088768020");
            // var channel = guild ? guild.channels.cache.find(c => c.id == "753387453108453457") : false;
            var channel = guild ? guild.channels.cache.find(c => c.id == "783094945976287302") : false;
            var msg = false;

            if (info && info.players) msg = `${info.players} ${info.players == 1 ? "person is" : "people are"} on Scav.tv!`;

            if (channel && msg && channel.name != msg) channel.setName(msg).catch(console.error);

        })

    }, 5 * 60 * 1000);
}

module.exports = {
    command: stats,
    logger: logStatistics,
    scheduler: scheduler
}