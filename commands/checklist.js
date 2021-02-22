//Command to create checklists on Discord

const Command = require("../command");
const Interpreter = require("../interpreter");
var Reactions = require("../evg").resolve("reactions");

const emotes = {
    unchecked: {
        ids: [
            "813111354956185612", 
            "813111354985807923", 
            "813111355036008460",
            "813111355557150761", 
            "813111355669217340", 
            "813111356098084894", 
            "813111356667985920", 
            "813111356290891797", 
            "813111356450275399", 
            "813111356458139689"
        ],
        full: [
            "<:checkbox_a_big:813111354956185612>", 
            "<:checkbox_b_big:813111354985807923>", 
            "<:checkbox_c_big:813111355036008460>",
            "<:checkbox_d_big:813111355557150761>", 
            "<:checkbox_e_big:813111355669217340>", 
            "<:checkbox_f_big:813111356098084894>", 
            "<:checkbox_g_big:813111356667985920>", 
            "<:checkbox_h_big:813111356290891797>", 
            "<:checkbox_i_big:813111356450275399>", 
            "<:checkbox_j_big:813111356458139689>"
        ]
    },
    checked: {
        full: "<:checked:813113529091227688>"
    },
    gui: {
        progress: {
            left: "<:left_progress:788105722097172490>",
            middle: "<:middle_progress:788105722083803166>",
            right: "<:right_progress:788105722210680842>",
            empty: "<:no_progress:788105722017087508>"
        }
    }
}

