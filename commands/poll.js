//Command to create polls and votes.

const { SlashCommand, interpreter, evg: db } = require("elisif");
const { SubCommandBuilder } = SlashCommand;
const evg = db.remodel("reactions");

const emotes = {
    mc: ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"],
    yn: ["713053971757006950", "713053971211878452"],
    full: {
        mc: ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯"],
        yn: ["<:yea:713053971757006950>", "<:nay:713053971211878452>"]
    },
    gui: {
        yn: "785989202387009567",
        mc: "🔠",
        numbers: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"],
        trash: "788111135609192459",
        progress: {
            left: "<:left_progress:788105722097172490>",
            middle: "<:middle_progress:788105722083803166>",
            right: "<:right_progress:788105722210680842>",
            empty: "<:no_progress:788105722017087508>"
        }
    }
}

//Helper methods for polls
const polls = {
    add: (message, question, choices, maxChoices, type, user) => {
        //Save poll data to reactions.json
        var cacheEmotes = [];

        if (type == "mc") {
            cacheEmotes = emotes.mc;

            if (choices.length > 10) {
                message.channel.send("Multiple-choice polls can only have a maximum of ten choices.");
                return false
            }
        }
        else if (type == "yn") {
            cacheEmotes = emotes.yn;

            if (choices.length > 2) {
                message.channel.send("Yea/nay polls can only have a maximum of two choices.");
                return false
            }
        }

        var choicesAdded = 0;

        interpreter.reactions.get("poll").add(message, user, cacheEmotes, {
            votes: emotes[type].reduce((col, choice) => {
                if (choicesAdded++ >= choices.length) return col;
                col[choice] = 0;
                return col;
            }, {}),
            voters: {},
            voteLimit: maxChoices ?? 1,
            question,
            choices,
        });

        return true;
    },
    remove: (sorted_index) => {
        //Remove poll data from reactions.json

        interpreter.reactions.get("poll").remove(sorted_index);
        interpreter.reactions.get("poll-end").remove(sorted_index);
    },
    fetch: interpreter.reactions.get("poll").fetch,
    votes: {
        add: (sorted_index, choice, user, reaction) => {
            //Adds a vote to the specified poll
            var index = interpreter.reactions.get("poll").findIndex(sorted_index);

            var db = evg.sqlite();
            var cache = db.get("reactions");
            cache[index].votes[choice] += 1;

            //Add user to voters list with one vote if not present, or increment user's votes if present
            if (user.id in cache[index].voters) cache[index].voters[user.id] += 1;
            else cache[index].voters[user.id] = 1;

            //If user's votes is higher than vote limit, remove excess votes
            if (cache[index].voters[user.id] > cache[index].voteLimit) {
                reaction.users.remove(user);
            }

            db.set("reactions", cache);
        },
        remove: (sorted_index, choice, user) => {
            //Removes a vote from the specified poll
            var index = interpreter.reactions.get("poll").findIndex(sorted_index);

            var db = evg.sqlite();
            var cache = db.get("reactions");
            cache[index].votes[choice] -= 1;

            if (cache[index].voters[user.id] > 1) cache[index].voters[user.id] -= 1;
            else delete cache[index].voters[user.id];

            if (cache[index].votes[choice] < 1) cache[index].votes[choice] = 0;

            db.set("reactions", cache);
        }
    },
    gui: {
        addTrash: (message, user) => {
            interpreter.reactions.get("poll-end").add(message, user, [emotes.gui.trash]);
        },
        createProgressBar: (percent) => {
            //Creates a 10-emote progress bar out of 4 different types of emotes

            var output = "";

            //Round to the nearest ten percent
            percent = Math.round(percent / 10) * 10;

            if (percent == 0) {
                //Simple empty bar

                output = emotes.gui.progress.empty.repeat(10);
            }
            else if (percent == 100) {
                //Simple full bar

                output = emotes.gui.progress.left + emotes.gui.progress.middle.repeat(8) + emotes.gui.progress.right;
            }
            else {
                //Partially-filled bar

                //Begin the output with left side of progress bar (1/10 emotes used)
                output = emotes.gui.progress.left;

                //Number of middle progress bar sections ([x + 1]/10 emotes used)
                var middleAmount = (percent / 10) - 1;

                //Number of empty progress bar sections ([9 - x + x + 1]/10 or 10/10 emotes used)
                var emptyAmount = 9 - middleAmount;

                output += emotes.gui.progress.middle.repeat(middleAmount) + emotes.gui.progress.empty.repeat(emptyAmount);
            }

            return output;

        },
        createPollDisplay: (choices, allVotes) => {
            //Creates the content of the poll message embed

            //The fields of the embed
            var formatted = [];

            //Check if this is the initial display
            if (typeof allVotes == "string") {
                //Use just the choices array; and use allVotes as type

                choices.forEach((item, index) => {
                    formatted.push({
                        name: `${emotes.full[allVotes][index]} ${item}`,
                        value: `${polls.gui.createProgressBar(0)} | 0% (0 votes)`
                    });
                });
            }
            else {
                //Use the allVotes dictionary and the choices array;

                var votes = Object.values(allVotes);
                var type = emotes.yn[0] == Object.keys(allVotes)[0] ? "yn" : "mc";
                var percent, totalVotes;

                totalVotes = votes.reduce((total, num) => total + Number(num));

                if (totalVotes == 0) percent = 0;

                votes.forEach((choice, index) => {

                    if (totalVotes != 0) percent = Math.round(Number(choice) / totalVotes * 100);

                    formatted.push({
                        name: `${emotes.full[type][index]} ${choices[index]}`,
                        value: `${polls.gui.createProgressBar(percent)} | ${percent}% (${choice} votes)`
                    });
                });
            }

            return formatted;

        }
    }
}

