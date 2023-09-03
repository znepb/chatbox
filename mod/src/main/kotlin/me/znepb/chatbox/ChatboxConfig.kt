package me.znepb.chatbox

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import net.fabricmc.loader.api.FabricLoader
import javax.naming.ConfigurationException
import kotlin.io.path.Path
import kotlin.io.path.exists
import kotlin.io.path.readText
import kotlin.io.path.writeText

class ChatboxConfig {
    companion object {
        val defaultConfig = """
            {
                "httpEndpoint": "http://127.0.0.1:3000",
                "wsEndpoint": "ws://127.0.0.1:8080",
                "wsMaxConnectionAttempts": 10,
                "wsReconnectInterval": 5,
                "remoteAuthToken": "1234"
            }
        """.trimIndent()
    }

    private var httpEndpoint: String
    private var wsEndpoint: String
    private var wsMaxConnectionAttempts: Int
    private var wsReconnectInterval: Int
    private var remoteAuthToken: String

    fun getHttpEndpoint() = httpEndpoint
    fun getWsEndpoint() = wsEndpoint
    fun getWsMaxConnectionAttempts() = wsMaxConnectionAttempts
    fun getWsReconnectInterval() = wsReconnectInterval
    fun getRemoteAuthToken() = remoteAuthToken

    init {
        val path = Path("${FabricLoader.getInstance().configDir}/chatbox.json")
        Chatbox.logger.info(path.toString());
        val content = if(path.exists()) path.readText() else defaultConfig
        val json = Json.parseToJsonElement(content)

        val remoteAuthToken = json.jsonObject["remoteAuthToken"]?.jsonPrimitive?.content
        val httpEndpoint = json.jsonObject["httpEndpoint"]?.jsonPrimitive?.content
        val wsEndpoint = json.jsonObject["wsEndpoint"]?.jsonPrimitive?.content
        val wsMaxConnectionAttempts = json.jsonObject["wsMaxConnectionAttempts"]?.jsonPrimitive?.content
        val wsReconnectInterval = json.jsonObject["wsReconnectInterval"]?.jsonPrimitive?.content

        if(remoteAuthToken == null) throw ConfigurationException("Could not find config entry remoteAuthToken")
        if(httpEndpoint == null) throw ConfigurationException("Could not find config entry httpEndpoint")
        if(wsEndpoint == null) throw ConfigurationException("Could not find config entry wsEndpoint")
        if(wsMaxConnectionAttempts == null) throw ConfigurationException("Could not find config entry wsMaxConnectionAttempts")
        if(wsReconnectInterval == null) throw ConfigurationException("Could not find config entry wsReconnectInterval")

        this.remoteAuthToken = remoteAuthToken
        this.httpEndpoint = httpEndpoint
        this.wsEndpoint = wsEndpoint
        this.wsMaxConnectionAttempts = wsMaxConnectionAttempts.toInt()
        this.wsReconnectInterval = wsReconnectInterval.toInt()

        path.writeText(content)
    }
}