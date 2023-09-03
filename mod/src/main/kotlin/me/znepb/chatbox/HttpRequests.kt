package me.znepb.chatbox

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import me.znepb.chatbox.Chatbox.logger
import java.net.URI
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.concurrent.CompletableFuture

object HttpRequests {
    class LicenseOwnerResponse(val success: Boolean, val owner: String?, val error: Int?)

    fun getLicenseOwner(id: String): LicenseOwnerResponse {
        val request = makeServerGetRequest("/licenses/${id}")

        return if(request?.statusCode() == 200) {
            val json = Json.parseToJsonElement(request.body())
            LicenseOwnerResponse(true, json.jsonObject["userId"]?.jsonPrimitive?.content, null)
        } else if(request != null) {
            LicenseOwnerResponse(false, null, request.statusCode())
        } else {
            LicenseOwnerResponse(false, null, null)
        }
    }

    class UsersLicenseResponse(val success: Boolean, val license: String?, val error: Int?)
    fun getUsersLicense(id: String): UsersLicenseResponse {
        val request = makeServerGetRequest("/users/${id}/license")

        return if(request?.statusCode() == 200) {
            val json = Json.parseToJsonElement(request.body())
            UsersLicenseResponse(true, json.jsonObject["licenseId"]?.jsonPrimitive?.content, null)
        } else if(request != null) {
            UsersLicenseResponse(false, null, request.statusCode())
        } else {
            UsersLicenseResponse(false, null, null)
        }
    }

    fun makeServerPutRequest(endpoint: String, json: String): HttpResponse<String>? {
        return try {
            val request = HttpRequest.newBuilder()
                .uri(URI.create("${Chatbox.config.getHttpEndpoint()}${endpoint}"))
                .PUT(HttpRequest.BodyPublishers.ofString(json))
                .setHeader("Content-Type", "application/json")
                .setHeader("Authorization", "Bearer ${Chatbox.config.getRemoteAuthToken()}")
                .build()

            val futureResponse: CompletableFuture<HttpResponse<String>> =
                Chatbox.client.sendAsync(request, HttpResponse.BodyHandlers.ofString())

            futureResponse.get()
        } catch(e: Exception) {
            logger.warn("Unable to make PUT request! \nurl: $endpoint \nbody: $json \nexception: $e")
            null
        }
    }

    fun makeServerPostRequest(endpoint: String, json: String): HttpResponse<String>? {
        return try {
            val request = HttpRequest.newBuilder()
                .uri(URI.create("${Chatbox.config.getHttpEndpoint()}${endpoint}"))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .setHeader("Content-Type", "application/json")
                .setHeader("Authorization", "Bearer ${Chatbox.config.getRemoteAuthToken()}")
                .build()

            val futureResponse: CompletableFuture<HttpResponse<String>> =
                Chatbox.client.sendAsync(request, HttpResponse.BodyHandlers.ofString())

            futureResponse.get()
        } catch(e: Exception) {
            logger.warn("Unable to make POST request! \nurl: $endpoint \nbody: $json \nexception: $e")
            null
        }
    }

    fun makeServerDeleteRequest(endpoint: String): HttpResponse<String>? {
        return try {
            val request = HttpRequest.newBuilder()
                .uri(URI.create("${Chatbox.config.getHttpEndpoint()}$endpoint"))
                .DELETE()
                .setHeader("Authorization", "Bearer ${Chatbox.config.getRemoteAuthToken()}")
                .build()

            val futureResponse: CompletableFuture<HttpResponse<String>> =
                Chatbox.client.sendAsync(request, HttpResponse.BodyHandlers.ofString())

            futureResponse.get()
        } catch(e: Exception) {
            logger.warn("Unable to make DELETE request! \nurl: $endpoint \nexception: $e")
            null
        }
    }

    fun makeServerGetRequest(endpoint: String): HttpResponse<String>? {
        return try {
            val request = HttpRequest.newBuilder()
                .uri(URI.create("${Chatbox.config.getHttpEndpoint()}$endpoint"))
                .GET()
                .setHeader("Authorization", "Bearer ${Chatbox.config.getRemoteAuthToken()}")
                .build()

            val futureResponse: CompletableFuture<HttpResponse<String>> =
                Chatbox.client.sendAsync(request, HttpResponse.BodyHandlers.ofString())

            futureResponse.get()
        } catch(e: Exception) {
            logger.warn("Unable to make POST request! \nurl: $endpoint \nexception: $e")
            null
        }
    }
}