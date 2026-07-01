---
title: "How to Handle created_by / updated_by with Laravel Traits"
description: "Learn how to automate audit field tracking in Laravel models using reusable traits. Clean, maintainable approach for created_by and updated_by fields."
date: 2026-01-13
comments: true
tags: ["laravel", "traits", "audit"]
---

In any production Laravel application, tracking who created or modified records is essential for audit trails, accountability, and debugging. While Laravel automatically handles `created_at` and `updated_at` timestamps, manually managing `created_by` and `updated_by` fields across all models is tedious and error-prone.

This guide shows you how to automate audit field management using reusable traits, keeping your models clean and your code DRY.





## The Problem: Manual Audit Management

Without proper automation, you'd need to:

1. Add `created_by` and `updated_by` columns to every table
2. Manually set these values in every controller or service
3. Remember to include them in `$fillable` arrays
4. Repeat this process for every new model

This approach is:
- ❌ **Error-prone**: Easy to forget in some places
- ❌ **Inconsistent**: Different implementations across models
- ❌ **Tedious**: Lots of boilerplate code
- ❌ **Hard to maintain**: Changes require updates everywhere


## The Solution: Bootable Traits

Laravel's Eloquent models automatically boot traits that follow the `boot[TraitName]` pattern. This allows us to create reusable audit functionality that works across all models.


## Step 1: Create the Blameable Trait

This trait automatically sets `created_by` and `updated_by` fields using the authenticated user.

**`app/Models/Traits/Blameable.php`**

```php
<?php

namespace App\Models\Traits;

use Illuminate\Support\Facades\Auth;

trait Blameable
{
    protected static function bootBlameable()
    {
        // Set created_by and updated_by on create
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        // Set updated_by on update
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}
```

### How It Works

- **`bootBlameable()`**: This method is automatically called by Laravel when the model boots
- **`creating` event**: Fires before a new record is inserted
- **`updating` event**: Fires before an existing record is updated
- **`Auth::check()`**: Ensures we only set values when a user is logged in
- **`Auth::id()`**: Gets the ID of the currently authenticated user


## Step 2: Create a DateTime Casts Trait

To avoid repeating timestamp casts in every model, create a trait that automatically adds them.

**`app/Models/Traits/HasDateTimeCasts.php`**

```php
<?php

namespace App\Models\Traits;

trait HasDateTimeCasts
{
    protected function initializeHasDateTimeCasts()
    {
        $this->casts = array_merge($this->casts ?? [], [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ]);
    }
}
```

### How It Works

- **`initializeHasDateTimeCasts()`**: Called automatically when a model instance is created
- **`array_merge()`**: Combines existing casts with our timestamp casts
- **`'datetime'`**: Ensures timestamps are always returned as DateTime objects


## Step 3: Update Your Model

Now apply these traits to any model that needs audit tracking.

**Before (Manual Approach):**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    // ❌ Problem: Must remember to include audit fields
    protected $fillable = [
        'title',
        'content',
        'category_id',
        'status',
        'created_by',  // Manual addition
        'updated_by',  // Manual addition
    ];

    // ❌ Problem: Must manually set these in controllers
    // ❌ Problem: Must manually cast timestamps
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ❌ Problem: Every controller needs this logic
    public function store(Request $request)
    {
        $post = Post::create(array_merge($request->all(), [
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]));
        
        return redirect()->route('posts.index');
    }
}
```

**After (Trait Approach):**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\Blameable;
use App\Models\Traits\HasDateTimeCasts;

class Post extends Model
{
    use Blameable, HasDateTimeCasts;

    // ✅ Clean: Only business fields in fillable
    protected $fillable = [
        'title',
        'content',
        'category_id',
        'status',
    ];

    // ✅ Automatic: Timestamps are handled by trait
    // ✅ Clean: No need to define casts for created_at/updated_at

    // Relationships remain the same
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function modifier()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
```


## Step 4: Usage in Controllers/Services

With traits in place, your business logic becomes much cleaner:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\PostService;

class PostController extends Controller
{
    public function store(Request $request)
    {
        // ✅ Clean: No manual audit field handling needed
        $post = Post::create($request->all());
        
        return redirect()->route('posts.index');
    }

    public function update(Request $request, Post $post)
    {
        // ✅ Clean: updated_by is handled automatically
        $post->update($request->all());
        
        return redirect()->route('posts.index');
    }
}
```


## Step 5: Advanced Customization

### Option 1: Handle Guest Users

If your app allows guest actions, modify the Blameable trait:

```php
<?php

