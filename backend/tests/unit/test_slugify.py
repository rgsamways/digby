"""Unit tests for club slug generation — pure function, no DB."""
from app.api.routes.clubs import _slugify


def test_basic_slug():
    assert _slugify("Bancroft Rockhounds") == "bancroft-rockhounds"


def test_special_characters_stripped():
    assert _slugify("Rock & Roll Club!") == "rock-roll-club"


def test_multiple_spaces_collapsed():
    assert _slugify("The   Ontario   Club") == "the-ontario-club"


def test_numbers_preserved():
    assert _slugify("Club 49") == "club-49"


def test_leading_trailing_stripped():
    assert _slugify("  Rocks  ") == "rocks"


def test_empty_string_returns_empty():
    assert _slugify("!@#$%") == ""


def test_unicode_lowercased():
    assert _slugify("GRANITE") == "granite"
