package me.znepb.chatbox

import kotlinx.datetime.Clock
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import me.znepb.chatbox.commands.CBAdminCommand
import me.znepb.chatbox.commands.CBSpyCommand
import me.znepb.chatbox.commands.LicenseCommand
import net.fabricmc.api.DedicatedServerModInitializer
import net.fabricmc.fabric.api.command.v2.ArgumentTypeRegistry
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents
import net.fabricmc.fabric.api.message.v1.ServerMessageEvents
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents
import net.minecraft.command.argument.UuidArgumentType
import net.minecraft.command.argument.serialize.ConstantArgumentSerializer
import net.minecraft.server.MinecraftServer
import net.minecraft.util.Identifier
import org.slf4j.LoggerFactory
import java.net.http.HttpClient
import java.util.function.Supplier


object Chatbox : DedicatedServerModInitializer {
    val logger = LoggerFactory.getLogger("chatbox")
	val client = HttpClient.newHttpClient()
	var server: MinecraftServer? = null
	val config = ChatboxConfig()
	var websocket = Websocket()

	internal class ServerTickListener : ServerTickEvents.EndTick {
		override fun onEndTick(minecraftServer: MinecraftServer) {
			server = minecraftServer
		}
	}

	override fun onInitializeServer() {
		websocket.connect()

		ServerTickEvents.END_SERVER_TICK.register(ServerTickListener())

		CommandRegistrationCallback.EVENT.register { dispatcher, registryAccess, environment ->
			LicenseCommand.register(dispatcher)
			CBSpyCommand.register(dispatcher)
			CBAdminCommand.register(dispatcher)
		}

		ServerMessageEvents.ALLOW_CHAT_MESSAGE.register { message, sender, params ->
			val shouldAllow = !message.content.string.startsWith("\\")

			if(!shouldAllow) {
				val map = mutableMapOf<String, JsonElement>()
				map["sentBy"] = JsonPrimitive(sender.uuidAsString!!)
				map["message"] = JsonPrimitive(message.content.string)
				map["username"] = JsonPrimitive(sender.name.string)
				map["timestamp"] = JsonPrimitive(Clock.System.now().toEpochMilliseconds())

				websocket.sendWebsocketRequest("dispatch-command", JsonObject(map))
			}

			shouldAllow
		}

		ServerMessageEvents.CHAT_MESSAGE.register { message, sender, params ->
			val map = mutableMapOf<String, JsonElement>()
			map["sentBy"] = JsonPrimitive(sender.uuidAsString!!)
			map["message"] = JsonPrimitive(message.content.string)
			map["username"] = JsonPrimitive(sender.name.string)
			map["timestamp"] = JsonPrimitive(Clock.System.now().toEpochMilliseconds())

			websocket.sendWebsocketRequest("dispatch-message", JsonObject(map))
		}

		ServerPlayConnectionEvents.JOIN.register { handler, sender, server ->
			val map = mutableMapOf<String, JsonElement>()
			map["sentBy"] = JsonPrimitive(handler.player.uuidAsString)
			map["username"] = JsonPrimitive(handler.player.displayName.string)
			map["timestamp"] = JsonPrimitive(Clock.System.now().toEpochMilliseconds())

			websocket.sendWebsocketRequest("dispatch-join", JsonObject(map))
		}

		ServerPlayConnectionEvents.DISCONNECT.register { handler, server ->
			val map = mutableMapOf<String, JsonElement>()
			map["sentBy"] = JsonPrimitive(handler.player.uuidAsString)
			map["username"] = JsonPrimitive(handler.player.displayName.string)
			map["timestamp"] = JsonPrimitive(Clock.System.now().toEpochMilliseconds())

			websocket.sendWebsocketRequest("dispatch-leave", JsonObject(map))
		}
	}
}