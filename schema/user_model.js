export default {
    "$schema": "http://json-schema.org/draft-07/schema",
    "$id": "http://example.com/example.json",
    "type": "object",
    "title": "The root schema",
    "description": "The root schema comprises the entire JSON document.",
    "default": {},
    "examples": [
        {
            "username": "test",
            "password": "test"
        }
    ],
    "required": [
        "username",
        "password"
    ],
    "properties": {
        "username": {
            "$id": "#/properties/username",
            "type": "string",
            "title": "The username schema",
            "description": "An explanation about the purpose of this instance.",
            "default": "",
            "examples": [
                "test"
            ]
        },
        "password": {
            "$id": "#/properties/password",
            "type": "string",
            "title": "The password schema",
            "description": "An explanation about the purpose of this instance.",
            "default": "",
            "examples": [
                "test"
            ]
        }
    },
    "additionalProperties": true
}