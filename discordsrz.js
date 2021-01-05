//DiscordSRZ, my alternative to DiscordSRV

const db = require("./evg").resolve("srz");
const guildID = "717160493088768020";
const srzroles = ["Iron", "Gold", "Diamond", "Emerald", "Obsidian", "TNT", "Netherstar", "Bedrock"];

function DiscordSRZ(client) {

    function ErrorSRZ(msg) {
        this.get = () => {
            return msg;
        }

        client.guilds.cache.get("668485643487412234").channels.cache.find(c => c.name == "private-logs").send(msg);
    }

    function sync(data) {

        var user = db.has(data.user);

        if (user) {
            //User does exist, continue
            db.table(data.user).set("data", data.data);

            DiscordAction(false);
        }
        else {
            //User does not exist, something went wrong
            new ErrorSRZ("DiscordSRZ: Something went wrong in the data sync process.");
        }
    }

    function unsync(uuid) {

        var user = db.has(uuid);

        if (user) {
            //User does exist, continue

            //Set user's code to -1 and unsync roles
            db.table(uuid).set("code", -1);
            DiscordAction(true);

            //Remove user from db
            db.remove(uuid);
        }
        else {
            //User does not exist, something went wrong
            new ErrorSRZ("DiscordSRZ: Something went wrong in the data unsync process.");
        }
    }

    function add(input) {

        if (db.has(input.user)) {
            //User already exists, something went wrong
            new ErrorSRZ("DiscordSRZ: Something went wrong in the sync-adding process.");
        }
        else {
            //User does not exist yet, continue
            var data = {
                user: input.user,
                discord: false,
                code: input.code,
                data: input.data
            }

            db.set(data.user, data);
        }
    }

    /**
     * The function that actually performs actions in the discord bot with the data
     * Edit this to do whatever you want with the SRZ data
     * @param {boolean} isunsync - If true, isunsync will remove the roles instead of adding them
     */
    function DiscordAction(isunsync) {

        var guild = client.guilds.cache.get(guildID);

        db.values().forEach((user) => {
            if (user.discord) {
                //User is linked
                var member = guild.members.cache.find(m => m.id == user.discord);

                if (member) {
                    //Member exists

                    //Sync/unsync Roles:

                    if (isunsync && user.code == -1) {
                        //Unsync/remove roles
                        var roles = member.roles.cache.array();

                        roles.forEach((role) => {
                            if (user.data.sync.includes(role.name)) {
                                //Role is specified in user data as a role to sync, so remove it
                                member.roles.remove(role, "DiscordSRZ desynchronization due to unlink.");
                            }
                            else if (role.name.toLowerCase() == "verified") {
                                member.roles.remove(role, "DiscordSRZ unlinked.");
                            }
                            else if (srzroles.includes(role.name)) {
                                  if (member.roles.cache.find(r => r.name == role.name)) {
                                    member.roles.remove(role, "DiscordSRZ synchronization.");
                                  }
                              }
                        });
                    }
                    else if (!isunsync) {
                        //Sync/add roles
                        var roles = guild.roles.cache.array();

                        roles.forEach((role) => {
                            if (user.data.sync.includes(role.name)) {
                                //Role is specified in user data as a role to sync, so add it
                                member.roles.add(role, "DiscordSRZ synchronization.");
                            }
                            else if (role.name.toLowerCase() == "verified") {
                                member.roles.add(role, "DiscordSRZ linked.");
                            }
                            else if (srzroles.includes(role.name)) {
                                if (member.roles.cache.find(r => r.name == role.name)) {
                                  member.roles.remove(role, "DiscordSRZ synchronization.");
                                }
                            }
                        });
                    }


                }
            }
        });

    }

    function DataHandler(input) {
        // Input Format:
        /*
            { 
                user: 'UUID',
                code: (xxxxx = CODE) / (0 = SYNC) / (-1 = UNSYNC),
                data: { 
                    sync: [ 'Administrators', 'Builders' ],
                    placeholders: [ '127.0.0.1', '%player_onlisadne%' ] 
                } 
            }
        */

        if (input.code == 0) {
            sync(input);
        }
        else if (input.code == -1) {
            unsync(input.user);
        }
        else {
            add(input);
        }


    }

    function CodeLink(code, message) {

        if (db.values().find(m => m.code == code) && !db.values().find(m => m.code == code).discord) {
            //Code exists, pair minecraft with discord

            var user = db.values().find(m => m.code == code);
            db.table(user).set("discord", message.author.id);

            DiscordAction(false);

            message.channel.send(`✅ Successfully linked your discord account with your minecraft account (UUID: ${db.values().find(m => m.code == code).user})!`);
        }
        else if (db.values().find(m => m.code == code) && db.values().find(m => m.code == code).discord) {
            message.channel.send(`<a:no_animated:670060124399730699> Failed to link your accounts: you specified an invalid or pre-existing code.`);
        }
        else {
            //Code does not exist, return error message
            message.channel.send(`<a:no_animated:670060124399730699> Failed to link your accounts: the code you specified does not exist.`);
        }
    }

    this.DataHandler = DataHandler;
    this.Link = CodeLink;
    this.getData = () => {
        return db.values();
    }

}

module.exports = {
    DiscordSRZ: false,
    initialize(client) {
        this.DiscordSRZ = new DiscordSRZ(client);

        require("./interpreter").register({
            type: "dm",
            filter: (message, args) => args[0].length == 5 && args[0].match(/[0-9]{5}/g),
            response: (message, args) => {
                new this.DiscordSRZ.Link(args[0], message);
            }
        });
    }
};