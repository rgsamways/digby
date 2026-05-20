# Design: Mineral Quiz

## Backend

### New model: QuizResult
```
quiz_result:
  visitor_id: ObjectId
  score: int          # correct answers (0-10)
  max_score: int      # always 10
  points_awarded: int
  completed_at: datetime
```

### Routes: GET /api/quiz/questions, POST /api/quiz/submit
- GET returns 10 randomly shuffled questions (id, question, options) — no answers leaked
- POST accepts {answers: {question_id: chosen_option}} — returns {score, max_score, points_awarded, results: [{id, correct, explanation}]}
- Auth required; result stored in QuizResult collection

### Question bank
25 questions covering:
- Ontario minerals (amethyst, sodalite, labradorite, galena, uraninite)
- Mineral properties (hardness, luster, streak, cleavage)
- Rock types (igneous, sedimentary, metamorphic)
- Famous Ontario localities (Thunder Bay, Bancroft, Haliburton)
- Geological concepts (Precambrian Shield age, crystal systems)

### Passport integration
`passport.py` sums `points_awarded` across all QuizResult documents for that visitor and adds to total_points.

Updated formula:
```
total = stamps×25 + unique_minerals×10 + completed_hunts×100 + sum(quiz_results.points_awarded)
```

## Frontend

### /quiz page
State machine: "ready" | "playing" | "reviewing" | "done"
- ready: title card, "Start Quiz" button, show pts on offer
- playing: question card with 4 option buttons, progress bar (Q N of 10)
- reviewing: same card, correct answer highlighted green, wrong red, explanation shown, "Next" button
- done: score display, pts earned, links to passport + play again

### Nav
Add "Quiz" link for all logged-in roles (visitor, guide — not operator, they don't need it)