async function createPoll(slash) {
    //Creates a poll message and saves data to reactions.json

    slash.deferReply({ephemeral: true});

    //Get the args of the message (separated by pipe char)
    var args = slash.varargs;

    // Arg structure
    // /poll <question> <channel> <maxChoices> <choice1> <choice2> [choice3] ... [choice10]

    var yeawords = ["yea", "yay", "yes", "yep"];
    var naywords = ["nay", "nah", "no", "nope"];

    //Set each variable to its respective value
    var question = args[0];
    var channel = args[1];
    var maxChoices = type == "yn" ? 1 : Number(args[2]);
    var choices = args.slice(3);
    var type = yeawords.includes(choices[0].toLowerCase()) && naywords.includes(choices[1].toLowerCase()) ? "yn" : "mc";

    //Double check max choices is less than number of choices and at least 1
    if (maxChoices >= choices.length) maxChoices = choices.length - 1;
    if (maxChoices < 1) maxChoices = 1;

    //Poll creation functionality
    var previous = false;
    var formattedChoices = polls.gui.createPollDisplay(choices, type);

    var embed = slash.interface.genEmbeds({
        fields: formattedChoices,
        title: "📊 " + question,
        footer: [slash.client.user.username, `Select ${maxChoices} choice(s)`]
    }, slash);

    return channel.send(embed).then(m => {
        //React with an emote for each choice, depending on the poll-type
        choices.forEach((_c, index) => {
            if (previous) previous = previous.then(_r => m.react(emotes[type][index]));
            else previous = m.react(emotes[type][index]);
        });

        //Add trash emote to allow ending poll easily
        previous.then(() => m.react(emotes.gui.trash))

        //Add trash to interpreter
        polls.gui.addTrash(m, slash.author);

        //Create poll using polls.add()
        var result = polls.add(m, question, choices, maxChoices, type, slash.author);

        //Send response
        slash.editReply("Created new poll in channel: " + channel.name);

        //Check if polls.add() returns true; if it doesn't, delete the poll message (m)
        if (!result) m.delete();
    }).catch(_err => {
        slash.editReply("Sorry, an error occurred. Unable to create poll.");
    });

}

