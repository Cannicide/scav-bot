//Cycle through various presences instead of a single discord presence.

function PresenceHandler(client) {

    /**
     * 
     * @param {Presence} presence 
     */
    this.set = (presence) => {
        client.user.setActivity(presence.get(), { type: 'STREAMING', url: 'https://twitch.tv/cannicide' });
    }

}

var index = 0;

/**
 * A randomized presence message.
 * @returns {Presence}
 */
function Presence() {

    var options = ["Raiding Bases", "KoTH", "FFA", "Drop Party", "/help", "/help", "/help", "/help"]
    var selected = options[index];
    index += 1;
    if (index == options.length) index = 0;

    this.get = () => {
        return selected;
    }
}

module.exports = {
    PresenceHandler: PresenceHandler,
    Presence: Presence
}