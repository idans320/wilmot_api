export default {
    "$schema": "http://json-schema.org/draft-07/schema",
    "$id": "data_service.json",
    "type": "object",
    "title": "data service schema",
    "description": "The data schema.",
    "default": {},
    "examples": [
        {
            "route": "/",
            "name": "sample object",
            "data": {}
        }
    ],
    "required": [
        "route",
        "name",
        "data"
    ],
    "properties": {
        "route": {
            "$id": "#/properties/route",
            "type": "string",
            "title": "The route schema",
            "description": "Set the route for the service",
            "default": "",
            "examples": [
                "/"
            ]
        },
        "name": {
            "$id": "#/properties/name",
            "type": "string",
            "title": "The service name",
            "description": ".",
            "default": "",
            "examples": [
                "sample object"
            ]
        },
        "data": {
            "$id": "#/properties/data",
            "type": ["array","object"],
            "title": "The data schema",
            "description": "Service data",
            "default": {},
            "examples": [
                [{"name":"test"}]
            ],
            "required": [],
            "additionalProperties": true
        }
    },
    "additionalProperties": true
}