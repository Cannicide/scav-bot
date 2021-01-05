//A non-command system to interpret messages that are not commands and auto-respond/auto-react if necessary

var evg = require("./evg");

function Interpreter() {

    var Reactions = evg.remodel("reactions");
    const interpreters = {
      message: [],
      dm: [],
      reaction: []
    }

    /**
     * Interprets a guild message. Formerly named 'interpret()'.
     */
    this.message = (message, args) => {

        //Message interpreter format:
        /*
          {
            filter: function(message, args),
            response: function(message, args)
          }
        */

        var intp = interpreters.message.find(elem => elem.filter(message, args));

        if (intp) intp.response(message, args);

    }

    /**
     * Interprets a DM (direct message). Formerly named 'interpretDM()'.
     */
    this.dm = (message, args) => {

        //DM interpreter format:
        /*
          {
            filter: function(message, args),
            response: function(message, args)
          }
        */

        var intp = interpreters.dm.find(elem => elem.filter(message, args));

        if (intp) intp.response(message, args);

    }

    /**
     * Inteprets a reaction. Formerly named 'interpretReaction()'.
     */
    this.reaction = (reaction, user, isAdding) => {

        if (user.bot) return;

        var message = reaction.message;
        var emote = reaction.emoji.name;
        var emoteID = reaction.emoji.id;

        var inCache = Reactions.find(entry => (entry.name == emote || entry.id == emoteID || (Array.isArray(entry.name) && entry.name.includes(emote)) || (Array.isArray(entry.id) && entry.id.includes(emoteID))) && entry.messageID == message.id);

        //The given message is not to be interpreted by the interpreter if not stored as such
        if (!inCache) return;

        //Reaction interpreter format:
        /*
          {
            filter: function(reactionInterpreter, isAddingReaction),
            response: function(reaction, user)
          }
        */

        var intp = interpreters.reaction.find(elem => elem.filter(inCache, isAdding));

        if (intp) intp.response(reaction, user);

    }

    /**
     * Registers interpreters of any specified type.
     * @param {Object} options - All options for the interpreter to register.
     * @param {String} options.type - The type of interpreter (message/dm/reaction) to register.
     * @param {Function} options.filter - A function that accepts (args) for messages/dms or (reactionInterpreter, isAdding) for reactions; and checks whether or not the input should be responded to.
     * @param {Function} options.response - A function that accepts (message, args) for messages/dms or (reaction, user) for reactions; and uses these parameters to respond to an interpreted input that passes the filter check.
     */
    this.register = ({type, filter, response}) => {

      var intp = {
        filter: filter,
        response: response
      };

      type = type.toLowerCase();
      if (type.endsWith("s")) type = type.slice(0, type.length - 1);

      interpreters[type].push(intp);

      return this;

    }

    /**
     * Adds an interpretable reaction to the database.
     */
    this.addReaction = (emojis, obj) => {

      if (!emojis) {
        //Catch case in which no emojis provided
      }
      else if (Array.isArray(emojis)) {
        //Multiple emojis

        obj.name = obj.name || [];
        obj.id = obj.id || [];

        emojis.forEach(emote => {
          if (isNaN(emote)) {
            obj.name.push(emote);
          }
          else obj.id.push(emote);
        })

      }
      else {
        //One emoji

        if (isNaN(emojis)) obj.name = obj.name || emojis;
        else obj.id = obj.id || emojis;

      }

      Reactions.push(obj);

      return this;
    }

    /**
     * Initializes all Interpreters. Formerly named 'fetchReactionInterpreters()'.
     */
    this.initialize = (client) => {

      //Initialize Reaction Interpreters

        var cache = Reactions.values();

        cache.forEach(entry => {
            //Fetch and cache all messages that need their reactions interpreted
            client.channels.fetch(entry.channelID).then(channel => {
                channel.messages.fetch(entry.messageID, true);
            });
        });
        
    }

}

module.exports = new Interpreter();