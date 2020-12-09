var Command = require("../command");
var Interface = require("../interface");
const Alias = require("../alias");

module.exports = {
    commands: [
        new Command("help", (message, hargs) => {

            var cmds = new Command().getCommands();
            var prefix = hargs[0];
            var args = hargs[1];
            var fields = [];
            var embed;
            var thumb = "https://cdn.discordapp.com/attachments/728320173009797190/751494625298219057/scavlogo.png";

            var isFull = false;
            var pages = [];

            function fullList() {
                isFull = true;

                cmds.forEach((item) => {
                    if (!item.special) {
                        var res = {
                            name: "",
                            value: ""
                        };
                        res.name = item.name.charAt(0).toUpperCase() + item.name.substring(1) + " Command";
                        res.value = (item.desc ? item.desc + "\n" : "") + "```fix\n" + prefix + item.name;// + "\n";
                        let params = item.cmd.getArguments();
                        if (!params) {
                            res.value += "```\n** **";
                        }
                        else {
                            params.forEach((arg) => {
                                if ("optional" in arg && arg.optional == true) {
                                    res.value += ` [${arg.name}]`;
                                }
                                else {
                                    res.value += ` <${arg.name}>`;
                                }
                            });
                            res.value += "```\n** **";
                        }
                        res.inline = true;
                        //fields.push(res);
                        pages.push(res);
                    }
                });
                
                embed = new Interface.Embed(message, thumb, pages.slice(0, 2));
                embed.embed.title = "**Commands**";
                embed.embed.description = "Scavenger is the official ScavengerCraft Discord Bot, created by Cannicide#2753."
            }

            if (args) {
                var cmd = cmds.find(c => c.name == args[0]);

                if (cmd) {
                    var item = cmd;
                    var res = {
                        name: "",
                        value: ""
                    };
                    res.name = item.name.charAt(0).toUpperCase() + item.name.substring(1) + " Command";
                    res.value = (item.desc ? item.desc + "\n" : "") + "```fix\n" + prefix + item.name;// + "\n";
                    let params = item.cmd.getArguments();
                    if (!params) {
                        res.value += "```\n** **";
                    }
                    else {
                        params.forEach((arg) => {
                            if ("optional" in arg && arg.optional == true) {
                                res.value += ` [${arg.name}]`;
                            }
                            else {
                                res.value += ` <${arg.name}>`;
                            }
                        });
                        res.value += "```\n** **";
                    }
                    res.inline = true;
                    fields.push(res);

                    embed = new Interface.Embed(message, thumb, []);
                    embed.embed.title = fields[0].name;
                    embed.embed.description = fields[0].value;
                }
                else {
                    fullList();
                }
            }
            else {
                fullList();
            }


            if (!isFull) message.channel.send(embed);
            else {
                new Interface.Paginator(message, embed, pages, 2);
            }

        }, false, false, "Gets a list of all commands, parameters, and their descriptions. Format: [optional] parameters, <required> parameters.").attachArguments([
            {
                name: "command",
                optional: true
            }
        ]),

        new Alias("bothelp", "help"),

        new Alias("scavbot", "help")
    ]
};