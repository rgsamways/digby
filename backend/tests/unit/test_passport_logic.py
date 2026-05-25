"""Unit tests for passport points computation — pure function, no DB."""
import os

os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017/digby_test")
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-use-64chars-padded-xx")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_ci")

from app.api.routes.passport import HUNT_POINTS, MINERAL_POINTS, STAMP_POINTS, _compute_points


def test_zero_points():
    assert _compute_points(0, 0, 0, 0, 0) == 0


def test_stamp_points():
    assert _compute_points(1, 0, 0, 0, 0) == STAMP_POINTS
    assert _compute_points(3, 0, 0, 0, 0) == 3 * STAMP_POINTS


def test_mineral_points():
    assert _compute_points(0, 5, 0, 0, 0) == 5 * MINERAL_POINTS


def test_hunt_points():
    assert _compute_points(0, 0, 2, 0, 0) == 2 * HUNT_POINTS


def test_combined_points():
    total = _compute_points(
        stamp_count=4,
        unique_mineral_count=10,
        hunt_count=1,
        quiz_points=50,
        diary_points=20,
    )
    expected = 4 * STAMP_POINTS + 10 * MINERAL_POINTS + 1 * HUNT_POINTS + 50 + 20
    assert total == expected


def test_quiz_and_diary_pass_through():
    assert _compute_points(0, 0, 0, 75, 0) == 75
    assert _compute_points(0, 0, 0, 0, 30) == 30
