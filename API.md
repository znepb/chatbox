# HTTP/WS documentation

Currently, only non-server endpoints are documented. 

## Shared
### Index
HTTP Endpoint: `/`
HTTP Method: `any`
WS action: (empty string)

Returns some basic information about the server.

### `POST /say`, `say`
Broadcasts a message to every player on the server. Formatting can be one
of `format`, `markdown` or `json`. Hide Prefix hides the prefix, and the CB
message prefix. Requires authorization.
Example body / data:
```json
{
  "message": "**Hello there!** This is a message that was broadcasted with the `say` endpoint.",
  "formatting": "markdown",
  "prefix": "Broadcast Message",
  "hidePrefix": false
}
```

### `POST /tell`, `tell`
Sends a message to a specific player on the server. Formatting can be one
of `format`, `markdown` or `json`. Hide Prefix hides the prefix, and the CB
message prefix. Requires authorization.
Example body / data:
```json
{
  "user": "Herobrine",
  "message": "**Hello Herobrine!** ||You really scare me.||",
  "formatting": "markdown",
  "prefix": "Tell Message",
  "hidePrefix": false
}
```

### `GET /list-players`, `list-players`
Lists all players currently online on the server.
Example response body / data:
```json
[
  "znepb",
  "Notch",
  "dan200"
]
```

## HTTP-exclusive endpoints
### GET `/start-ws`
Requires a Bearer authorization header with your License ID. Returns a 
JSON object with the websocket session ID and when that id expires, in
milliseconds.
Example response: 
```json
{
  "id": "26da25b1-e9dd-4e4b-93af-6ec795bff637",
  "expires": 1000000000000
}
```