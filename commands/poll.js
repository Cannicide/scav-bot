//Command to create polls and votes.

var Command = require("../command");
var Interface = require("../interface");
const Interpreter = require("./interpreter");
var Reactions = require("../evg").remodel("reactions");

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

        var item = {
            name: "",
            id: "",
            type: "poll",
            votes: {},
            voters: {},
            voteLimit: maxChoices || 1,
            question: question,
            choices: choices,
            messageID: message.id,
            channelID: message.channel.id,
            starter: user.id
        };

        if (type == "mc") {
            item.name = emotes.mc;
            cacheEmotes = item.name;

            if (choices.length > 10) {message.channel.send("Multiple-choice polls can only have a maximum of ten choices."); return false};
        }
        else if (type == "yn") {
            item.id = emotes.yn;
            cacheEmotes = item.id;

            if (choices.length > 2) {message.channel.send("Yea/nay polls can only have a maximum of two choices."); return false};
        }

        var choicesAdded = 0;
        emotes[type].forEach(choice => {
            if (choicesAdded < choices.length) {
                item.votes[choice] = 0;
                choicesAdded++;
            }
        });

        Interpreter.addReaction(cacheEmotes, item);

        return true;

    },
    remove: (sorted_index) => {
        //Remove poll data from reactions.json

        //Get index of poll data
        var index = polls.findIndex(sorted_index);

        //Remove poll data
        Reactions.splice(index, 1);

        //Remove poll-end data
        Reactions.splice(index - 1, 1);
    },
    array: () => {
        //Get an array of all polls, in order

        var polls_list = Reactions.filter(item => item.type == "poll");
        return polls_list;
    },
    fetch: (sorted_index) => {
        //Gets a specific poll based on the poll's index in polls#array()

        var sorted = polls.array();
        return sorted[sorted_index];
    },
    findIndex: (sorted_index) => {
        //Retrieves the index of a specific poll in the cache

        var messageID = polls.fetch(sorted_index).messageID;

        var index = Reactions.values().findIndex(item => item.messageID == messageID && item.type == "poll");
        return index;
    },
    findSortedIndex: (messageID) => {
        //Retrieve a poll's index in polls#array() based on the message ID

        var sorted = polls.array();
        return sorted.findIndex(item => item.messageID == messageID);
    },
    votes: {
        add: (sorted_index, choice, user, reaction) => {
            //Adds a vote to the specified poll
            var index = polls.findIndex(sorted_index);

            var db = Reactions.root();
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
            var index = polls.findIndex(sorted_index);

            var db = Reactions.root();
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

            var item = {
                name: "",
                id: emotes.gui.trash,
                type: "poll-end",
                messageID: message.id,
                channelID: message.channel.id
            };

            Interpreter.addReaction(emotes.gui.trash, item);
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

function createPoll(message, args) {
    //Create a poll message and saves data to reactions.json

    //Check to make sure there aren't more than 10 maximum polls running at once
    //Admins can bypass this restriction
    if (polls.array().length >= 10 && !message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("Apologies, but there can only be a maximum of 10 polls running at once.").then(m => m.delete({timeout: 5000}));

    //Get the args of the message (separated by pipe char)
    args = args.join(" ").split(" | ");

    //Check how many args the message has --
    //If it has 2 (just the question and choices supplied), then create an interface to get rest of info
    //If it has all necessary args, create the poll
    //If it has no args, explain how to create a poll

    if (args && args != "" && args.length == 2) {
        //Create reaction interfaces asking for: poll-type (if only two choices) OR max choices per user (if > 2 choices)

        //Set each variable to its respective value
        var type;
        var question = args[0];
        var choices = args[1].split(", ");
        var maxChoices;

        //Poll creation functionality, after all info is supplied
        function generatePoll() {
            var previous = false;

            var formattedChoices = polls.gui.createPollDisplay(choices, type);

            var embed = new Interface.Embed(message, {
                fields: formattedChoices,
                title: "📊 " + question,
                footer: [message.client.user.username, `Select ${maxChoices} choice(s)`]
            });

            message.channel.send(embed).then(m => {
                //React with an emote for each choice, depending on the poll-type
                choices.forEach((choice, index) => {
                    if (previous) previous = previous.then(r => {return m.react(emotes[type][index])});
                    else previous = m.react(emotes[type][index]);
                });

                //Add trash emote to allow ending poll easily
                previous.then(() => {m.react(emotes.gui.trash)})

                //Add trash to interpreter
                polls.gui.addTrash(m, message.author);

                //Create poll using polls.add()
                var result = polls.add(m, question, choices, maxChoices, type, message.author);

                //Auto-delete poll message after a few seconds for aesthetic.
                message.delete({timeout: 2500})

                //Check if polls.add() returns true; if it doesn't, delete the poll message (m)
                if (!result) m.delete();
            });
        }

        //Check how many choices the poll will have
        if (choices.length > 10) args = false;
        else if (choices.length == 2) {
            //Could be yea/nay OR multiple choice, but the maxChoices will always be 1
            //So ask for poll-type

            maxChoices = 1;
            var instances = 0;

            var embedded = new Interface.Embed(message, {
                desc: `<:yeanay:${emotes.gui.yn}> Yea/Nay Poll\n${emotes.gui.mc} Multiple Choice Poll`,
                title: "Select a Poll Type"
            });

            new Interface.ReactionInterface(message, embedded, [emotes.gui.yn, emotes.gui.mc], (menu, reaction) => {

                if (instances >= 1) return;
                instances++;

                if (reaction.emoji.id == emotes.gui.yn) {
                    //Chose yea/nay
                    type = "yn";
                }
                else {
                    //Chose multiple choice
                    type = "mc";
                }

                menu.delete();

                if (choices.length > 10) {
                    //Error message
                    var embed = new Interface.Embed(message, {
                        fields: [

                            {
                                name: "The Q&A Method",
                                value: "Specify only the poll's question and choices.\n\nFormat: ```\n/poll create <Question> | <Choice 1, Choice 2, etc.>```Ex: ```fix\n/poll create What is your favorite fruit? | Apples, Pears, Bananas```"
                            },
                            {
                                name: "The Full Method",
                                value: "Specify the poll-type (yea/nay or multiple choice), question, choices, and (optional) max-choices-per-user.\n\nFormat: ```\n/poll create <yn OR mc> | <Question> | <Choice 1, Choice 2, etc.> | [max-choices]```Ex: ```fix\n/poll create yn | Do you like apples? | I love apples, I hate apples | 1```"
                            }
                
                        ],
                        title: "Poll Creation",
                        desc: "There are two methods of creating a poll. If you attempted to create a poll and are seeing this message, you attempted one of these methods incorrectly. See below for explanations and examples."
                    });
            
                    message.channel.send(embed);
                }
                else generatePoll();

            });
        }
        else {
            //Can only be multiple choice (more than 2 choices provided), so maxChoices could possibly be higher than 1
            //So ask for maxChoices

            type = "mc";
            var instances = 0;
            var sliceNumbers = emotes.gui.numbers.slice(0, choices.length);

            var embedded = new Interface.Embed(message, {
                desc: `From ${emotes.gui.numbers[0]} - ${emotes.gui.numbers[sliceNumbers.length - 1]} choices.`,
                title: "Select Max Votable Choices Per User"
            });

            new Interface.ReactionInterface(message, embedded, sliceNumbers, (menu, reaction) => {

                if (instances >= 1) return;
                instances++;

                maxChoices = emotes.gui.numbers.indexOf(reaction.emoji.name) + 1;

                menu.delete();
                
                if (choices.length > 10) {
                    //Error message
                    var embed = new Interface.Embed(message, {
                        fields: [

                            {
                                name: "The Q&A Method",
                                value: "Specify only the poll's question and choices.\n\nFormat: ```\n/poll create <Question> | <Choice 1, Choice 2, etc.>```Ex: ```fix\n/poll create What is your favorite fruit? | Apples, Pears, Bananas```"
                            },
                            {
                                name: "The Full Method",
                                value: "Specify the poll-type (yea/nay or multiple choice), question, choices, and (optional) max-choices-per-user.\n\nFormat: ```\n/poll create <yn OR mc> | <Question> | <Choice 1, Choice 2, etc.> | [max-choices]```Ex: ```fix\n/poll create yn | Do you like apples? | I love apples, I hate apples | 1```"
                            }
                
                        ],
                        desc: "There are two methods of creating a poll. If you attempted to create a poll and are seeing this message, you attempted one of these methods incorrectly. See below for explanations and examples.",
                        title: "Poll Creation"
                    });
            
                    message.channel.send(embed);
                }
                else generatePoll();

            })
        }

    }
    else if (args && args.length >= 3) {
        //Create poll using poll-type, question, and choices info. Use max choices per user if provided (it's optional).

        //Set each variable to its respective value
        var type = args[0];
        var question = args[1];
        var choices = args[2].split(", ");
        var maxChoices = args[3] || 1;

        //Determine type:
        if (type == "y/n" || type == "yea/nay") type = "yn";
        if (type == "multiple choice") type = "mc";

        if (type == "yn") maxChoices = 1;
        if (maxChoices > choices.length) maxChoices = choices.length;

        //Check to make sure poll-type is valid. If not, set args to false such that the explanation message is triggered
        if (type != "yn" && type != "mc") {
            //Invalid type
            args = false;
        }
        else if ((type == "yn" && choices.length > 2) || (type == "mc" && choices.length > 10)) {
            //Invalid amount of choices
            args = false;
        }
        else {
            //Valid type

            var previous = false;

            var formattedChoices = polls.gui.createPollDisplay(choices, type);

            var embed = new Interface.Embed(message, {
                fields: formattedChoices,
                title: "📊 " + question,
                footer: [message.client.user.username, `Select ${maxChoices} choice(s)`]
            });

            message.channel.send(embed).then(m => {
                //React with an emote for each choice, depending on the poll-type
                choices.forEach((choice, index) => {
                    if (previous) previous = previous.then(r => {return m.react(emotes[type][index])});
                    else previous = m.react(emotes[type][index]);
                });

                //Add trash emote to allow ending poll easily
                previous.then(() => {m.react(emotes.gui.trash)})

                //Add trash to interpreter
                polls.gui.addTrash(m, message.author);

                //Create poll using polls.add()
                var result = polls.add(m, question, choices, maxChoices, type, message.author);

                //Auto-delete poll message after a few seconds for aesthetic.
                message.delete({timeout: 2500})

                //Check if polls.add() returns true; if it doesn't, delete the poll message (m)
                if (!result) m.delete();
            });
        }
    }

    if (!args || args == "" || args.length < 2) {
        //Explain both ways of how to create a poll -- specifying all args or just specifying the question/choices

        var embed = new Interface.Embed(message, {
            fields: [

                {
                    name: "The Q&A Method",
                    value: "Specify only the poll's question and choices.\n\nFormat: ```\n/poll create <Question> | <Choice 1, Choice 2, etc.>```Ex: ```fix\n/poll create What is your favorite fruit? | Apples, Pears, Bananas```"
                },
                {
                    name: "The Full Method",
                    value: "Specify the poll-type (yea/nay or multiple choice), question, choices, and (optional) max-choices-per-user.\n\nFormat: ```\n/poll create <yn OR mc> | <Question> | <Choice 1, Choice 2, etc.> | [max-choices]```Ex: ```fix\n/poll create yn | Do you like apples? | I love apples, I hate apples | 1```"
                }
    
            ],
            desc: "There are two methods of creating a poll. If you attempted to create a poll and are seeing this message, you attempted one of these methods incorrectly. See below for explanations and examples.",
            title: "Poll Creation"
        });

        message.channel.send(embed);
    }

}

function handleAddVote(reaction, user) {
    //Handle votes by saving vote data to reactions.json and ensuring that max choices per user is not exceeded

    //Find sorted index of the current poll
    var index = polls.findSortedIndex(reaction.message.id);

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

    reaction.message.edit(embed);

}

function handleRetractVote(reaction, user) {
    //Handle votes by saving vote data to reactions.json and ensuring that max choices per user is not exceeded

    //Find sorted index of the current poll
    var index = polls.findSortedIndex(reaction.message.id);

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

    reaction.message.edit(embed);

}

function pollProgress(message, args) {
    //Show the current and/or final results of a poll by its sorted_index

    //Get sorted_index from args
    var index = args && args.length == 1 ? args[0] : false;

    if (index && !isNaN(index) && Number(index) < polls.array().length && Number(index) >= 0) {
        //An index was properly specified

        var poll = polls.fetch(index);
        var votes = poll.votes;

        var type = emotes.yn[0] == poll.id[0] ? "yn" : "mc";
        var response = [];

            var choice = "No votes are in";
            var maxVotes = 0;

            Object.keys(votes).forEach((key, index) => {
                if (votes[key] > maxVotes) {
                    choice = `${emotes.full[type][index]} (**${poll.choices[index]}**)`;
                    maxVotes = votes[key];
                }
                else if (votes[key] == maxVotes) {
                    choice += ", " + `${emotes.full[type][index]} (**${poll.choices[index]}**)`;
                }
            });

        response = polls.gui.createPollDisplay(poll.choices, votes);
        response.unshift({name: "Leading", value: choice});

        var embed = new Interface.Embed(message, {
            fields: response,
            title: poll.question
        });

        message.channel.send(embed);

    }
    else {
        //An index was not properly specified

        message.delete({timeout: 5000});
        message.channel.send("Invalid poll index. Please specify a poll using the number index listed to the left of each poll in `/polls list`.").then(m => m.delete({timeout: 10000}));
    }

}

function listPolls(message) {
    //List all of the current polls (by their sorted_index) - no need for guild checks since only one guild is being used

    var list = polls.array();
    var response = "";

    list.forEach((poll, index) => {
        response += `**[${index}]** ${poll.question}\n`;
    });

    if (response == "") response = "No polls are currently running.";

    var embed = new Interface.Embed(message, {
        desc: response,
        title: "Poll List"
    },false, [], response);

    message.channel.send(embed);

}

function endPollByReaction(reaction, user) {
    //Ends a specified poll using the trash reaction

    //Remove the reaction
    reaction.users.cache.array().forEach((u) => {
        if (u.bot) return;
        reaction.users.remove(u);
    });

    //Get the sorted_index of the poll
    var index = polls.findSortedIndex(reaction.message.id);

    //Check if the reaction user is the starter of the poll, and if they are admin
    if ((!polls.fetch(index) || polls.fetch(index).starter != user.id) && !reaction.message.guild.member(user.id).hasPermission("ADMINISTRATOR")) return;

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

    reaction.message.edit(embed);
    reaction.message.reactions.removeAll();
    polls.remove(index);

}

function endPoll(message, args) {
    //Ends a specified poll using its sorted_index

    //Get sorted_index from args
    var index = args && args.length == 1 ? args[0] : false;

    if (index && !isNaN(index) && Number(index) < polls.array().length && Number(index) >= 0) {
        //An index was properly specified

        if (polls.fetch(index).starter != message.author.id && !message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(`Sorry <!@${message.author.id}>, you do not have permission to end that poll.`).then(m => m.delete({timeout: 5000}));

        var id = polls.fetch(index).messageID;
        var channelID = polls.fetch(index).channelID;

        message.guild.channels.cache.get(channelID).messages.fetch(id).then(m => {

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

            m.edit(embed);
            m.reactions.removeAll();
            polls.remove(index);
        });

        message.channel.send("Removed the poll.").then(m => {
            m.delete({timeout: 5000});
            message.delete({timeout: 5000});
        });

    }
    else {
        //An index was not properly specified

        message.delete({timeout: 5000});
        message.channel.send("Invalid poll index. Please specify a poll using the number index listed to the left of each poll in `/polls list`.").then(m => m.delete({timeout: 10000}));
    }

}

module.exports = {
    commands: [
        new Command("poll", {
            roles: ["Staff"],
            desc: "A command to create yea/nay and/or multiple-choice polls (max 10 votable options).",
            args: [
                {
                    name: "create | list | results | end",
                    optional: false,
                    feedback: "Please specify one of the following actions as an argument: create, list, results, end."
                },
                {
                    name: "poll arguments | poll index",
                    optional: true
                }
            ],
            aliases: ["polls"],
            cooldown: 2
        }, (message) => {

            //Use Interface.Interface() here to get the following details for each poll:
            // [poll-type, question, choices, max choices per user]

            // or

            //Use one-line syntax to get following details:
            // poll-type | question | choices | max choices per user
            
            //This poll system will require a ReactionCollector and reaction interpreter mechanism


            var args = message.args;


            //First, set a var to args[0] to see what action to take (create poll | list polls | show results | end poll)
            var action = args[0];

            //Then, create newArgs consisting of all args except the action arg above
            var newArgs = args.slice(1);

            //Finally, check the value of the var with args[0] and call the respective methods for the requested action
            switch (action.toLowerCase()) {
                case "create":
                    createPoll(message, newArgs);
                break;
                case "list":
                    listPolls(message);
                break;
                case "results":
                case "progress":
                    pollProgress(message, newArgs);
                break;
                case "stop":
                case "end":
                    endPoll(message, newArgs);
                break;
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
        Interpreter.register({
            type: "reaction",
            filter: (inCache, isAdding) => inCache.type == "poll" && isAdding,
            response: (r, u) => this.votes.add(r, u)
        });

        //Setup poll vote retracting
        Interpreter.register({
            type: "reaction",
            filter: (inCache, isAdding) => inCache.type == "poll" && !isAdding,
            response: (r, u) => this.votes.retract(r, u)
        });

        //Setup poll ending
        Interpreter.register({
            type: "reaction",
            filter: (inCache, isAdding) => inCache.type == "poll-end" && isAdding,
            response: (r, u) => this.polls.endByReaction(r, u)
        });

    }
};