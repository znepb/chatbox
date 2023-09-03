package me.znepb.chatbox.commands

import com.mojang.brigadier.Command
import com.mojang.brigadier.Command.SINGLE_SUCCESS
import com.mojang.brigadier.CommandDispatcher
import com.mojang.brigadier.arguments.StringArgumentType.*
import com.mojang.brigadier.builder.RequiredArgumentBuilder.argument
import com.mojang.brigadier.context.CommandContext
import com.mojang.datafixers.DSL.optional
import kotlinx.serialization.json.*
import me.lucko.fabric.api.permissions.v0.Permissions
import me.znepb.chatbox.Chatbox
import me.znepb.chatbox.ChatboxPermissions
import me.znepb.chatbox.HttpRequests
import me.znepb.chatbox.HttpRequests.makeServerDeleteRequest
import me.znepb.chatbox.HttpRequests.makeServerPostRequest
import me.znepb.chatbox.HttpRequests.makeServerPutRequest
import me.znepb.chatbox.Websocket
import net.minecraft.server.command.CommandManager
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.Text
import net.minecraft.util.Formatting

object CBAdminCommand {
    fun register(dispatcher: CommandDispatcher<ServerCommandSource>) {
        dispatcher.register(
            CommandManager.literal("cbadmin")
                .requires(Permissions.require(ChatboxPermissions.ADMIN, 3))
                .then(
                    CommandManager.literal("websocket")
                        .requires(Permissions.require(ChatboxPermissions.ADMIN_WEBSOCKET, 3))
                        .then(CommandManager.literal("reconnect")
                            .requires(Permissions.require(ChatboxPermissions.ADMIN_WEBSOCKET_RECONNECT, 3))
                            .executes { wsReconnect(it) })
                        .then(CommandManager.literal("status")
                            .requires(Permissions.require(ChatboxPermissions.ADMIN_WEBSOCKET_STATUS, 3))
                            .executes { wsStatus(it) })
                    )
                .then(CommandManager.literal("ban")
                    .requires(Permissions.require(ChatboxPermissions.ADMIN_BAN, 3))
                    .then(argument<ServerCommandSource, String>("uuid", string())
                        .then(argument<ServerCommandSource, String>("date", string())
                            .executes { banUser(it, getString(it, "uuid"), getString(it, "date")) }
                        )
                        .executes { banUser(it, getString(it, "uuid"), null) }
                    )
                )
                .then(CommandManager.literal("unban")
                    .requires(Permissions.require(ChatboxPermissions.ADMIN_UNBAN, 3))
                    .then(argument<ServerCommandSource, String>("uuid", string())
                        .executes { unbanUser(it, getString(it, "uuid")) }
                    )
                )
                .then(
                    CommandManager.literal("license")
                        .requires(Permissions.require(ChatboxPermissions.ADMIN_LICENSE, 3))
                        .then(CommandManager.literal("revoke")
                            .requires(Permissions.require(ChatboxPermissions.ADMIN_LICENSE_REVOKE, 3))
                            .then(argument<ServerCommandSource, String>("username|uuid", string())
                                .executes { licenseRevoke(it, getString(it, "username|uuid")) }
                            )
                        )
                        .then(CommandManager.literal("capabilities")
                            .requires(Permissions.require(ChatboxPermissions.ADMIN_LICENSE_CAPABILITY, 3))
                            .then(CommandManager.literal("list")
                                .requires(Permissions.require(ChatboxPermissions.ADMIN_LICENSE_CAPABILITY_LIST, 3))
                                .then(argument<ServerCommandSource, String>("username|uuid", string())
                                    .executes { licenseCapabilitiesList(it, getString(it, "username|uuid")) }
                                )
                            )
                            .then(CommandManager.literal("add")
                                .requires(Permissions.require(ChatboxPermissions.ADMIN_LICENSE_CAPABILITY_ADD, 3))
                                .then(argument<ServerCommandSource, String>("username|uuid", string())
                                    .then(argument<ServerCommandSource, String>("capability", string())
                                        .suggests(CapabilitySuggestionProvider())
                                        .executes {
                                            licenseCapabilitesAdd(
                                                it,
                                                getString(it, "username|uuid"),
                                                getString(it, "capability")
                                            )
                                        }
                                    )
                                )
                            )
                            .then(CommandManager.literal("remove")
                                .requires(Permissions.require(ChatboxPermissions.ADMIN_LICENSE_CAPABILITY_REMOVE, 3))
                                .then(argument<ServerCommandSource, String>("username|uuid", string())
                                    .then(argument<ServerCommandSource, String>("capability", string())
                                        .suggests(CapabilitySuggestionProvider())
                                        .executes {
                                            licenseCapabilitesDelete(
                                                it,
                                                getString(it, "username|uuid"),
                                                getString(it, "capability")
                                            )
                                        }
                                    )
                                )
                            )
                        )
                )
        )
    }

