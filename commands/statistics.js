const ping = require("minecraft-server-util");
const { SlashCommand } = require("elisif");

function getServerInfo(client, callback, err) {

    var info = {
        players: 0,
        icon: "",
        version: "",
    }

    ping.status(client.setting("stats_mc_ip"))
    .then(response => {
        info.players = response.onlinePlayers;
        info.icon = response.favicon;
        info.version = response.version;

        let wasOnline = client.setting("mcstatus");
        client.setting("mcstatus", true);
        return callback(info, wasOnline);
    })
    .catch(error => {
        let wasOnline = client.setting("mcstatus");
        client.setting("mcstatus", false);
        if (err) err(error, wasOnline);
    });
}

const stats = new SlashCommand({
    name: "stats",
    desc: "View discord and minecraft server statistics!",
    guilds: JSON.parse(process.env.SLASH_GUILDS),
    execute(slash) {

        slash.deferReply();

        getServerInfo(client, info => {

            var memOnline = slash.guild.members.cache.filter(m => m.presence.status != 'offline').size;
            var memTotal = slash.guild.memberCount;
            var memPercent = memOnline / memTotal * 100;
            var mcPercent = info.players / memTotal * 100;

            slash.editReply(slash.client.util.genEmbeds({
                title: "**Statistics**",
                thumbnail: slash.guild.iconURL({dynamic: true}),
                fields: [
                    {
                        name: "Minecraft Server",
                        value: `Players Online: ${info.players}\nPercent of Members Online: ${Math.round(mcPercent)}\nVersion: 1.8.x-1.12.x`
                    },
                    {
                        name: "Discord Server",
                        value: `Total Member Count: ${memTotal} users\nTotal Online Members: ${memOnline}\nPercent of Members Online: ${Math.round(memPercent)}%`
                    }
                ]
            }));

        }, () => {

            slash.editReply(slash.client.util.genEmbeds({
                desc: "The server appears to be down.",
                title: "**Statistics**",
                thumbnail: slash.guild.iconURL({dynamic: true})
            }));

        });

    }
});

//Scheduler automatically updates parts of the discord with minecraft/guild info and stats
function scheduler(client, useRcon) {
    if (useRcon) return rconScheduler(client);
    else return cloneScheduler(client);
}

var previousName = "";
function createScheduledChannels(playersOnline, client, wasOnline) {

    const guild = client.guilds.cache.find(g => g.id == client.setting("stats_guild")); //"351824506773569541"
    const category = guild ? guild.channels.cache.get(client.setting("stats_category")) : false; //"728978616905367602"
    var msg = false;

    const channelPerms = [
        {
            //@everyone
            id: "351824506773569541",
            deny: ["CONNECT", "SPEAK"],
            allow: ["VIEW_CHANNEL"]
        },
        {
            //@System Administrator
            id: "627599099184807966",
            allow: ["CONNECT", "SPEAK"]
        }
    ];

    if (guild && (playersOnline || playersOnline == 0)) msg = `Players: ${playersOnline}/${guild.memberCount}`;
    else if (guild && playersOnline == false) msg = `Players: Server Offline :(`;

    if (msg && msg != previousName) {

        //Remove all channels in category
        category.children.each(channel => channel.delete("[Statistics]"));

        previousName = msg;

        //Create new channel for "IP: server IP"
        //Bypasses channel renaming limits and avoids random Discord API channel dupe glitches
        guild.channels.create("IP: " + client.setting("stats_mc_ip"), {
            parent: category,
            permissionOverwrites: channelPerms,
            type: "voice",
            reason: "[Statistics]"
        })
        .then(_c => {
            //Then create new channel for # players online
            guild.channels.create(msg, {
                parent: category,
                permissionOverwrites: channelPerms,
                type: "voice",
                reason: "[Statistics]"
            })
        });

        if (playersOnline === false && wasOnline) {
            client.scav.log(guild, `${client.setting("stats_pingroles")}, the server has gone **offline**!`);
        }
        else if (playersOnline != false && !wasOnline) {
            client.scav.log(guild, `${client.setting("stats_pingroles")}, the server is back **online**!`);
        }

    }
}

function cloneScheduler(client) {
    setInterval(() => {

        getServerInfo(client, async (info, wasOnline) => {
            createScheduledChannels(info.players, client, wasOnline);
        }, (_err, wasOnline) => {
            createScheduledChannels(false, client, wasOnline);
        });

    }, 1 * 60 * 1000);
}

function rconScheduler(client) {

    const ip = client.setting("stats_mc_ip");
    const port = Number(process.env.RCON_PORT);
    const password = process.env.RCON_PASSWORD;

    const rcon = new ping.RCON(ip, { port, enableSRV: true, timeout: 5000, password });

    rcon.on('output', async (message) => {
        //Remove color codes
        message = message.replace(/§[0-9a-f]{1}/g, "");
        var online = message.split(" out of")[0].replace("There are ", "");
        var vanished = 0;

        if (online.match("/")) {
            vanished = online.split("/")[1];
            online = online.split("/")[0];
        }

        createScheduledChannels(online ?? 0, client, true);
    });

    rcon.connect()
    .then(() => {
        console.log('Connected to RCON')

        //15-second statistics scheduler
        setInterval(async () => {
          try {
            await rcon.run("online");
          }
          catch(err) {
            rcon.connect().catch(console.log);
            console.log("Reconnected to RCON");
          }
        }, 15 * 1000);
    })
    .catch(console.log);
}

module.exports = {
    commands: [stats],
    scheduler
}