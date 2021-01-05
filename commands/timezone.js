//Converts a time from timezone to timezone

const Command = require("../command");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = new Command("timezone", {
  desc: "Converts a time between timezones or gets the time in the current timezone, powered by Google.",
  aliases: ["tz"],
  cooldown: 5,
  args: [
    {
      name: "time with timezone",
      feedback: "Please specify a time with timezone (ie. 6:45 PM EST)."
    },
    {
      name: "to",
      static: true
    },
    {
      name: "timezone",
      feedback: "Please specify a timezone to convert to."
    }
  ]
}, (message) => {

  if (message.args[0].match(":") && message.args.length >= 4 && message.args.join("+").match("to")) {
    //First arg is a time
    //"To timezone" is specified; correct syntax

    fetch(`https://google.com/search?q=${message.args.join("+")}`)
    .then(res => res.text())
    .then(body => {
      var $ = cheerio.load(body);

      var time = $(".BNeawe.iBp4i.AP7Wnd > div > .BNeawe.iBp4i.AP7Wnd").text().replace(/\s\w+,/g, "");

      if (time == "") time = "Google was unable to convert to that timezone.";

      message.channel.embed({
        desc: `**Time:** ${time}`
      })
    })
    .catch(err => {
      message.channel.send("Failed to convert the timezones; please notify Cannicide#2753.");
    });

  }
  else {
    //"To timezone" is not specified; incorrect syntax

    message.channel.send("Incorrect syntax; please do /timezone <time> <timezoneA> to <timezoneB>");
  }

});