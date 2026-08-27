---
title: "Test-Driven Development in Laravel: A Practical Guide to Red-Green-Refactor"
description: "Learn how to practice TDD in Laravel with PHPUnit — from first principles (Red-Green-Refactor, the Three Laws) to building real features test-first using factories, RefreshDatabase, and feature tests."
date: 2026-08-27
comments: true
tags: ["laravel", "tdd", "testing", "phpunit"]
---

Test-Driven Development (TDD) is a development discipline where you write a **failing** test **before** the production code exists. This guide walks you from first principles to shipping a real Laravel feature the TDD way. Every example matches a standard Laravel + PHPUnit setup (factories, `RefreshDatabase`, `route()` helpers).


## Introduction

### What is TDD (and what it is not)

**TDD** is not "write code, then write tests." It is a *design* practice where the test is written first and fails, forcing you to think about the interface and expected behavior before the implementation.

The cycle is three steps, repeated constantly:

- 🔴 **Red** — write a small test for the next bit of behavior; run it; watch it **fail**.
- 🟢 **Green** — write the *minimum* code to make that test pass; run it; watch it **pass**.
- 🔵 **Refactor** — clean up the code while the test keeps you safe.

```
Traditional (Test-After, what most people do):
┌─────────────────────────────┐
│   Write Feature / Logic     │
│   ├─ Model                 │
│   ├─ Controller            │
│   ├─ Route                 │
│   └─ (ship it)             │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Write Tests (after)       │
│   (prove it works)          │
└─────────────────────────────┘

TDD (Test-First):
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│  🔴 Red     │─▶│  🟢 Green    │─▶│  🔵 Refactor│
│ Failing test│   │ Min code to  │   │ Clean up,   │
│ for behavior│   │ pass test    │   │ tests green │
└─────────────┘   └──────────────┘   └──────┬──────┘
                                            │
                                            ▼
                                      (next behavior)
```

### Why TDD?

- ✅ **Better design**: Writing the test first forces you to define the interface before the implementation.
- ✅ **Safety net**: Every line of code is covered the moment it's born; refactors become fearless.
- ✅ **Living documentation**: Tests show exactly how the code is meant to be used.
- ✅ **Fewer debug sessions**: Code is green "a minute ago" at all times.
- ✅ **Regression protection**: Future changes break a test immediately, not silently in production.


## The Three Laws of TDD

Internalize these (Uncle Bob):

1. **You may not write production code** unless it is to make a failing test pass.
2. **You may not write more of a test** than is sufficient to fail (a compile error counts as failure).
3. **You may not write more production code** than is sufficient to pass the current failing test.

The proof that you are doing TDD: **you see the test fail first.** If your test is green the moment you write it, you did not TDD — you wrote characterization/regression tests (valuable, but a different tool — see below).


## TDD vs Characterization Testing (know the difference)

This distinction matters. They look similar (both produce tests) but serve opposite moments in a feature's life:

| | TDD | Characterization Testing |
|---|---|---|
| When | **Before** code exists | **After** code already ships |
| Test phase | 🔴 Red is required | Test is green immediately |
| Purpose | Drive *design* of new code | Pin *current behavior* of existing code |
| Example | Building a brand-new `duplicate` route | Adding tests for routes that already work |

Use **TDD** for new code. Use **characterization testing** to lock down existing code before a refactor (e.g., "add tests for all CRUD routes before touching auth"). Both belong in your toolbox.


## Your Laravel Testing Setup

A typical Laravel app is already configured:

- **Runner:** `php artisan test` (wraps PHPUnit). Run one test: `php artisan test --filter=isOverdue`.
- **Test DB:** `phpunit.xml` sets `DB_CONNECTION=sqlite` + `DB_DATABASE=:memory:`, so tests never touch your real database.
- **Clean state:** `use RefreshDatabase;` resets the DB per test.
- **Test data:** `Task::factory()` (define factories in `database/factories/`).
- **Folders:** `tests/Feature/` for HTTP/route tests, `tests/Unit/` for isolated logic.

A minimal unit test that needs no database:

```php
// tests/Unit/TaskTest.php
namespace Tests\Unit;

use App\Models\Task;
use PHPUnit\Framework\TestCase;

class TaskTest extends TestCase
{
    public function test_something(): void
    {
        $task = new Task(['title' => 'X']); // no DB needed
        // ...
    }
}
```

> **Note:** `tests/Unit` tests do not boot the full Laravel app. If you need factories or the database, put the test in `tests/Feature` or extend `Tests\TestCase` and `use RefreshDatabase`.


## First TDD Cycle (Unit Level): `isOverdue()`

