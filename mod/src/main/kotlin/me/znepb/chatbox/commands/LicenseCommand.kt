package me.znepb.chatbox.commands

import com.mojang.brigadier.CommandDispatcher
import com.mojang.brigadier.context.CommandContext
import kotlinx.serialization.json.*
import me.lucko.fabric.api.permissions.v0.Permissions
import me.znepb.chatbox.Chatbox
import me.znepb.chatbox.Chatbox.logger
import me.znepb.chatbox.ChatboxPermissions
import me.znepb.chatbox.HttpRequests
import me.znepb.chatbox.HttpRequests.makeServerDeleteRequest
import net.minecraft.server.command.CommandManager
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.ClickEvent
import net.minecraft.text.HoverEvent
import net.minecraft.text.Style
import net.minecraft.text.Text
import net.minecraft.util.Formatting
import java.lang.Exception

object LicenseCommand {
    fun register(dispatcher: CommandDispatcher<ServerCommandSource>) {
        dispatcher.register(
            CommandManager.literal("license")
                .requires(Permissions.require(ChatboxPermissions.LICENSE, 0))
                .executes { noargs(it) }
                .then(
                    CommandManager.literal("register")
                        .requires(Permissions.require(ChatboxPermissions.LICENSE_REGISTER, 0))
                        .executes { register(it) }
                )
                .then(
                    CommandManager.literal("unregister")
                        .requires(Permissions.require(ChatboxPermissions.LICENSE_UNREGISTER, 0))
                        .executes { remove(it) }
                )
        )
    }

    private fun createLicenseInfoMessage(id: String, capabilities: JsonArray): Text {
        return Text.literal("Your license ID is ").formatted(Formatting.AQUA)
            .append(Text.literal(id.replace("\"", "")).setStyle(
                Style.EMPTY
                    .withClickEvent(ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, id.replace("\"", "")))
                    .withHoverEvent(HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("Click to copy")))
                    .withColor(Formatting.YELLOW)
            ))
            .append(Text.literal(".\n It has the following capabilities: ").setStyle(
                Style.EMPTY.withColor(Formatting.AQUA)
            ))
            .append(Text.literal(capabilities.joinToString(", ").replace("\"", "")).setStyle(
                Style.EMPTY.withColor(Formatting.YELLOW)
            )).append(Text.literal(".\n You can remove your license at any time with ").setStyle(
                Style.EMPTY.withColor(Formatting.AQUA)
            )).append(Text.literal("/license unregister").setStyle(
                Style.EMPTY
                    .withClickEvent(ClickEvent(ClickEvent.Action.SUGGEST_COMMAND, "/license unregister"))
                    .withHoverEvent(HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("Click to suggest")))
                    .withColor(Formatting.YELLOW)
            )).append(Text.literal(".").setStyle(
                Style.EMPTY.withColor(Formatting.AQUA)
            ))
    }

    fun noargs(ctx: CommandContext<ServerCommandSource>): Int {
        val license =
            HttpRequests.makeServerGetRequest("/licenses/${ctx.source.player?.uuidAsString}")

        if(license == null) {
            ctx.source.sendMessage(
                Text.literal("Failed to contact server. Please try again later. If the problem persists, contact an admin.")
                    .formatted(Formatting.RED)
            )
        } else if(license.statusCode() == 404) {
            ctx.source.sendMessage(
                Text.literal("You don't have a chatbox license! Run /license register to create one.")
                    .formatted((Formatting.RED))
            )
        } else {
            val data = Json.parseToJsonElement(license.body()).jsonObject

            val id = data["id"].toString()
            val capabilities = data["capabilities"]?.jsonArray

            if (capabilities != null) {
                ctx.source.sendMessage(createLicenseInfoMessage(id, capabilities))
            }
        }

        return 1
    }

    fun remove(ctx: CommandContext<ServerCommandSource>): Int {
        val response = makeServerDeleteRequest("/licenses/uuid/${ctx.source.player?.uuidAsString}")

        ctx.source.sendMessage(when(response?.statusCode()) {
            204 -> Text.literal("License removed successfully!")
                .formatted((Formatting.GREEN))
            404 -> Text.literal("You don't have a chatbox license! Run /license register to create one.")
                .formatted((Formatting.RED))
            else -> Text.literal("Failed to remove license.")
                .formatted((Formatting.RED))
        })

        return 1
    }

    fun revokeUUID(ctx: CommandContext<ServerCommandSource>): Int {
        return 1
    }

    fun revokeUsername(ctx: CommandContext<ServerCommandSource>): Int {
        return 1
    }

    fun register(ctx: CommandContext<ServerCommandSource>): Int {
        try {
            val license =
                HttpRequests.makeServerGetRequest("/licenses/${ctx.source.player?.uuidAsString}")

            if(license == null) {
                ctx.source.sendMessage(
                    Text.literal("Failed to contact server. Please try again later. If the problem persists, contact an admin.")
                        .formatted(Formatting.RED)
                )
            } else if (license.statusCode() != 404) {
                ctx.source.sendMessage(
                    Text.literal("You already have a license! Run /license to see your license token.")
                        .formatted((Formatting.RED))
                )
            } else {
                val map = mutableMapOf<String, JsonElement>()
                map["user"] = JsonPrimitive(ctx.source.player?.uuidAsString!!)
                val json = JsonObject(map)

                val response = HttpRequests.makeServerPostRequest("/licenses", json.toString())

                logger.info(response?.statusCode().toString())

                if(response == null) {
                    ctx.source.sendMessage(
                        Text.literal("Failed to contact server. Please try again later. If the problem persists, contact an admin.")
                            .formatted(Formatting.RED)
                    )
                } else if(response.statusCode() != 201) {
                    val data = Json.parseToJsonElement(response.body()).jsonObject

                    ctx.source.sendMessage(
                        Text.literal(data["error"]?.jsonPrimitive?.contentOrNull ?: "Unexpected error").formatted(Formatting.RED)
                    )
                } else {
                    val data = Json.parseToJsonElement(response.body()).jsonObject

                    val id = data["id"].toString()
                    val capabilities = data["capabilities"]?.jsonArray

                    if (capabilities != null) {
                        ctx.source.sendMessage(
                            Text.literal("Successfully created a new license! ").formatted(Formatting.GREEN)
                                .append(createLicenseInfoMessage(id, capabilities))
                        )
                    }
                }
            }
        } catch(e: Exception) {
            ctx.source.sendMessage(
                Text.literal("Failed to register license. Please try again later. If the problem persists, contact an admin.")
                    .formatted(Formatting.RED)
            )
            logger.info("Failed to register license! $e")
        }

        return 1
    }
}