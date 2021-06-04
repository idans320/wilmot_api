export default {
    "$schema": "http://json-schema.org/draft-07/schema",
    "$id": "data_service.json",
    "type": "object",
    "title": "data service schema",
    "description": "The data schema.",
    "default": {},
    "examples": [
        {
            "name": "sample object",
            "data": {}
        }
    ],
    "required": [
        "name",
        "data"
    ],
    "properties": {
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
        },
        "role": {
            "$id": "#/properties/role",
            "type": ["string"],
            "title": "The data schema",
            "description": "Service role",
            "default": {},
            "examples": [
                "test"
            ],
            "required": [],
            "additionalProperties": true
        }
    },
    "additionalProperties": true
}