Goal: a task is "overdue" if it is **not completed** and its `submission_date` is in the **past**. The `Task` model has no such method yet — perfect for TDD.

### 🔴 Red — write the failing test first

```php
// tests/Unit/TaskTest.php
namespace Tests\Unit;

use App\Models\Task;
use PHPUnit\Framework\TestCase;

class TaskTest extends TestCase
{
    public function test_an_incomplete_task_with_a_past_due_date_is_overdue(): void
    {
        $task = new Task([
            'submission_date' => now()->subDays(2),
            'is_completed'    => false,
        ]);

        $this->assertTrue($task->isOverdue());
    }

    public function test_a_task_due_in_the_future_is_not_overdue(): void
    {
        $task = new Task([
            'submission_date' => now()->addDays(2),
            'is_completed'    => false,
        ]);

        $this->assertFalse($task->isOverdue());
    }

    public function test_a_completed_task_is_never_overdue(): void
    {
        $task = new Task([
            'submission_date' => now()->subDays(2),
            'is_completed'    => true,
        ]);

        $this->assertFalse($task->isOverdue());
    }
}
```

Run it: `php artisan test --filter=TaskTest`. It fails — `Method App\Models\Task::isOverdue does not exist`. **That failure is the proof.** ✅

### 🟢 Green — minimal implementation

```php
// app/Models/Task.php
public function isOverdue(): bool
{
    return !$this->is_completed
        && $this->submission_date !== null
        && $this->submission_date->isPast();
}
```

Run again: **3 passed**. ✅

### 🔵 Refactor

The logic is already clear. One optional tidy for readability:

```php
public function isOverdue(): bool
{
    if ($this->is_completed) {
        return false;
    }

    return $this->submission_date !== null && $this->submission_date->isPast();
}
```

Tests still green. That is one full TDD loop.


## TDD a Feature (HTTP Level): "Duplicate a task"

Now a route that does not exist yet: `POST /tasks/{task}/duplicate` creates a copy. This exercises your real stack (routes, controller, DB, factory).

### 🔴 Red — feature test first

```php
// tests/Feature/TaskDuplicateTest.php
namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskDuplicateTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicating_a_task_creates_a_copy_and_redirects(): void
    {
        $task = Task::factory()->create([
            'title'       => 'Write the report',
            'description' => 'Q3 summary',
        ]);

        $response = $this->post(route('tasks.duplicate', $task));

        $response->assertRedirect(route('tasks.index'));
        $this->assertDatabaseHas('tasks', [
            'title'       => 'Write the report',
            'description' => 'Q3 summary',
        ]);
        // original still there, plus the copy => 2 rows
        $this->assertDatabaseCount('tasks', 2);
    }
}
```

Run it → fails (`route('tasks.duplicate')` not defined). Red confirmed. ✅

### 🟢 Green — minimal route + controller

```php
// routes/web.php (add)
Route::post('tasks/{task}/duplicate', [TaskController::class, 'duplicate'])
    ->name('tasks.duplicate');
```

```php
// app/Http/Controllers/TaskController.php
public function duplicate(Task $task)
{
    $copy = $task->replicate();
    $copy->save();

    return redirect()->route('tasks.index');
}
```

Run → passes. ✅

### 🔵 Refactor

`replicate()` already excludes the primary key and timestamps; the copy keeps `title`/`description`. Nothing to clean up. If you later want the copy titled `"Write the report (copy)"`, that is a **new red test**, not a change to this one.

> Notice: at no point did we write the feature, then test it. The test dictated the interface (`route('tasks.duplicate')`, redirect target, DB outcome) before any implementation existed.


## Rules to Live By

- **Never skip Red.** If you cannot make the test fail for the right reason, the test is worthless.
- **Baby steps.** One assertion → green → next assertion. Do not implement the whole feature then test.
- **Minimum code to green.** Resist "also handle that edge case" — write a test for that edge case next.
- **Refactor only after green.** The test is your safety net; use it.
- **Test behavior, not internals.** Assert on HTTP response + DB state, not on private method calls.


## Practice Plan (in order)