function handleAddVote(reaction, user) {
    //Handle votes by saving vote data to reactions.json and ensuring that max choices per user is not exceeded

    //Find sorted index of the current poll
    var index = interpreter.reactions.get("poll").findSortedIndex(reaction.message.id);

    //Check if reaction's ID is present in emotes.yn[], to determine the poll type
    if (emotes.yn.includes(reaction.emoji.id)) {
        //Is yea/nay

        polls.votes.add(index, reaction.emoji.id, user, reaction);
    }
    else {
        //Is multiple-choice

        polls.votes.add(index, reaction.emoji.name, user, reaction);
    }

    //Fetch poll using index
    var poll = polls.fetch(index);

    //Edit poll message with new results
    var embed = reaction.message.embeds[0];
    embed.fields = polls.gui.createPollDisplay(poll.choices, poll.votes);

    reaction.message.edit({embeds: [embed]});

}

function handleRetractVote(reaction, user) {
    //Handle votes by saving vote data to reactions.json and ensuring that max choices per user is not exceeded

    //Find sorted index of the current poll
    var index = interpreter.reactions.get("poll").findSortedIndex(reaction.message.id);

    //Check if reaction's ID is present in emotes.yn[], to determine the poll type
    if (emotes.yn.includes(reaction.emoji.id)) {
        //Is yea/nay

        polls.votes.remove(index, reaction.emoji.id, user);
    }
    else {
        //Is multiple-choice

        polls.votes.remove(index, reaction.emoji.name, user);
    }

    //Fetch poll using index
    var poll = polls.fetch(index);

    //Edit poll message with new results
    var embed = reaction.message.embeds[0];
    embed.fields = polls.gui.createPollDisplay(poll.choices, poll.votes);

    reaction.message.edit({embeds:[embed]});

}

function pollProgress(slash) {
    //Show the current and/or final results of a poll by its sorted_index

    //Get sorted_index from args
    var index = slash.varargs.length == 1 ? slash.varargs[0] : false;

    if (index !== false && !isNaN(index) && Number(index) < interpreter.reactions.get("poll").array().length && Number(index) >= 0) {
        //An index was properly specified

        var poll = polls.fetch(index);
        var votes = poll.votes;

        var type = emotes.yn[0] == poll.id[0] ? "yn" : "mc";
        var response = [];

        var choice = "No votes are in";
        var maxVotes = 0;

        Object.keys(votes).forEach((key, index) => {
            if (votes[key] > maxVotes) {
                choice = `${emotes.full[type][index]} **${poll.choices[index]}**`;
                maxVotes = votes[key];
            }
            else if (votes[key] == maxVotes) {
                choice += ", " + `${emotes.full[type][index]} **${poll.choices[index]}**`;
            }
        });

        response = polls.gui.createPollDisplay(poll.choices, votes);
        response.unshift({name: "Leading", value: "> " + choice + "\n> (" + maxVotes + " votes)"});

        var embed = slash.interface.genEmbeds({
            fields: response,
            title: poll.question
        }, slash);

        slash.reply(embed);

    }
    else {
        //An index was not properly specified

        slash.reply({content: "Invalid poll index. Please specify a poll using the number index listed to the left of each poll in `/polls list`.", ephemeral: true});
    }

}

async function listPolls(slash) {
    //List all of the current polls (by their sorted_index) - no need for guild checks since only one guild is being used

    slash.deferReply();
    slash.interaction.deferred = true;

    var list = interpreter.reactions.get("poll").array();
    var desc = undefined;
    var fields = [];
    var index = 0;

    for (var poll of list) {
        fields.push({
            name: `**[${index++}]** ${poll.question}\n`,
            value: `[Go to Message](https://discordapp.com/channels/${slash.guild.id}/${poll.channelID}/${poll.messageID})\nStarted by: **${(await slash.guild.members.fetch(poll.starter)).user.tag}**`
        });
    }

    if (fields.length < 1) desc = "No polls are currently running.";

    var embed = {
        desc: desc,
        title: "Poll List",
        fields: fields.slice(0, 2)
    };

    slash.editReply("Compiled list of polls...");

    slash.interface.buttonPaginator({
        message: slash,
        embed,
        elements: fields,
        perPage: 3
    });

}

