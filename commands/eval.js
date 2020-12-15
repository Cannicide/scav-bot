//A command to allow me to execute code and determine values of variables from in Discord itself

const Command = require("../command");
const evg = require("../evg");
const Reactions = new evg("reactions");
const Interface = require("../interface");

const utilities = {
    drawGiveaway: (message) => {
        require("./giveaway").drawWinners(message.client, Reactions.get().find(element => element.type == "giveaway"));
    },
    timeToMs: (time) => {
        return require("./giveaway").convertToTime(time);
    }
}

module.exports = new Command("eval", async (message, args) => {

    if (message.member.user.id != "274639466294149122") return message.channel.send("Only Cannicide can use this command!");

    try {
        var result = eval(args.join(" "));
        if (result != "" && !(result instanceof Promise)) await message.channel.send("```js\n" + result + "```");
    }
    catch (err) {
        message.channel.send("```js\n" + err.stack + "```");
    }

}, false, true, "Command to allow Cannicide to evaluate code from within Discord.");