1. **Read (today, 20 min):** Martin Fowler's TDD article + Uncle Bob's Three Laws.
2. **Drill mechanics (this week):** Roy Osherove's *String Calculator* kata, 15–30 min/day. No Laravel — just the loop.
3. **Apply here:** pick a *new* small feature in a Laravel app (e.g. `isOverdue()` above, or a `duplicate` route) and TDD it. Require the **failing run output** in your PR as proof.
4. **Level up:** a dedicated Laravel TDD course (e.g. Adam Wathan's *Test-Driven Laravel*) for real-world patterns.


## Testing Strategy

### 1. Unit Tests for Pure Logic

```php
// tests/Unit/TaskTest.php
namespace Tests\Unit;

use App\Models\Task;
use PHPUnit\Framework\TestCase;

class TaskTest extends TestCase
{
    public function test_completed_tasks_are_never_overdue(): void
    {
        $task = new Task([
            'submission_date' => now()->subDays(2),
            'is_completed'    => true,
        ]);

        $this->assertFalse($task->isOverdue());
    }
}
```

### 2. Feature Tests for HTTP Flows

```php
// tests/Feature/TaskStoreTest.php
namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_task_can_be_created_with_valid_data(): void
    {
        $response = $this->post(route('tasks.store'), [
            'title' => 'Buy groceries',
            'description' => 'Milk, eggs, bread',
        ]);

        $response->assertRedirect(route('tasks.index'));
        $this->assertDatabaseHas('tasks', ['title' => 'Buy groceries']);
    }

    public function test_a_task_cannot_be_created_without_a_title(): void
    {
        $response = $this->post(route('tasks.store'), [
            'title' => '',
        ]);

        $response->assertSessionHasErrors('title');
        $this->assertDatabaseMissing('tasks', ['description' => 'should not be saved']);
    }
}
```


## Common Pitfalls

### ❌ Pitfall 1: Skipping the Red phase

**Problem:** You write the test and the feature together, run once, see green, and call it "TDD."

**Solution:** Run the test *before* writing the implementation. If it does not fail, the test is not proving anything.

```php
// ❌ WRONG: test written after code already works
public function test_store_creates_task(): void
{
    // implementation already exists => test was green immediately
}

// ✅ CORRECT: write test first, watch it fail, then implement
public function test_store_creates_task(): void
{
    // run now => "route tasks.store not defined" => RED
}
```

### ❌ Pitfall 2: Test cannot fail

**Problem:** The assertion checks something already true, so the test passes even if the logic is broken.

**Solution:** Assert on the *new* behavior only.

```php
// ❌ BAD: always true regardless of logic
$this->assertTrue(true);

// ✅ GOOD: asserts the actual outcome
$this->assertDatabaseHas('tasks', ['title' => 'Buy groceries']);
```

### ❌ Pitfall 3: Big leaps

**Problem:** You implement the whole feature, then write one giant test.

**Solution:** One assertion per loop. Go red → green → red → green.

```php
// Step 1 (red -> green): empty title fails
// Step 2 (red -> green): valid title creates row
// Step 3 (red -> green): description is optional
```

### ❌ Pitfall 4: Testing the framework, not your code

**Problem:** Tests assert Laravel behaves (e.g. "route exists") instead of your logic.

**Solution:** Test *your* outcomes — redirects, DB state, validation errors.

```php
// ❌ BAD: tests Laravel, not you
$response->assertOk(); // meaningless if you didn't define behavior

// ✅ GOOD: tests your rule
$response->assertSessionHasErrors('title');
```


## Quick Reference

### Unit Test Template
```php
// tests/Unit/ModelTest.php
namespace Tests\Unit;

use App\Models\YourModel;
use PHPUnit\Framework\TestCase;

class YourModelTest extends TestCase
{
    public function test_some_behavior(): void
    {
        $model = new YourModel([/* attributes */]);

        $this->assertTrue($model->someMethod());
    }
}
```

### Feature Test Template
```php
// tests/Feature/ResourceTest.php
namespace Tests\Feature;

use App\Models\YourModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_happy_path(): void
    {
        $response = $this->post(route('yourmodels.store'), [
            'name' => 'Example',
        ]);

        $response->assertRedirect(route('yourmodels.index'));
        $this->assertDatabaseHas('your_models', ['name' => 'Example']);
    }
}
```

### TDD Loop (copy this)
```
1. 🔴 Write ONE failing test. RUN → confirm RED.
2. 🟢 Write MINIMUM code to pass. RUN → confirm GREEN.
3. 🔵 Refactor. RUN → still GREEN.
4. Repeat. No production code without a failing test first.
```


## Conclusion

TDD is a habit, not a one-off technique: write a failing test, watch it fail, write the smallest code to pass, refactor, repeat. The red run is the proof you did it. Start with a tiny unit method (`isOverdue()`), drill the loop on a kata, then apply it to a new Laravel feature — and always require the failing-test output in your PR.

Your future self (and your team) will thank you when the next refactor is fearless.


**Document Version:** 1.0.0
**Last Updated:** 2026-08-27
