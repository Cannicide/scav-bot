//DiscordSRZ, my alternative to DiscordSRV

var evg = new (require("./evg"))("srz")
const guildID = "717160493088768020";
const srzroles = ["Iron", "Gold", "Diamond", "Emerald", "Obsidian", "TNT", "Netherstar", "Bedrock"];

function DiscordSRZ(client) {

    function ErrorSRZ(msg) {
        this.get = () => {
            return msg;
        }

        client.guilds.get("668485643487412234").channels.find(c => c.name == "private-logs").send(msg);
    }

    function sync(data) {
        var db = evg.get();

        var user = db.find(m => m.user == data.user);

        if (user) {
            //User does exist, continue
            db.find(m => m.user == data.user).data = data.data;

            evg.set(db);

            DiscordAction(false);
        }
        else {
            //User does not exist, something went wrong
            new ErrorSRZ("DiscordSRZ: Something went wrong in the data sync process.");
        }
    }

    function unsync(uuid) {
        var db = evg.get();

        var user = db.find(m => m.user == uuid);

        if (user) {
            //User does exist, continue

            //Set user's code to -1 and unsync roles
            db.find(m => m.user == uuid).code = -1;
            evg.set(db);
            DiscordAction(true);

            //Remove user from db
            db.splice(db.findIndex(m => m.user == uuid), 1);
            evg.set(db);
        }
        else {
            //User does not exist, something went wrong
            new ErrorSRZ("DiscordSRZ: Something went wrong in the data unsync process.");
        }
    }

    function add(input) {
        var db = evg.get();

        if (db.find(m => m.user == input.user)) {
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

            db.push(data);
            evg.set(db)
        }
    }

    /**
     * The function that actually performs actions in the discord bot with the data
     * Edit this to do whatever you want with the SRZ data
     * @param {boolean} isunsync - If true, isunsync will remove the roles instead of adding them
     */
    function DiscordAction(isunsync) {

        var guild = client.guilds.get(guildID);
        var db = evg.get();

        db.forEach((user) => {
            if (user.discord) {
                //User is linked
                var member = guild.members.find(m => m.id == user.discord);

                if (member) {
                    //Member exists


                    //Sync/unsync Roles:

                    if (isunsync && user.code == -1) {
                        //Unsync/remove roles
                        var roles = member.roles.array();

                        roles.forEach((role) => {
                            if (user.data.sync.includes(role.name)) {
                                //Role is specified in user data as a role to sync, so remove it
                                member.removeRole(role, "DiscordSRZ desynchronization due to unlink.");
                            }
                            else if (role.name.toLowerCase() == "verified") {
                                member.removeRole(role, "DiscordSRZ unlinked.");
                            }
                            else if (srzroles.includes(role.name)) {
                                  if (member.roles.find(r => r.name == role.name)) {
                                    member.removeRole(role, "DiscordSRZ synchronization.");
                                  }
                              }
                        });
                    }
                    else if (!isunsync) {
                        //Sync/add roles
                        var roles = guild.roles.array();

                        roles.forEach((role) => {
                            if (user.data.sync.includes(role.name)) {
                                //Role is specified in user data as a role to sync, so remove it
                                member.addRole(role, "DiscordSRZ synchronization.");
                            }
                            else if (role.name.toLowerCase() == "verified") {
                                member.addRole(role, "DiscordSRZ linked.");
                            }
                            else if (srzroles.includes(role.name)) {
                                if (member.roles.find(r => r.name == role.name)) {
                                  member.removeRole(role, "DiscordSRZ synchronization.");
                                }
                            }
                        });
                    }


                }
            }
        })

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
        var db = evg.get();

        if (db.find(m => m.code == code) && !db.find(m => m.code == code).discord) {
            //Code exists, pair minecraft with discord

            db.find(m => m.code == code).discord = message.author.id;
            evg.set(db);

            DiscordAction(false);

            message.channel.send(`✅ Successfully linked your discord account with your minecraft account (UUID: ${db.find(m => m.code == code).user})!`);
        }
        else if (db.find(m => m.code == code) && db.find(m => m.code == code).discord) {
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
        return evg.get();
    }

}

module.exports = DiscordSRZ;