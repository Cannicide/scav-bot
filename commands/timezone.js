//Converts a time from timezone to timezone

const { SlashCommand, fetch } = require("elisif");
const { ArgumentBuilder } = SlashCommand;
const cheerio = require("cheerio");

//Currently supported timezones; some of these may not work now or in the future, not all of them have been tested.
//Duplicate timezone abbreviation names have also not been accounted for (i.e. CST - Central Standard Time, and CST - Chinese Standard Time)
const timezones = "ACDT, ACST, AEDT, AEST, AET, CDT, CET, CST, CT, EDT, EST, ET, GMT, HDT, HST, IST, MST, MT, PDT, PST, PT, UTC".split(", ");

module.exports = new SlashCommand({
  name: "timezone",
  desc: "Converts a time between timezones; powered by Google.",
  guilds: JSON.parse(process.env.SLASH_GUILDS),
  args: [

    new ArgumentBuilder()
    .setName("time")
    .setDescription("The time you want to convert.")
    .setType("string"),

    new ArgumentBuilder()
    .setName("timezone1")
    .setDescription("Your timezone, or the one you want to convert from.")
    .setType("string")
    .addChoices(timezones),

    new ArgumentBuilder()
    .setName("timezone2")
    .setDescription("The goal timezone, or the one you want to convert to.")
    .setType("string")
    .addChoices(timezones)

  ],
  execute(slash) {

    let { time, timezone1, timezone2 } = slash.mappedArgs.toObject();
    slash.deferReply();

    fetch(`https://google.com/search?q=convert+${time}+${timezone1}+to+${timezone2}`)
    .then(res => res.text())
    .then(body => {
      var $ = cheerio.load(body);

      var time = $(".BNeawe.iBp4i.AP7Wnd > div > .BNeawe.iBp4i.AP7Wnd").text().replace(/\s\w+,/g, "");

      if (time == "") time = "Google was unable to convert to that timezone.";

      slash.editReply(slash.interface.genEmbeds({
        desc: `**Time:** ${time}`
      }, slash));
    })
    .catch(_err => {
      slash.editReply("Failed to convert the timezones; please notify Cannicide#2753.");
    });

  }
});