var utilities = {
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

    handleChecking: (reaction, user) => {

        //Handle checking by saving check data to reactions db and ending the checklist when 100% progress is hit

        //Find sorted index of the current poll, and index of reaction
        var index = utilities.checklists.findSortedIndex(reaction.message.id);
        var reaction_index = emotes.unchecked.ids.indexOf(reaction.emoji.id);

        //Fetch checklist using index, and fetch index in reactions db
        var todo = utilities.checklists.fetch(index);
        var total_index = utilities.checklists.findIndex(index);

        var db = Reactions.root();
        var cache = db.get("reactions");

        //Set this specific task or item to checked/completed
        cache[total_index].items[reaction_index].completed = 1;
        todo.items[reaction_index].completed = 1;

        db.set("reactions", cache);

        //Get current checklist embed
        var embed = reaction.message.embeds[0];

        //Recalculate percent completed in order to recompile the progress bar and check the checklist's completion
        var percent = Math.round(todo.items.map(i => i.completed).reduce((prev, curr) => prev + curr) / todo.items.length * 100);

        //Recompile checklist embed description
        var items = "";

        todo.items.forEach((item, index) => {
            var emote = item.completed == 1 ? emotes.checked.full : emotes.unchecked.full[index];
            var row = item.completed == 1 ? `${emote} ~~*${item.value}*~~` : `${emote} **${item.value}**`;

            items += row + "\n";
        });

        embed.description = `${items}\n${utilities.createProgressBar(percent)} **| __${percent}%__**`;

        //Check if all tasks are completed
        if (percent == 100) {
            //End the checklist if everything has been completed, and add completed message to it
            utilities.endChecklist(reaction);
            embed.description += "\n\n🎉 *Checklist has been fully completed!* 🎉";
        }

        //Edit checklist message with new results
        reaction.message.edit(embed);

    },

    handleUnchecking: (reaction, user) => {

        //Handle unchecking by saving check data to reactions db

        //Find sorted index of the current checklist, and index of reaction
        var index = utilities.checklists.findSortedIndex(reaction.message.id);
        var reaction_index = emotes.unchecked.ids.indexOf(reaction.emoji.id);

        //Fetch checklist using index, and fetch index in reactions db
        var todo = utilities.checklists.fetch(index);
        var total_index = utilities.checklists.findIndex(index);

        var db = Reactions.root();
        var cache = db.get("reactions");

        //Set this specific task or item to checked/completed
        cache[total_index].items[reaction_index].completed = 0;
        todo.items[reaction_index].completed = 0;

        db.set("reactions", cache);

        //Get current checklist embed
        var embed = reaction.message.embeds[0];

        //Recalculate percent completed in order to recompile the progress bar and check the checklist's completion
        var percent = Math.round(todo.items.map(i => i.completed).reduce((prev, curr) => prev + curr) / todo.items.length * 100);

        //Recompile checklist embed description
        var items = "";

        todo.items.forEach((item, index) => {
            var emote = item.completed == 1 ? emotes.checked.full : emotes.unchecked.full[index];
            var row = item.completed == 1 ? `${emote} ~~*${item.value}*~~` : `${emote} **${item.value}**`;

            items += row + "\n";
        });

        embed.description = `${items}\n${utilities.createProgressBar(percent)} **| __${percent}%__**`;

        //Don't check if all tasks are completed, because they can't be (since one is being marked as incomplete here)
        //Edit checklist message with new results
        reaction.message.edit(embed);

    },

    endChecklist: (reaction) => {

        //Find sorted index of the current checklist
        var index = utilities.checklists.findSortedIndex(reaction.message.id);

        utilities.checklists.remove(index);
        reaction.message.reactions.removeAll();

    },

    checklists: {

        add: (message, items, user) => {
            //Save checklist data to reactions.json
            var cacheEmotes = emotes.unchecked.ids;
    
            var item = {
                name: "",
                id: cacheEmotes,
                type: "todo",
                items: items,
                messageID: message.id,
                channelID: message.channel.id,
                starter: user.id
            };
    
            Interpreter.addReaction(cacheEmotes, item);
    
            return true;
    
        },
        remove: (sorted_index) => {
            //Remove checklist data from reactions.json
    
            //Get index of checklist data
            var index = utilities.checklists.findIndex(sorted_index);
    
            //Remove checklist data
            Reactions.splice(index, 1);
        },
        array: () => {
            //Get an array of all checklists, in order
    
            var todo_list = Reactions.filter(item => item.type == "todo");
            return todo_list;
        },
        fetch: (sorted_index) => {
            //Gets a specific checklist based on the checklist's index in checklists#array()
    
            var sorted = utilities.checklists.array();
            return sorted[sorted_index];
        },
        findIndex: (sorted_index) => {
            //Retrieves the index of a specific checklist in the cache
    
            var messageID = utilities.checklists.fetch(sorted_index).messageID;
    
            var index = Reactions.values().findIndex(item => item.messageID == messageID && item.type == "todo");
            return index;
        },
        findSortedIndex: (messageID) => {
            //Retrieve a checklist's index in polls#array() based on the message ID
    
            var sorted = utilities.checklists.array();
            return sorted.findIndex(item => item.messageID == messageID);
        }

    },

    assembleChecklistMessage: (message, elements) => {

        var items = "";
        var percent = Math.round(elements.map(i => i.completed).reduce((prev, curr) => prev + curr) / elements.length * 100);

        elements.forEach((item, index) => {
            var emote = item.completed == 1 ? emotes.checked.full : emotes.unchecked.full[index];
            var row = item.completed == 1 ? `${emote} ~~*${item.value}*~~` : `${emote} **${item.value}**`;

            items += row + "\n";
        });

        return message.channel.embed({
            title: "***TO DO***",
            desc: `${items}\n${utilities.createProgressBar(percent)} **| __${percent}%__**`
        });

    },

    retrieveChecklistMessage: (sorted_index) => {
        //To be implemented later
    },

    createChecklist: (message, args) => {

        var raw_elements = args.join(" ").split(",");
        var elements = [];

        raw_elements.forEach((e, index) => {
            var item = e;

            if (e.substring(0, 1) == " ") item = e.substring(1);

            elements.push({
                value: item,
                completed: 0 //0 represent incomplete, 1 represents complete
            });

        });

        if (elements.length > 10) return message.channel.send("Please specify fewer elements to add to the checklist. I currently do not have support for more than 10 checklist items.");

        utilities.assembleChecklistMessage(message, elements).then(m => {

            var previous = false;
            elements.forEach((unused, index) => {
                if (previous) previous = previous.then(r => m.react(emotes.unchecked.ids[index]));
                else previous = m.react(emotes.unchecked.ids[index]);
            });

            utilities.checklists.add(m, elements, message.author);

        });

    }

};

module.exports = {
    commands: [

        new Command("checklist", {
            roles: ["Staff"],
            desc: "Creates a simple, interactive checklist.",
            cooldown: 15,
            aliases: ["todo"],
            args: [
                {
                    name: "Elements to add to the checklist, separated by commas",
                    optional: false,
                    feedback: "Please specify the elements or tasks you want to add to the checklist."
                }
            ]
        }, (message) => {

            utilities.createChecklist(message, message.args);

        })

    ],
    initialize: () => {

        //Setup marking items as complete / completing a checklist
        Interpreter.register({
            type: "reaction",
            filter: (inCache, isAdding) => inCache.type == "todo" && isAdding,
            response: (r, u) => utilities.handleChecking(r, u)
        });

        //Setup unmarking items as complete
        Interpreter.register({
            type: "reaction",
            filter: (inCache, isAdding) => inCache.type == "todo" && !isAdding,
            response: (r, u) => utilities.handleUnchecking(r, u)
        });

    }
}