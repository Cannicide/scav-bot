//Moderation commands for Scavenger

var Command = require("../command");
var evg = new (require("../evg"))("moderation");
var Interface = require("../interface");
var Alias = require("../alias");

//------------------------------USER PROPERTIES----------------------------------

//Gets user (as GuildMember) using ID, mention, or tag automatically
function getUser(message, args) {

    var mention = message.mentions.members.first();

    if (mention && message.mentions.members.size) {
        //Use mention to get user

        mention = args[0];
        var id = mention.match(/^<@!?(\d+)>$/)[1];
        
        return message.guild.members.cache.find(m => m.id == id);
    }
    else if (args && args[0].length == ("274639466294149122").length && !isNaN(args[0])) {
        //Use ID to get user (user does not need to be a current member of the guild to be banned by ID)

        var id = args[0];

        var user = message.guild.members.cache.find(m => m.id == id);

        return {id: id, member: user, user: user ? user.user : false};
    }
    else if (args && args.join(" ").match(/(.+#[0-9]{4})/)) {
        //Use tag to get user

        var tag = args.join(" ").match(/(.+#[0-9]{4})/)[0];

        var user = message.guild.members.cache.find(m => m.user.tag == tag);

        return user;
    }
    else {
        //No user found

        return false;
    }

}

//Check if user object in evg has specific property
function userHasProperty(id, property) {
    var storage = initializeUser(id);

    return property in storage && storage[property];
}

//Initialize user object if not initialized
function initializeUser(id) {
    var storage = evg.get();

    if (!(id in storage)) {
        storage[id] = {
            muted: false,
            permabanned: false,
            kicked: false,
            history: []
        };

        evg.set(storage);
    }

    return storage[id];
}

//-----------------------HELPER METHODS-----------------------\\

function getTime() {
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

    return `${date}, ${time.hours}:${time.mins} ${time.ampm}`;
}

//-----------------------MODERATION COMMANDS--------------------\\

//Mass-deletes messages
function doPurge(message, args) {
    var purgeamnt = args[0];
    var purgelimit = Number(purgeamnt) + 1;
    message.channel.messages.fetch({ limit: purgelimit }).then(messages => {
        message.channel.bulkDelete(messages);
        message.reply("deleted " + messages.array().length + " messages, including deletion command.");
    }).catch(err => {
        message.channel.send("Failed to delete messages. This may be caused by attempting to delete messages that are over 2 weeks old.");
    });
}

//Get user punishment history
function doHistory(message, args) {

    var member = getUser(message, args);

    if (!member) return message.channel.send("Please specify a valid user to get the history of. Users can be specified by mention, ID, or tag.");

    var title = `History of ID:${member.id}`;
    var desc = ``;

    var user = initializeUser(member.id);

    user.history.forEach((item) => {
        desc += item + "\n";
    });

    var embed = new Interface.Embed(message, "", [], desc);
    embed.embed.thumbnail = {};
    embed.embed.title = title;

    message.channel.send(embed);

}

//Clear user history
function clearHistory(message, args) {

    var member = getUser(message, args);

    if (!member) return message.channel.send("Please specify a valid user to get the history of. Users can be specified by mention, ID, or tag.");

    var user = initializeUser(member.id);

    user.history = [];

    var storage = evg.get();
    storage[member.id] = user;

    evg.set(storage);

    message.channel.send(`Cleared history of ID:${member.id}`);

}

//Mutes users by giving them a Muted role, and automatically gives them the Muted role back if they try to leave and rejoin the server
function doMute(message, args) {

    var member = getUser(message, args);
    var origMember = member;

    if (!member) return message.channel.send("Please specify a valid user to mute. Users can be specified by mention, ID, or tag.");
    if (!member.user) return message.channel.send("The user with the ID you specified does not exist in this guild. Please specify a valid user to mute.");

    var name = member.user.username;
    if (userHasProperty(member.id, "muted")) return message.channel.send(`User \`${name}\` is already muted.`);

    var mutedRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === "muted");
    if (!mutedRole) return message.channel.send("No role named 'Muted' exists in this server. Create one to be able to mute users.");

    var reason = args.length > 1 ? args.slice(1).join(" ") : "Unknown reason";
    if (reason.match(/(#[0-9]{4})/)) reason = reason.split(/#[0-9]{4}/)[1];

    //Accounts for ID
    if ("member" in member) member = member.member;

    member.roles.add(mutedRole, reason + " - " + message.author.tag).catch(() => message.channel.send(`I wasn't able to mute user \`${name}\`. I may be missing permissions to do so.`));
    message.reply(`muted user \`${name}\`. They will still be muted if they leave and rejoin.`);

    var storage = evg.get();

    storage[origMember.id].muted = true;
    storage[origMember.id].history.push(`Muted at ${getTime()} with reason: ${reason}`);

    evg.set(storage);

}

//Kicks the user, saving the user's roles and adding them back when they rejoin
function doKick(message, args) {

    var member = getUser(message, args);
    var origMember = member;

    if (!member) return message.channel.send("Please specify a valid user to kick. Users can be specified by mention, ID, or tag.");
    if (!member.user) return message.channel.send("The user with the ID you specified does not exist in this guild. Please specify a valid user to kick.");

    var name = member.user.username;

    var reason = args.length > 1 ? args.slice(1).join(" ") : "Unknown reason";
    if (reason.match(/(#[0-9]{4})/)) reason = reason.split(/#[0-9]{4}/)[1];

    //Accounts for ID
    if ("member" in member) member = member.member;

    //Save roles
    var roles = member.roles.cache.map(role => role.id);

    member.kick(reason + " - " + message.author.tag).catch(() => message.channel.send(`I wasn't able to kick user \`${name}\`. I may be missing permissions to do so.`));
    message.reply(`kicked user \`${name}\`.`);

    var storage = evg.get();

    storage[origMember.id].history.push(`Kicked at ${getTime()} with reason: ${reason}`);
    storage[origMember.id].kicked = roles;

    evg.set(storage);

}

//Bans the user
function doBan(message, args, isPerma) {

    var member = getUser(message, args);
    var origMember = member;

    if (!member) return message.channel.send("Please specify a valid user to ban. Users can be specified by mention, ID, or tag.");

    var name = member.user ? member.user.username : member.id;
    if (userHasProperty(member.id, "permabanned")) return message.channel.send(`User \`${name}\` is already permabanned.`);

    var reason = args.length > 1 ? args.slice(1).join(" ") : "Unknown reason";
    if (reason.match(/(#[0-9]{4})/)) reason = reason.split(/#[0-9]{4}/)[1];

    //Accounts for ID
    if ("member" in member) member = member.member;

    if (!origMember.user) {
        //User to be banned does not exist in current guild, but can still be banned (ban by ID)

        message.guild.members.ban(origMember.id, reason + " - " + message.author.tag).catch(() => message.channel.send(`I wasn't able to ban user \`${name}\`. I may be missing permissions to do so, or that user ID may not exist.`));

    }
    else {

        member.ban(reason + " - " + message.author.tag).catch(() => message.channel.send(`I wasn't able to ban user \`${name}\`. I may be missing permissions to do so.`));
    
    }
    
    message.reply(`banned user \`${name}\`.`);

    var storage = evg.get();

    storage[origMember.id].history.push(`${isPerma ? "Permabanned" : "Banned"} at ${getTime()} with reason: ${reason}`);
    if (isPerma) storage[origMember.id].permabanned = true;

    evg.set(storage);

}

//Bans the user, and keeps them banned even if someone unbans them, until unbanned using the bot's unban command
//This is designed for potentially high-profile bans or when non-administrator staff members with unban perms may be compromised
function doPermaBan(message, args) {

    doBan(message, args, true);

}

//Unmutes the user
function doUnmute(message, args) {

    var member = getUser(message, args);
    var origMember = member;

    if (!member) return message.channel.send("Please specify a valid user to unmute. Users can be specified by mention, ID, or tag.");
    if (!member.user) return message.channel.send("The user with the ID you specified does not exist in this guild. Please specify a valid user to unmute.");

    var name = member.user.username;
    if (!userHasProperty(member.id, "muted")) return message.channel.send(`User \`${name}\` is not muted, and cannot be unmuted.`);

    var mutedRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === "muted");
    if (!mutedRole) return message.channel.send("No role named 'Muted' exists in this server. Create one to be able to mute/unmute users.");

    var reason = args.length > 1 ? args.slice(1).join(" ") : "Unknown reason";
    if (reason.match(/(#[0-9]{4})/)) reason = reason.split(/#[0-9]{4}/)[1];

    //Accounts for ID
    if ("member" in member) member = member.member;

    member.roles.remove(mutedRole, reason + " - " + message.author.tag).catch(() => message.channel.send(`I wasn't able to unmute user \`${name}\`. I may be missing permissions to do so.`));
    message.reply(`unmuted user \`${name}\`.`);

    var storage = evg.get();

    storage[origMember.id].muted = false;
    storage[origMember.id].history.push(`Unmuted at ${getTime()} with reason: ${reason}`);

    evg.set(storage);

}

//Unbans the user (including perma and non-perma bans)
function doUnban(message, args) {

    var member = getUser(message, args);

    if (!member) return message.channel.send("Please specify a valid user to unban. Users can be specified by mention, ID, or tag.");

    var name = member.user ? member.user.username : member.id;

    var reason = args.length > 1 ? args.slice(1).join(" ") : "Unknown reason";
    if (reason.match(/(#[0-9]{4})/)) reason = reason.split(/#[0-9]{4}/)[1];

    var storage = evg.get();

    storage[member.id].history.push(`Unbanned at ${getTime()} with reason: ${reason}`);
    storage[member.id].permabanned = false;

    evg.set(storage);

    message.guild.members.unban(member.id, reason + " - " + message.author.tag).catch(() => message.channel.send(`I wasn't able to unban user \`${name}\`. I may be missing permissions to do so, or that user ID may not exist, or the user may not have been banned.`));
    message.reply(`unbanned user \`${name}\`.`);

}

//Re-bans permabanned users that are unbanned
function keepPermabanned(client) {
    client.on("guildBanRemove", (guild, user) => {
        var member = initializeUser(user.id);

        if (member.permabanned) {
            guild.members.ban(user.id, "User is permabanned, and can only be unbanned via /unban.").catch((err) => console.log(err));
        }
    })
}

//Re-adds Muted role to muted users who leave and rejoin
//Also gives users their roles back if they were kicked
function keepMuted(client) {
    client.on("guildMemberAdd", (member) => {
        var user = initializeUser(member.id);
        var mutedRole = member.guild.roles.cache.find(role => role.name.toLowerCase() === "muted");

        if (user.kicked) {
            member.roles.add(user.kicked);
            user.kicked = false;

            var storage = evg.get();
            storage[member.id] = user;
            evg.set(storage);
        }
        else if (user.muted) {
            member.roles.add(mutedRole, "User is currently muted. Re-adding Muted role.").catch((err) => console.log(err));
        }
    })
}

var moderation = {

    purge: new Command("purge", doPurge, {
        perms: ["MANAGE_MESSAGES"]
    }, false, "Moderation command to bulk-delete messages. Specified number of messages to delete does not include command message.")
    .attachArguments([
        {
            name: "# of messages",
            optional: false
        }
    ]),

    history: new Command("history", doHistory, {
        roles: ["Staff"]
    }, false, "Moderation command to view a user's punishment history.")
    .attachArguments([
        {
            name: "user",
            optional: false
        }
    ]),

    hist: new Alias("hist", "history"),

    clear_history: new Command("clearhistory", clearHistory, {
        perms: ["ADMINISTRATOR"]
    }, false, "Moderation command to clear a user's punishment history.")
    .attachArguments([
        {
            name: "user",
            optional: false
        }
    ]),

    clear_hist: new Alias("clearhist", "clearhistory"),

    mute: new Command("mute", doMute, {
        roles: ["Pre-Mod", "Mod", "Head Mod", "Admin", "System Administrator", "Head Admin", "Owner"]
    }, false, "Moderation command to mute a user. Muted users cannot unmute themselves by leaving and rejoining the server.")
    .attachArguments([
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true
        }
    ]),

    unmute: new Command("unmute", doUnmute, {
        roles: ["Pre-Mod", "Mod", "Head Mod", "Admin", "System Administrator", "Head Admin", "Owner"]
    }, false, "Moderation command to unmute a user.")
    .attachArguments([
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true
        }
    ]),

    kick: new Command("kick", doKick, {
        roles: ["Mod", "Head Mod", "Admin", "System Administrator", "Head Admin", "Owner"]
    }, false, "Moderation command to kick a user.")
    .attachArguments([
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true
        }
    ]),

    ban: new Command("ban", doBan, {
        roles: ["Head Mod", "Admin", "System Administrator", "Head Admin", "Owner"]
    }, false, "Moderation command to ban a user.")
    .attachArguments([
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true
        }
    ]),

    permaban: new Command("permaban", doPermaBan, {
        perms: ["ADMINISTRATOR"]
    }, false, "Moderation command to 'permaban' a user. Permabanned users cannot rejoin until the unban command is used, even if unbanned through discord.")
    .attachArguments([
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true
        }
    ]),

    unban: new Command("unban", doUnban, {
        perms: ["ADMINISTRATOR"]
    }, false, "Moderation command to unban a user. Removes both bans and permabans, allowing the unbanned user to rejoin the server.")
    .attachArguments([
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true
        }
    ])

}

var commands = Object.values(moderation);

moderation.keepMuted = keepMuted;
moderation.keepPermabanned = keepPermabanned;

module.exports = {commands: commands, moderation: moderation};