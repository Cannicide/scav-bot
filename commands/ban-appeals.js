//A command to allow players to appeal their bans, showing them the proper way of doing so
/*Ban appeal creation:*/ const banThread = "https://scavengercraft.net/forums/ban-appeals.18/post-thread"
/*Ban appeal format:*/ const banFormat = "https://scavengercraft.net/threads/appeals-information.4/";
const thumbnail = "https://cdn.discordapp.com/attachments/728320173009797190/751494625298219057/scavlogo.png";

const { SlashCommand } = require("elisif");

module.exports = new SlashCommand({
    name: "banappeal",
    desc: "Information on how to appeal a ban.",
    guilds: JSON.parse(process.env.SLASH_GUILDS),
    execute(slash) {

        slash.reply(slash.interface.genEmbeds({
            fields: [
                {
                    name: "The Ban Appeal Format",
                    value: `If you have been banned from the server, an appeal can get you unbanned. To appeal your ban, you must create a ban appeal on the Scav Forums, following the appropriate format. The ban appeal format can be found [here](${banFormat}).`
                },
                {
                    name: "Properly Appealing",
                    value: `Copy the template provided in the ban appeal format. Create a new appeal thread [here](${banThread}) and paste the template. Provide detailed and professional responses to the prompts provided in the template. Afterwards, wait patiently for staff members to review your appeal. Do NOT pester staff to look at your appeal, or your ban may be *extended*.`
                }
            ],
            title: "Ban Appeals",
            thumbnail
        }));

    }
});