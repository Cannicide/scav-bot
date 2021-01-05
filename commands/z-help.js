var Command = require("../command");

module.exports = new Command("help", {
  desc: "Gets a list of all commands, parameters, and their descriptions.\nFormat: [optional] parameters, <required> parameters, optional (flag) parameters.",
  args: [
    {
      name: "command",
      optional: true
    },
    {
      name: "nf",
      flag: "Displays just the basic description and usage for a command, without displaying any of the other information."
    }
  ]
}, (message) => {

    var cmds = new Command(false, {}).getCommands();
    var prefix = message.prefix;
    var args = message.args;
    var thumb = "https://cdn.discordapp.com/attachments/728320173009797190/751494625298219057/scavlogo.png";

    function getCommandUsage(item) {
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
          if ("static" in arg && arg.static) {
            res.value += ` ${arg.name}`;
          }
          else if ("flag" in arg && arg.flag) {
            res.value += ` (-${arg.name})`;
          }
          else if ("optional" in arg && arg.optional) {
            res.value += ` [${arg.name}]`;
          }
          else {
            res.value += ` <${arg.name}>`;
          }
        });
        res.value += "```\n** **";
      }

      res.inline = true;
      return res;
    }

    if (args && cmds.find(c => c.name.toLowerCase() == args[0].toLowerCase())) {
      //Get command info for one command.

      var cmd = cmds.find(c => c.name.toLowerCase() == args[0].toLowerCase());

      var res = getCommandUsage(cmd);
      var fields = [];

      //Add more information for this single command, if flag unspecified
      if (!(message.flags && message.flags.includes("-nf"))) {
        fields = [
          {
            name: "DM-Only Command",
            value: cmd.dm_only ? "Yes" : "No",
            inline: true
          },
          {
            name: "Cooldown",
            value: cmd.cooldown ? cmd.cooldown + " seconds" : "None"
          },
          {
            name: "Whitelisted Channels",
            value: cmd.channels ? cmd.channels.join(", ") : "Command works in all channels"
          },
          {
            name: "Aliases",
            value: cmd.isalias ? "Alias of " + cmd.aliases.join(", ") : (cmd.aliases ? cmd.aliases.join(", ") : "No aliases")
          },
          {
            name: "Special Properties",
            value: (cmd.special ? "Visible in Command List: No" : "Visible in Command List: Yes") + "\n" + (cmd.flags ? "Command Flags: " + cmd.flags.map(flag => `${flag.name} (${flag.desc})`).join(", ") : "")
          },
          {
            name: "Use Requirements",
            value: (cmd.perms ? "**Perms:** " + cmd.perms.join(", ") + "\n" : "") + (cmd.roles ? "**Roles:** " + cmd.roles.join(", ") : "")
          }
        ];
      }

      message.channel.embed({
        title: res.name,
        desc: res.value,
        thumbnail: thumb,
        fields: fields
      });

    }
    else {
      //Get command info for all commands.

      var pages = [];
      cmds.forEach((item) => {
        if (!item.special) {
            var res = getCommandUsage(item);
            pages.push(res);
        }
      });

      message.channel.paginate({
        title: "**Commands**",
        desc: "Scavenger is the official ScavengerCraft Discord Bot, created by Cannicide#2753.",
        fields: pages.slice(0, 2),
        thumbnail: thumb
      }, pages, 2);

    }

});