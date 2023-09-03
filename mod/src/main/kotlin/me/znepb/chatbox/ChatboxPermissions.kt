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
    const val ADMIN_BAN = "${PREFIX}_admin_ban"
    const val ADMIN_UNBAN = "${PREFIX}_admin_unban"
    const val ADMIN_LICENSE = "${PREFIX}_license"
    const val ADMIN_LICENSE_REVOKE = "${PREFIX}_license_revoke"
    const val ADMIN_LICENSE_CAPABILITY = "${PREFIX}_license_capability"
    const val ADMIN_LICENSE_CAPABILITY_LIST = "${PREFIX}_license_capability_list"
    const val ADMIN_LICENSE_CAPABILITY_ADD = "${PREFIX}_license_capability_add"
    const val ADMIN_LICENSE_CAPABILITY_REMOVE = "${PREFIX}_license_capability_remove"


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