    fun getLicenseID(id: String, ctx: CommandContext<ServerCommandSource>): String? {
        if(id.matches(Regex("^[0-9a-fA-F]{8}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{4}\\b-[0-9a-fA-F]{12}\$"))) {
            val licenseID = HttpRequests.getUsersLicense(id)

            if(!licenseID.success && licenseID.error == 404) {
                ctx.source.sendMessage(Text.literal("Could not find a license owned by ${id}.")
                    .formatted(Formatting.RED))
                return null
            } else if(!licenseID.success) {
                ctx.source.sendMessage(Text.literal("Could not find license.").formatted(Formatting.RED))
                return null
            }

            return licenseID.license
        } else {
            val licenseID = HttpRequests.getUsersLicense(id)
            if(!licenseID.success && licenseID.error == 404) {
                ctx.source.sendMessage(Text.literal("Could not find a license owned by ${id}.")
                    .formatted(Formatting.RED))
                return null
            } else if(!licenseID.success && licenseID.error == 409) {
                ctx.source.sendMessage(
                    Text.literal(
                        "Could not find a license owned by ${id}. There may" +
                                "be multiple licenses under this username. If this is the case, use a UUID instead."
                    )
                        .formatted(Formatting.RED)
                )
                return null
            } else if(!licenseID.success) {
                ctx.source.sendMessage(Text.literal("Could not find license.").formatted(Formatting.RED))
                return null
            }

            return licenseID.license
        }
    }

    fun wsReconnect(ctx: CommandContext<ServerCommandSource>): Int {
        if(Chatbox.websocket.getConnectionStatus() == Websocket.ConnectionStatus.DISCONNECTED) {
            ctx.source.sendMessage(Text.literal("Attempting to connect...")
                .formatted(Formatting.AQUA))
            Chatbox.websocket.addSourceToNotify(ctx)
            Chatbox.websocket.connect()
        } else {
            ctx.source.sendMessage(Text.literal("Websocket is already connected or currently connecting!")
                .formatted(Formatting.RED))
        }

        return SINGLE_SUCCESS
    }

    fun wsStatus(ctx: CommandContext<ServerCommandSource>): Int {
        ctx.source.sendMessage(
            Text.literal("Connection Status: ").formatted(Formatting.AQUA)
                .append(when(Chatbox.websocket.getConnectionStatus()) {
                    Websocket.ConnectionStatus.CONNECTED -> Text.literal("connected").formatted(Formatting.GREEN)
                    Websocket.ConnectionStatus.CONNECTING -> Text.literal("connecting").formatted(Formatting.YELLOW)
                    Websocket.ConnectionStatus.DISCONNECTED -> Text.literal("disconnected").formatted(Formatting.RED)
                })
        )
        return SINGLE_SUCCESS
    }

    fun banUser(ctx: CommandContext<ServerCommandSource>, id: String, until: String?): Int {
        var body = JsonObject(mapOf())

        if(until != null) {
            var map = mutableMapOf<String, JsonElement>()
            map["until"] = JsonArray(listOf(JsonPrimitive(until)))
            body = JsonObject(map)
        }

        val result = makeServerPostRequest("/users/${id}/ban", body.toString())

        if(result != null && result.statusCode() == 200) {
            if(until != null) {
                ctx.source.sendMessage(
                    Text.literal("Successfully banned $id until $until.")
                        .formatted(Formatting.GREEN)
                )
            } else {
                ctx.source.sendMessage(
                    Text.literal("Successfully banned $id permanently.")
                        .formatted(Formatting.GREEN)
                )
            }
        } else {
            ctx.source.sendMessage(Text.literal("Could not ban user" +
                    if(result == null) "" else " HTTP status ${result.statusCode()}").formatted(Formatting.RED))
        }

        return SINGLE_SUCCESS
    }