function endPollByReaction(reaction, user) {
    //Ends a specified poll using the trash reaction

    //Remove the reaction
    [...reaction.users.cache.values()].forEach((u) => {
        if (u.bot) return;
        reaction.users.remove(u);
    });

    //Get the sorted_index of the poll
    var index = interpreter.reactions.get("poll").findSortedIndex(reaction.message.id);

    //Check if the reaction user is the starter of the poll, and if they are admin
    if ((!polls.fetch(index) || polls.fetch(index).starter != user.id) && !user.client.util.Member(reaction.message.guild.member(user.id)).hasPerms("ADMINISTRATOR")) return;

    var opts = polls.fetch(index).votes;
    var choice = "";
    var maxVotes = -1;

    Object.keys(opts).forEach((key, keyindex) => {
        if (opts[key] > maxVotes) {
            if (!isNaN(key)) var type = "yn";
            else var type = "mc";

            choice = `**${polls.fetch(index).choices[keyindex]}** (${emotes.full[type][keyindex]})`;
            maxVotes = opts[key];
        }
        else if (opts[key] == maxVotes) {
            if (!isNaN(key)) var type = "yn";
            else var type = "mc";

            choice += `, **${polls.fetch(index).choices[keyindex]}** (${emotes.full[type][keyindex]})`;
        }
    });

    var embed = reaction.message.embeds[0];
    embed.description = `Poll has ended.\n\n${choice} received the majority of votes (${maxVotes}).`;
    embed.fields = [];

    reaction.message.edit({embeds:[embed]});
    reaction.message.reactions.removeAll();
    polls.remove(index);

}

async function endPoll(slash) {
    //Ends a specified poll using its sorted_index
  
    await slash.deferReply({ephemeral: true});
    slash.interaction.deferred = true;
    
    //Get sorted_index from args
    var index = slash.varargs.length == 1 ? slash.varargs[0] : false;

    if (index !== false && !isNaN(index) && Number(index) < interpreter.reactions.get("poll").array().length && Number(index) >= 0) {
        //An index was properly specified

        if (polls.fetch(index).starter != slash.author.id && !slash.client.util.Member(slash.member).hasPerms("ADMINISTRATOR")) return slash.editReply(`Sorry <!@${slash.author.id}>, you do not have permission to end that poll.`);

        var id = polls.fetch(index).messageID;
        var channelID = polls.fetch(index).channelID;

        slash.guild.channels.cache.get(channelID).messages.fetch(id).then(m => {

            var opts = polls.fetch(index).votes;
            var choice = "";
            var maxVotes = -1;

            Object.keys(opts).forEach((key, keyindex) => {
                if (opts[key] > maxVotes) {
                    if (!isNaN(key)) var type = "yn";
                    else var type = "mc";

                    choice = `**${polls.fetch(index).choices[keyindex]}** (${emotes.full[type][keyindex]})`;
                    maxVotes = opts[key];
                }
                else if (opts[key] == maxVotes) {
                    if (!isNaN(key)) var type = "yn";
                    else var type = "mc";

                    choice += `, **${polls.fetch(index).choices[keyindex]}** (${emotes.full[type][keyindex]})`;
                }
            });

            var embed = m.embeds[0];
            embed.description = `Poll has ended.\n\n${choice} received the majority of votes (${maxVotes}).`;
            embed.fields = [];

            m.edit({embeds:[embed]});
            m.reactions.removeAll();
            polls.remove(index);
        });

        slash.editReply("Removed the poll.");

    }
    else {
        //An index was not properly specified

        slash.editReply("Invalid poll index. Please specify a poll using the number index listed to the left of each poll in `/polls list`.");
    }

}

