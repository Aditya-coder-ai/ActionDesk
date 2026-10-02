from app.gmail import normalize_message


def test_normalize_gmail_message():
    message = {
        "id": "abc123", "threadId": "thread1", "internalDate": "1790928000000",
        "payload": {"headers": [
            {"name": "From", "value": "Pat <pat@example.com>"},
            {"name": "To", "value": "owner@example.com"},
            {"name": "Subject", "value": "Re: Order"},
        ], "body": {"data": "SGVsbG8gZnJvbSBHbWFpbA=="}}
    }
    normalized = normalize_message(message, "owner@example.com")
    assert normalized["id"] == "gmail:abc123"
    assert normalized["direction"] == "inbound"
    assert normalized["subject"] == "Re: Order"
    assert normalized["body"] == "Hello from Gmail"