    fun unbanUser(ctx: CommandContext<ServerCommandSource>, id: String): Int {
        val result = makeServerPostRequest("/users/${id}/unban", JsonObject(mapOf()).toString())

        if(result != null && result.statusCode() == 200) {
            ctx.source.sendMessage(
                Text.literal("Successfully unbanned $id.")
                    .formatted(Formatting.GREEN)
            )
        } else {
            ctx.source.sendMessage(Text.literal("Could not unban user" +
                    if(result == null) "" else " HTTP status ${result.statusCode()}").formatted(Formatting.RED))
        }

        return SINGLE_SUCCESS
    }

    fun licenseRevoke(ctx: CommandContext<ServerCommandSource>, id: String): Int {
        val licenseID = getLicenseID(id, ctx) ?: return SINGLE_SUCCESS

        val result = makeServerDeleteRequest("/licenses/${licenseID}")

        if(result != null && result.statusCode() == 204) {
            ctx.source.sendMessage(Text.literal("Successfully revoked license ID $licenseID ($id).")
                .formatted(Formatting.GREEN))
        } else {
            ctx.source.sendMessage(Text.literal("Could not revoke license" +
                    if(result == null) "" else " HTTP status ${result.statusCode()}").formatted(Formatting.RED))
        }

        return SINGLE_SUCCESS
    }

    fun licenseCapabilitiesList(ctx: CommandContext<ServerCommandSource>, id: String): Int {
        val licenseID = getLicenseID(id, ctx) ?: return SINGLE_SUCCESS

        val license =
            HttpRequests.makeServerGetRequest("/licenses/${licenseID}") ?: return SINGLE_SUCCESS
        val data = Json.parseToJsonElement(license.body()).jsonObject

        val capabilities = data["capabilities"]?.jsonArray ?: return SINGLE_SUCCESS

        ctx.source.sendMessage(
            Text.literal("License ID $licenseID ($id) has the following capabilities: ")
                .formatted(Formatting.AQUA)
            .append(Text.literal(capabilities.joinToString(", ").replace("\"", ""))
                .formatted(Formatting.YELLOW)
            )
        )

        return SINGLE_SUCCESS
    }

    fun licenseCapabilitesAdd(ctx: CommandContext<ServerCommandSource>, id: String, capability: String): Int {
        val licenseID = getLicenseID(id, ctx) ?: return SINGLE_SUCCESS

        val map = mutableMapOf<String, JsonElement>()
        map["capabilities"] = JsonArray(listOf(JsonPrimitive(capability)))

        val response = makeServerPutRequest("/licenses/${licenseID}/capabilities", JsonObject(map).toString())

        if(response?.statusCode() == 200) {
            ctx.source.sendMessage(
                Text.literal("Successfully added capability $capability to license ID $licenseID ($id).")
                    .formatted(Formatting.AQUA)
            )
        } else {
            ctx.source.sendMessage(
                Text.literal("Failed to add $capability to license ID $licenseID ($id): HTTP Status ${response?.statusCode()}")
                    .formatted(Formatting.AQUA)
            )
        }

        return SINGLE_SUCCESS
    }

    fun licenseCapabilitesDelete(ctx: CommandContext<ServerCommandSource>, id: String, capability: String): Int {
        val licenseID = getLicenseID(id, ctx) ?: return SINGLE_SUCCESS

        val response = makeServerDeleteRequest("/licenses/${licenseID}/capabilities/${capability}")

        if(response?.statusCode() == 200) {
            ctx.source.sendMessage(
                Text.literal("Successfully removed capability $capability from license ID $licenseID ($id).")
                    .formatted(Formatting.AQUA)
            )
        } else {
            ctx.source.sendMessage(
                Text.literal("Failed to remove $capability from license ID $licenseID ($id): HTTP Status ${response?.statusCode()}")
                    .formatted(Formatting.AQUA)
            )
        }

        return SINGLE_SUCCESS
    }
}