module.exports = {
    commands: [
        new SlashCommand({
            name: "poll",
            // roles: ["Staff", "Surveyor"], // NO MORE ROLE RESTRICTIONS FOR POLLS!
            desc: "Build, view, list, and end polls!",
            guilds: JSON.parse(process.env.SLASH_GUILDS),
            args: [
                new SubCommandBuilder() //create <question> <channel> <maxChoices> <choice1> <choice2> [choice3] ... [choice10]
                .setName("create")
                .setDescription("Creates a new poll!")
                .addStringArg(arg => 
                    arg.setName("question")
                    .setDescription("The question to ask in the poll.")    
                )
                .addChannelArg(arg => 
                   arg.setName("channel")
                   .setDescription("The channel to post the poll in.") 
                )
                .addIntegerArg(arg => 
                    arg.setName("maxchoices")
                    .setDescription("The maximum number of choices users can select.")    
                )
                .addStringArg(arg =>
                    arg.setName("choice1")
                    .setDescription("The first choice.")
                    .setOptional(false)
                )
                .addStringArg(arg =>
                    arg.setName("choice2")
                    .setDescription("The second choice.")
                    .setOptional(false)
                )
                .addStringArg(arg =>
                    arg.setName("choice3")
                    .setDescription("The third choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice4")
                    .setDescription("The fourth choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice5")
                    .setDescription("The fifth choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice6")
                    .setDescription("The sixth choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice7")
                    .setDescription("The seventh choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice8")
                    .setDescription("The eighth choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice9")
                    .setDescription("The ninth choice.")
                    .setOptional(true)
                )
                .addStringArg(arg =>
                    arg.setName("choice10")
                    .setDescription("The tenth choice.")
                    .setOptional(true)
                ),

                new SubCommandBuilder() //list
                .setName("list")
                .setDescription("Lists all running polls."),

                new SubCommandBuilder() //progress <index>
                .setName("progress")
                .setDescription("Shows the progress of a running poll.")
                .addIntegerArg(arg =>
                    arg.setName("index")
                    .setDescription("The index of the poll to show progress of.")
                    .setOptional(false)
                ),

                new SubCommandBuilder() //end <index>
                .setName("end")
                .setDescription("Ends a running poll.")
                .addIntegerArg(arg =>
                    arg.setName("index")
                    .setDescription("The index of the poll to end.")
                    .setOptional(false)
                )
            ],
            async execute(slash) {

                if (slash.subcommand == "create") {
                    //Creates a new poll
                    await createPoll(slash);
                }
                else if (slash.subcommand == "list") {
                    //Lists all running polls
                    await listPolls(slash);
                }
                else if (slash.subcommand == "progress") {
                    //Shows the progress of a poll
                    await pollProgress(slash);
                }
                else if (slash.subcommand == "end") {
                    //Ends a poll
                    await endPoll(slash);
                }

            }
        })
    ],
    polls: {
        progress: pollProgress,
        list: listPolls,
        create: createPoll,
        endByMessage: endPoll,
        endByReaction: endPollByReaction
    },
    votes: {
        add: handleAddVote,
        retract: handleRetractVote
    },
    initialize: function() {

        //Setup poll vote adding
        interpreter.reactions.register({
            category: "poll",
            adding: true,
            filter: (inCache, r, u) => inCache && r && u,
            response: (r, u) => this.votes.add(r, u)
        })

        //Setup poll vote retracting
        interpreter.reactions.register({
            category: "poll",
            adding: false,
            filter: (inCache, r, u) => inCache && r && u,
            response: (r, u) => this.votes.retract(r, u)
        });

        //Setup poll ending
        interpreter.reactions.register({
            category: "poll-end",
            adding: true,
            filter: (inCache, r, u) => inCache && r && u,
            response: (r, u) => this.polls.endByReaction(r, u)
        });

    }
};