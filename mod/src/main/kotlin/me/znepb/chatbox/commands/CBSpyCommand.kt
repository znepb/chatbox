package me.znepb.chatbox.commands

import com.mojang.brigadier.CommandDispatcher
import kotlinx.serialization.json.*
import me.lucko.fabric.api.permissions.v0.Permissions
import me.znepb.chatbox.ChatboxPermissions
import me.znepb.chatbox.HttpRequests
import net.minecraft.server.command.CommandManager
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.Text
import net.minecraft.util.Formatting

object CBSpyCommand {
    fun register(dispatcher: CommandDispatcher<ServerCommandSource>) {
        dispatcher.register(
            CommandManager.literal("cbspy")
                .requires(Permissions.require(ChatboxPermissions.SPY, 2))
                .executes {
                    val license =
                        HttpRequests.makeServerGetRequest("/licenses/${it.source.player?.uuidAsString}")

                    if(license == null) {
                        it.source.sendMessage(
                            Text.literal("Failed to contact server. Please try again later. If the problem persists, contact an admin.")
                                .formatted(Formatting.RED)
                        )
                    } else if(license.statusCode() == 404) {
                        it.source.sendMessage(
                            Text.literal("You must have a chatbox license to enable chatbox spy.")
                                .formatted((Formatting.RED))
                        )
                    } else {
                        val body = mutableMapOf<String, JsonElement>()
                        body["user"] = JsonPrimitive(it.source.player!!.uuidAsString)

                        val data =
                            HttpRequests.makeServerPostRequest("/toggle-cbspy", JsonObject(body).toString())

                        if(data == null) {
                            it.source.sendMessage(
                                Text.literal("Failed to contact server. Please try again later. If the problem persists, contact an admin.")
                                    .formatted(Formatting.RED)
                            )
                        } else {
                            val enabled = Json.parseToJsonElement(data.body()).jsonObject["cbspyEnabled"]

                            if (enabled == JsonPrimitive(true)) {
                                it.source.sendMessage(
                                    Text.literal("Successfully enrolled in command spying.")
                                        .formatted((Formatting.AQUA))
                                )
                            } else {
                                it.source.sendMessage(
                                    Text.literal("Successfully un-enrolled in command spying.")
                                        .formatted((Formatting.AQUA))
                                )
                            }
                        }
                    }

                    1
                }
        )
    }
}