namespace App\Models\Traits;

use Illuminate\Support\Facades\Auth;

trait Blameable
{
    protected static function bootBlameable()
    {
        static::creating(function ($model) {
            // Set to NULL if no authenticated user
            $userId = Auth::check() ? Auth::id() : null;
            $model->created_by = $userId;
            $model->updated_by = $userId;
        });

        static::updating(function ($model) {
            $model->updated_by = Auth::check() ? Auth::id() : null;
        });
    }
}
```

### Option 2: Add Additional Audit Fields

Extend the trait to track more information:

```php
<?php

namespace App\Models\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Blameable
{
    protected static function bootBlameable()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
            
            // Track creation IP
            $model->created_from_ip = Request::ip();
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
            
            // Track last update IP
            $model->last_updated_from_ip = Request::ip();
        });
    }
}
```

### Option 3: Conditional Auditing

Only audit specific models or under certain conditions:

```php
<?php

namespace App\Models\Traits;

use Illuminate\Support\Facades\Auth;

trait Blameable
{
    protected static function bootBlameable()
    {
        static::creating(function ($model) {
            // Only audit if model has the trait property enabled
            if (property_exists($model, 'auditEnabled') && $model->auditEnabled === false) {
                return;
            }
            
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (property_exists($model, 'auditEnabled') && $model->auditEnabled === false) {
                return;
            }
            
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }
}
```


## Step 6: Database Schema

Ensure your migrations include the necessary columns:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePostsTable extends Migration
{
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content')->nullable();
            $table->foreignId('category_id')->constrained();
            $table->string('status')->default('draft');
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            
            $table->timestamps();
        });
    }
}
```


## Step 7: Retrieving Audit Information

### Get Creator and Modifier

```php
// In your controller or view
$post = Post::with(['author', 'modifier'])->find(1);

echo $post->author->name;      // John Doe
echo $post->modifier->name;    // Jane Smith
```

### Display in Views

```blade
<div class="post-meta">
    <span>Created by: {{ $post->author->name ?? 'System' }}</span>
    <span>Last updated by: {{ $post->modifier->name ?? 'System' }}</span>
    <span>Created at: {{ $post->created_at->format('M d, Y') }}</span>
    <span>Updated at: {{ $post->updated_at->format('M d, Y') }}</span>
</div>
```

### Query by Audit Information

```php
// Find posts created by a specific user
$posts = Post::where('created_by', $userId)->get();

// Find posts last modified by a specific user
$posts = Post::where('updated_by', $userId)->get();

// Find posts modified today
$posts = Post::whereDate('updated_at', today())->get();
```


## Benefits of This Approach

### ✅ DRY Principle
Write the logic once, use it everywhere. No repetition.

### ✅ Consistency
All models behave the same way. No surprises.

### ✅ Maintainability
Need to change how auditing works? Update one file, apply everywhere.

### ✅ Clean Models
Models only contain business logic, not boilerplate.

### ✅ Testability
Easy to test the trait in isolation.

### ✅ Scalability
Works with any number of models without additional code.


## Testing Your Traits

Here's how to test the Blameable trait:

```php
<?php

namespace Tests\Unit\Traits;

use Tests\TestCase;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class BlameableTest extends TestCase
{
    public function test_sets_created_by_on_create()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $post = Post::create([
            'title' => 'Test Post',
            'content' => 'Test content',
        ]);

        $this->assertEquals($user->id, $post->created_by);
        $this->assertEquals($user->id, $post->updated_by);
    }

    public function test_sets_updated_by_on_update()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $this->actingAs($user1);
        $post = Post::create(['title' => 'Test']);

        $this->actingAs($user2);
        $post->update(['title' => 'Updated']);

        $this->assertEquals($user1->id, $post->created_by);
        $this->assertEquals($user2->id, $post->updated_by);
    }

    public function test_handles_guest_users()
    {
        // No user logged in
        $post = Post::create(['title' => 'Guest Post']);

        $this->assertNull($post->created_by);
        $this->assertNull($post->updated_by);
    }
}
```


## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Add Columns

**Problem:** Trait expects columns that don't exist.

**Solution:** Always add the columns in migrations:

```php
$table->foreignId('created_by')->nullable()->constrained('users');
$table->foreignId('updated_by')->nullable()->constrained('users');
```

### ❌ Pitfall 2: Including Audit Fields in Fillable

**Problem:** Fields are in `$fillable`, allowing manual override.

**Solution:** Keep audit fields OUT of `$fillable`:

```php
// ✅ CORRECT
protected $fillable = ['title', 'content', 'category_id'];

// ❌ WRONG
protected $fillable = ['title', 'content', 'created_by', 'updated_by'];
```

### ❌ Pitfall 3: Not Using Auth Facade

**Problem:** Trying to use `$this->user` in static context.

**Solution:** Always use `Auth::check()` and `Auth::id()` in boot methods.

### ❌ Pitfall 4: Forgetting About Mass Assignment

**Problem:** Using `create()` with user input that includes audit fields.

**Solution:** The trait handles this automatically, but keep audit fields out of fillable as a safety net.


## Alternative: Using Existing Packages

If you prefer not to write your own traits, consider these packages:

### 1. Laravel Auditing
```bash
composer require owen-it/laravel-auditing
```
Full audit trail with changes tracking.

### 2. Laravel Userstamps
```bash
composer require mattiverse/laravel-userstamps
```
Similar to our Blameable trait.

### 3. Laravel Created By
```bash
composer require jeffersongoncalves/laravel-created-by
```
Handles created_by, updated_by, deleted_by, restored_by.


## When NOT to Use This Approach

### ❌ High-Performance Applications
If you're building a system with millions of writes per minute, the overhead of trait booting might be significant.

### ❌ Multi-Tenant Systems
If you need to track different users for different tenants, you'll need more complex logic.

### ❌ External API Integrations
If data comes from external sources, you might want to track the source instead of a user.


## Best Practices

### ✅ 1. Always Use Traits from the Start
Add traits to models as you create them, not as an afterthought.

### ✅ 2. Document Your Audit Strategy
Make sure your team knows these traits exist and how they work.

### ✅ 3. Consider Soft Deletes
If using soft deletes, extend the trait to track `deleted_by`:

```php
static::deleting(function ($model) {
    if (Auth::check()) {
        $model->deleted_by = Auth::id();
    }
});
```

### ✅ 4. Use Database Constraints
Add foreign key constraints for data integrity:

```php
$table->foreignId('created_by')->nullable()->constrained('users');
$table->foreignId('updated_by')->nullable()->constrained('users');
```

### ✅ 5. Index Audit Fields
For better query performance:

```php
$table->index('created_by');
$table->index('updated_by');
```


## Complete Example: Full Audit Trait

Here's a comprehensive trait that handles all audit scenarios:

```php
<?php

namespace App\Models\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait FullAuditable
{
    protected static function bootFullAuditable()
    {
        // Creating
        static::creating(function ($model) {
            $userId = Auth::check() ? Auth::id() : null;
            $model->created_by = $userId;
            $model->updated_by = $userId;
            
            if (Request::has('ip')) {
                $model->created_from_ip = Request::ip();
            }
        });

        // Updating
        static::updating(function ($model) {
            $model->updated_by = Auth::check() ? Auth::id() : null;
            
            if (Request::has('ip')) {
                $model->last_updated_from_ip = Request::ip();
            }
        });

        // Deleting
        static::deleting(function ($model) {
            if (Auth::check()) {
                $model->deleted_by = Auth::id();
            }
        });

        // Restoring (for soft deletes)
        static::restoring(function ($model) {
            $model->deleted_by = null;
            $model->updated_by = Auth::check() ? Auth::id() : null;
        });
    }

    // Helper methods
    public function getCreator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getModifier()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getDeleter()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
```


## Summary

### What We Built
1. **Blameable Trait**: Automatically sets `created_by` and `updated_by`
2. **HasDateTimeCasts Trait**: Automatically casts timestamps
3. **Integration**: Clean models with minimal boilerplate

### Key Takeaways
- ✅ Use traits to keep models clean
- ✅ Never put audit fields in `$fillable`
- ✅ Let Laravel's boot system handle the heavy lifting
- ✅ Test your traits thoroughly
- ✅ Document your audit strategy for your team

### When to Use
- Any application needing audit trails
- Multi-user systems
- Applications requiring accountability
- Projects where data provenance matters

This approach keeps your models focused on business logic while ensuring consistent, reliable audit tracking across your entire application.


**Document Version:** 2.0.0  
**Last Updated:** 2026-01-13
