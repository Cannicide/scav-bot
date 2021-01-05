//Command handler, formerly found in server.js
//A better, simpler way of handling a bot

//Command class
const Command = require("./command");

//Express app initialized
const express = require('express');
const app = express();

//Discord.js initialized
const Discord = require('discord.js');
var bot_intents = [];

//File system initialized
const fs = require("fs");

var commands = [];
var pfix = "/";
var client = false;

function initialize(directory, prefix) {

  /**
  * @type Command[]
  */
  var requisites = [];

  pfix = prefix || pfix || "/";

  //Import commands:
    var cmdfiles = fs.readdirSync(directory);
    cmdfiles.forEach((item) => {
        var file = require(`./${directory}/${item.substring(0, item.length - 3)}`);
        if (file instanceof Command) {
            requisites.push(file);
        }
        else if ("commands" in file) {
            file.commands.forEach((alias) => {
                if (alias instanceof Command) requisites.push(alias);
            })
        }
    });

    commands = requisites[requisites.length - 1].getCommands();
    return commands;

}

function setPrefix(prefix) {
  pfix = prefix || pfix || "/";
  return pfix;
}

function getPrefix() {
  return pfix;
}

function handleCommand(message, cmds) {

  cmds = cmds || commands;

  //Command determination:

  var components = message.content.split(" ");
  var commandWithPrefix = components[0].toLowerCase();
  var args = components.slice(1);

  var escapedPrefix = pfix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var foundPrefix = new RegExp(escapedPrefix);

  var command = commandWithPrefix.replace(foundPrefix, "");

  if (args.length < 1) {
    var args = false;
  }

  //Check for command:
  var cmd = false;

  cmds.forEach(item => {
      if (item.name == command) {
        cmd = item.cmd;
      }
  });


  if (cmd && commandWithPrefix.match(foundPrefix)) {
    message.channel.startTyping();

    setTimeout(() => {
        cmd.set(message, pfix);

        cmd.execute(args).catch(err => {
          message.reply("an error occurred:\n\n" + err);
        });

        message.channel.stopTyping();
    }, 1000);

    //Is a command, successfully handled
    return true;
  }
  //Is not a command, did not handle
  else return false;

}

function ExtendedClient({intents, name}) {

  if (client) return client;
  bot_intents = intents || bot_intents;
  name = name || "Discord Bot";

  app.use(express.static('public'));

  const listener = app.listen(process.env.PORT, function() {
    console.log(`${name} listening on port ${listener.address().port}`);
  });

  var local_client = new Discord.Client({intents: bot_intents, ws:{intents: bot_intents}});

  client = local_client;
  
  client.commands = {
    initialize: initialize,
    handle: handleCommand,
    get: () => commands
  };

  client.prefix = {
    get: getPrefix,
    set: setPrefix
  };

  client.intents = bot_intents;
  client.name = name;
  client.port = listener.address().port;

  return client;

}

module.exports = {
  Client: ExtendedClient,
  express: app,
  Discord: Discord
}