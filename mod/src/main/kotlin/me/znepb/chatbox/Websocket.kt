package me.znepb.chatbox

import com.mojang.brigadier.context.CommandContext
import me.znepb.chatbox.Chatbox.logger
import java.net.http.WebSocket
import java.util.concurrent.CompletionStage
import kotlinx.serialization.json.*
import me.znepb.chatbox.Chatbox.server
import net.fabricmc.api.EnvType
import net.fabricmc.api.Environment
import net.minecraft.server.command.ServerCommandSource
import net.minecraft.text.Text
import net.minecraft.util.Formatting
import java.net.URI
import java.util.*
import java.util.concurrent.CompletableFuture
import kotlin.concurrent.schedule

@Environment(EnvType.SERVER)
class Websocket : WebSocket.Listener {
    private var currentReconnectionAttempts = 0
    private var websocket: CompletableFuture<WebSocket>? = null
    private var connectionStatus = ConnectionStatus.DISCONNECTED
    private var schedule: TimerTask? = null
    private var sourcesToNotify: MutableList<CommandContext<ServerCommandSource>> = mutableListOf()

    enum class ConnectionStatus {
        CONNECTING,
        CONNECTED,
        DISCONNECTED;
    }

    fun getConnectionStatus() = connectionStatus

    fun addSourceToNotify(source: CommandContext<ServerCommandSource>) {
        sourcesToNotify.add(source)
    }

    fun sendWebsocketRequest(action: String, data: JsonObject) {
        val map = mutableMapOf<String, JsonElement>()
        map["action"] = JsonPrimitive(action)
        map["type"] = JsonPrimitive("REQ")
        map["data"] = data

        this.websocket?.get()?.sendText(JsonObject(map).toString(), true)
    }

    fun respond(json: JsonElement, data: JsonElement) {
        val action = json.jsonObject["action"]?.jsonPrimitive?.content

        if(action != null) {
            val map = mutableMapOf<String, JsonElement>()
            map["action"] = JsonPrimitive(action)
            map["type"] = JsonPrimitive("RES")
            map["data"] = data

            this.websocket?.get()?.sendText(JsonObject(map).toString(), true)
        }
    }

    private fun notifySources(message: Text) {
        this.sourcesToNotify.forEach {
            it.source.sendMessage(message)
        }
        sourcesToNotify.clear()
    }

    override fun onOpen(webSocket: WebSocket) {
        logger.info("Websocket connected!")
        currentReconnectionAttempts = 0
        this.connectionStatus = ConnectionStatus.CONNECTED
        notifySources(Text.literal("Websocket successfully connected!").formatted(Formatting.GREEN))

        super.onOpen(webSocket)
    }

    override fun onError(webSocket: WebSocket?, error: Throwable?) {
        logger.warn("Websocket error! $error")
        this.connectionStatus = ConnectionStatus.DISCONNECTED

        Timer().schedule(2000) {
            connect()
        }

        super.onError(webSocket, error)
    }

    override fun onClose(webSocket: WebSocket?, statusCode: Int, reason: String?): CompletionStage<*>? {
        logger.warn("Websocket closed")
        this.connectionStatus = ConnectionStatus.DISCONNECTED

        Timer().schedule(2000) {
            connect()
        }

        return super.onClose(webSocket, statusCode, reason)
    }

    override fun onText(webSocket: WebSocket, data: CharSequence, last: Boolean): CompletionStage<*>? {
        val jsonData = Json.parseToJsonElement(data.toString())

        try {
            if (jsonData.jsonObject["type"]?.jsonPrimitive?.content == "REQ") {
                val packetData = jsonData.jsonObject["data"]?.jsonObject?.jsonObject

                if(packetData != null)  {
                    when (jsonData.jsonObject["action"]?.jsonPrimitive?.content) {
                        "get-online-players" -> {
                            var map = mutableListOf<JsonPrimitive>()

                            if (server != null) {
                                server!!.playerNames.forEach {
                                    map.add(JsonPrimitive(it))
                                }
                            }

                            respond(jsonData, JsonArray(map))
                        }

                        "send-message" -> {
                            val message = packetData["message"]?.jsonArray
                            val player = packetData["player"]?.jsonPrimitive

                            if (server != null && message != null && player != null) {
                                server!!.playerManager.getPlayer(player.content)?.sendMessage(
                                    Text.Serializer.fromJson(message.toString()),
                                    false
                                )
                            }
                        }
                    }
                }
            }
        } catch(e: Exception) {
            logger.warn("Failed to read packet: $e")
        }

        return super.onText(webSocket, data, last);
    }

    fun connect() {
        this.schedule?.cancel()

        try {
            this.connectionStatus = ConnectionStatus.CONNECTING
            this.websocket = Chatbox.client.newWebSocketBuilder()
                .header("authorization", "Bearer ${Chatbox.config.getRemoteAuthToken()}")
                .buildAsync(URI(Chatbox.config.getWsEndpoint()), this)

            logger.info("Chatbox WS attempting to connect (attempt number ${this.currentReconnectionAttempts})")
            this.websocket!!.get().sendText("""{ type: "REQ", action: "hello", data: {} }""", true)
        } catch (e: Exception) {
            notifySources(Text.literal("Failed to connect to websocket!").formatted(Formatting.RED))
            this.connectionStatus = ConnectionStatus.DISCONNECTED

            if (this.currentReconnectionAttempts > Chatbox.config.getWsMaxConnectionAttempts()) {
                logger.error("Connection failed. Will no longer attempt to reconnect until /cbadmin reconnect is ran.")
                return
            }

            logger.info("Failed to reconnect: $e, trying again")
            this.currentReconnectionAttempts++

            this.schedule = Timer().schedule((Chatbox.config.getWsReconnectInterval() * 1000).toLong()) {
                connect()
            }
        }
    }
}