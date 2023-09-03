package me.znepb.chatbox

object ChatboxPermissions {
    // Command permissions
    private const val PREFIX = "chatbox"

    const val SPY = "${PREFIX}_spy"

    const val LICENSE = "${PREFIX}_license"
    const val LICENSE_REGISTER = "${PREFIX}_license_reigster"
    const val LICENSE_UNREGISTER = "${PREFIX}_license_unregister"

    const val ADMIN = "${PREFIX}_admin"
    const val ADMIN_WEBSOCKET = "${PREFIX}_admin_websocket"
    const val ADMIN_WEBSOCKET_STATUS = "${PREFIX}_admin_websocket_status"
    const val ADMIN_WEBSOCKET_RECONNECT = "${PREFIX}_admin_websocket_reconnect"

    // Chatbox capabilities
    const val TELL = "tell"
    const val SAY = "say"
    const val MARKDOWN = "markdown"
    const val FORMAT = "format"
    const val JSON = "json"
    const val NO_PREFIX = "no_prefix"
    const val RECEIVE = "receive"
    const val COMMANDS = "commands"
    const val JOIN_LEAVE = "join_leave"
    const val DEATH = "death"
    const val LIST_PLAYERS = "list_players"
    val ALL_CAPABILITIES = listOf(TELL, SAY, MARKDOWN, FORMAT, JSON, NO_PREFIX, RECEIVE, COMMANDS, JOIN_LEAVE, DEATH, LIST_PLAYERS)
}