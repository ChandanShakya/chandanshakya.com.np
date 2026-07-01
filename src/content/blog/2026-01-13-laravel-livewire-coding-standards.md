---
title: "Laravel Livewire Coding Standards: A Comprehensive Guide"
description: "Complete guide to naming conventions and coding standards for Laravel Livewire v3 applications. Learn best practices for components, validation, and database layers."
date: 2026-01-13
comments: true
tags: ["laravel", "livewire", "coding-standards"]
---

This guide establishes mandatory naming conventions and coding standards for Laravel projects using Livewire v3. These standards ensure consistency, maintainability, and professional code quality across your Laravel applications.




## 1. Purpose and Scope

### 1.1 Purpose
This document establishes mandatory naming conventions and coding standards for Laravel projects using Livewire v3. These standards ensure consistency, maintainability, and professional code quality across your Laravel applications.

### 1.2 Scope
These standards apply to:
- Livewire component classes, properties, and methods
- Blade templates and wire:* directives
- Validation rule arrays and form request validation
- Alpine.js integration within Livewire components
- Database schema, Eloquent models, and attribute access
- All new development and significant refactoring of existing code

### 1.3 Enforcement
All code must comply with these standards before merging to main branches. Code reviews must reject non-compliant submissions.


## 2. Livewire Component Standards

### 2.1 Component Class Naming

**Standard:** `PascalCase` with descriptive names

**Examples:**
```php
// ✅ DO
namespace App\Livewire\Post;

use Livewire\Component;

class CreatePost extends Component
{
    // Main component for post creation
}

class PostForm extends Form
{
    // Form component for post operations
}

class PostTable extends DataTableComponent
{
    // Table component for post listing
}

// ❌ DON'T
class createPost      // Wrong - lowercase
class Postform        // Wrong - inconsistent
class Post_Form       // Wrong - snake_case
```

### 2.2 Component File Naming

**Standard:** Match class name exactly

**Examples:**
```
# ✅ DO
app/Livewire/Post/CreatePost.php          → class CreatePost
app/Livewire/Post/PostForm.php            → class PostForm
app/Livewire/Post/PostTable.php           → class PostTable

# ❌ DON'T
app/Livewire/Post/create_post.php         // Wrong file name
app/Livewire/Post/PostForm.php            // class postForm  // Wrong class name
```

### 2.3 Component Property Naming

**Standard:** `camelCase` for all properties

**Examples:**
```php
// ✅ DO
class CreatePost extends Component
{
    public $postId;              // camelCase
    public PostForm $postForm;   // camelCase
    public $action = 'create';   // camelCase
    public $status;              // camelCase
}

class PostForm extends Form
{
    #[Validate('required')]
    public $postTitle;           // camelCase
    
    #[Validate('nullable|integer')]
    public $orderCode;           // camelCase
    
    public $postId;              // camelCase
    public $model;                // camelCase
}

// ❌ DON'T
class CreatePost extends Component
{
    public $post_id;             // Wrong - snake_case
    public $PostForm;            // Wrong - PascalCase
    public $action_create;       // Wrong - snake_case
}
```

### 2.4 Component Method Naming

**Standard:** `camelCase` with action-oriented names

**Examples:**
```php
// ✅ DO
class CreatePost extends Component
{
    public function mount()  // Lifecycle hook
    {
        // ...
    }
    
    public function render()  // Required method
    {
        return view('livewire.post.post-form', [
            'categories' => Category::pluck('name', 'id'),
            'status' => $this->status
        ]);
    }
    
    public function create()  // Action method
    {
        $this->postForm->create();
        $this->alert('success', 'Created Successfully');
    }
    
    public function update()  // Action method
    {
        $this->postForm->update();
        $this->alert('success', 'Updated Successfully');
    }
}

class PostForm extends Form
{
    public function loadPost()  // Custom lifecycle method
    {
        if ($this->postId) {
            $this->model = Post::find($this->postId);
            if ($this->model) {
                $this->postTitle = $this->model->post_title;
                $this->orderCode = $this->model->order_code;
                $this->categoryId = $this->model->category_id;
                $this->status = $this->model->status;
            }
        }
    }
    
    public function create()
    {
        $this->validate();
        Post::create([
            'post_title' => $this->postTitle,
            'order_code' => $this->orderCode,
            'category_id' => $this->categoryId,
            'status' => $this->status,
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);
    }
    
    public function update()
    {
        $this->validateOnly('status');
        
        $this->model->update([
            'post_title' => $this->postTitle,
            'order_code' => $this->orderCode,
            'category_id' => $this->categoryId,
            'status' => $this->status,
            'updated_by' => auth()->id(),
        ]);
    }
}

// ❌ DON'T
class CreatePost extends Component
{
    public function load_post()  // Wrong - snake_case
    {
        // ...
    }
    
    public function create_post()  // Wrong - redundant
    {
        // ...
    }
}
```

### 2.5 Component View Naming and Location

**Standard:** `kebab-case` for Blade files, organized by component type

**Examples:**
```
# ✅ DO
resources/views/livewire/
├── auth/
│   ├── login.blade.php                    → Login.php
│   ├── logout.blade.php                   → Logout.php
│   └── default-password-change.blade.php  → DefaultPasswordChange.php
├── post/
│   ├── post-form.blade.php               → CreatePost.php (uses PostForm)
│   ├── post-table.blade.php              → PostTable.php
│   └── post-index.blade.php              → PostIndex.php
└── admin/
    └── user-management/
        └── user-settings/
            └── permission/
                ├── permission.blade.php   → Permission.php
                └── permission-form.blade.php → PermissionForm.php

# ❌ DON'T
resources/views/livewire/
├── PostForm.php                           // Wrong - PHP file in views
├── postForm.blade.php                     // Wrong - camelCase
└── Post_Form.blade.php                    // Wrong - snake_case
```

### 2.6 View Rendering in Components

**Standard:** Use `render()` method with explicit view path

**Examples:**
```php
// ✅ DO
public function render()
{
    return view('livewire.post.post-form', [
        'categories' => Category::pluck('name', 'id'),
        'status' => $this->status
    ]);
}

public function render()
{
    $status = [
        0 => 'Inactive',
        1 => 'Active',
        2 => 'Disabled',
    ];

    return view('livewire.admin.user-management.user-settings.permission.permission', 
        compact('status'));
}

// ❌ DON'T
public function render()
{
    return view('livewire.post.postForm');  // Wrong - camelCase view name
}
```


## 3. Blade Template Standards

### 3.1 Blade Variable Bindings

**Standard:** `camelCase` for all variables passed to Blade

**Examples:**
```blade
{{-- ✅ DO --}}
@php
if ($action === 'create') {
    $title = 'Create Post';
    $buttonText = 'Create';
    $wireFunction = 'create';
} elseif ($action === 'edit') {
    $title = 'Edit Post';
    $buttonText = 'Update';
    $wireFunction = 'update';
}
@endphp

<x-layouts.body.card 
    :title='$title' 
    permission="{{ $action === 'create' ? 'post_create' : 'post_edit' }}"
    wireFunction="{{ $wireFunction }}" 
    addNewTitle="{{ $buttonText }}" 
    iconClass="fas fa-save">
</x-layouts.body.card>

{{-- ❌ DON'T --}}
@php
    $action_create = 'create';  // Wrong - snake_case
    $button_text = 'Create';    // Wrong - snake_case
@endphp
```

### 3.2 wire:model Bindings

**Standard:** `camelCase` property names

**Examples:**
```blade
{{-- ✅ DO --}}
<form wire:submit='login' class="card-body">
    <input wire:model="username" id="username" type="text" class="form-control">
    <input wire:model="password" id="password" type="password" class="form-control">
    <input wire:model="rememberMe" class="form-check-input" type="checkbox" id="rememberMe">
</form>

<x-form.input 
    type="text" 
    label="Post Title*" 
    name="post_title" 
    id="post_title"
    wireModel="postForm.post_title" 
/>

<x-form.select 
    label="Category*" 
    id="category_id" 
    name="category_id"
    :options="$categories" 
    model="postForm.category_id" 
/>

{{-- ❌ DON'T --}}
<input type="text" wire:model="first_name" placeholder="First Name">
<input type="email" wire:model="email_address" placeholder="Email">
```

### 3.3 wire:click and Action Parameters

**Standard:** `camelCase` for all parameter keys

**Examples:**
```blade
{{-- ✅ DO --}}
<button wire:click="deletePost({{ $post->id }})">Delete</button>
<button wire:click="updateStatus({ postId: 123, status: 'active' })">Update</button>

{{-- ❌ DON'T --}}
<button wire:click="deletePost({ post_id: $post->id })">Delete</button>
```

### 3.4 Alpine.js Integration

**Standard:** `camelCase` for Alpine data, `@js()` directive for PHP data

**Examples:**
```blade
{{-- ✅ DO --}}
<div x-data="{ isActive: @js($isActive), expandAll: @js($shouldExpandAll) }"
     x-bind:class="{ 'show': isActive || expandAll }"
     @collapse-toggled.window="expandAll = $event.detail.expand">
</div>

<body x-data="{ sidebarHidden: {{ session('sidebar_show', true) ? 'false' : 'true' }} }"
      x-bind:class="{ 'g-sidenav-hidden': sidebarHidden }"
      @sidebar-toggled.window="sidebarHidden = !$event.detail.show">
</body>

<div @post-created.window="handlePostCreated($event.detail)">
    // ...
</div>

{{-- ❌ DON'T --}}
<div x-data="{ 
    is_open: false,  // Wrong - should be isOpen
    user_name: @js($firstName)  // Wrong - should be userName
}">
</div>
```

### 3.5 Component and Slot Naming

**Standard:** `PascalCase` for custom components, `kebab-case` for usage

**Examples:**
```blade
{{-- ✅ DO --}}
<x-layouts.body.card 
    :title='$title' 
    permission="{{ $action === 'create' ? 'post_create' : 'post_edit' }}"
    wireFunction="{{ $wireFunction }}" 
    addNewTitle="{{ $buttonText }}" 
    iconClass="fas fa-save">
    <div class="card-body px-4 pt-2 pb-0">
        <!-- Form content -->
    </div>
</x-layouts.body.card>

<livewire:permission.permission :permissionId="$permissionId" />
<livewire:post.posts :postId="$postId" />

{{-- ❌ DON'T --}}
<livewire:user-profile :user-id="$id" />  // Wrong - attribute should match property
```


## 4. Validation Standards

### 4.1 Form Request Validation Rules

**Standard:** `snake_case` for rule keys

**Examples:**
```php
// ✅ DO - From StorePostRequest.php
class StorePostRequest extends FormRequest
{
    public function authorize()
    {
        return Gate::allows('post_create');
    }

    public function rules()
    {
        return [
            'title' => ['required'],
            'content' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

// ✅ DO - From MassDestroyPostRequest.php
class MassDestroyPostRequest extends FormRequest
{
    public function rules()
    {
        return [
            'ids' => 'required|array',
            'ids.*' => 'exists:posts,id',
        ];
    }
}

// ❌ DON'T
class CreatePostRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'postTitle' => ['required', 'string'],  // Wrong
            'postContent' => ['required', 'string'],  // Wrong
        ];
    }
}
```

### 4.2 Livewire Component Validation

**Standard:** Validation keys must match property names (use `camelCase`)

**Examples:**
```php
// ✅ DO - From Login.php
class Login extends Component
{
    public $username = '';
    public $password = '';
    
    protected $rules = [
        'username' => 'required',  // Matches property $username
        'password' => 'required',  // Matches property $password
    ];
}

// ✅ DO - From DefaultPasswordChange.php
class DefaultPasswordChange extends Component
{
    #[Validate('required', message: 'The password is required.')]
    #[Validate('string', message: 'The password should be string format.')]
    #[Validate('min:8', message: 'The password should be minimum 8 characters long.')]
    #[Validate('same:confirmPassword', message: 'The confirmed password doesn\'t match')]
    public $password;

    #[Validate('required', message: 'The confirm password is required.')]
    #[Validate('string', message: 'The confirm password should be string format.')]
    public $confirmPassword;
}

// ✅ DO - From PostForm.php (Livewire Form)
class PostForm extends Form
{
    #[Validate('required', message: 'The post title field is required.')]
    public $postTitle;

    #[Validate('nullable|integer', message: 'Order code must be a number.')]
    public $orderCode;

    #[Validate('nullable|string|max:100', message: 'Long name must be less than 100 characters.')]
    public $longName;

    #[Validate('required|exists:categories,id', message: 'Valid category is required.')]
    public $categoryId;

    #[Validate('required|in:0,1,2', message: 'Status must be 0, 1, or 2.')]
    public $status = 1;
}

// ❌ DON'T
class ContactForm extends Component
{
    public string $name = '';
    public string $email = '';
    
    protected function rules(): array
    {
        return [
            'name' => ['required', 'string'],
            'emailAddress' => ['required', 'email'],  // Wrong - property is $email, should be 'email'
        ];
    }
}
```

### 4.3 Validation Attribute Labels

**Standard:** Use spaces for human-readable names

```php
// ✅ DO
protected function attributes(): array
{
    return [
        'postTitle' => 'post title',
        'orderCode' => 'order code',
        'longName' => 'long name',
        'shortName' => 'short name',
        'categoryId' => 'category',
    ];
}
```


## 5. Database & Eloquent Standards

### 5.1 Database Schema Columns

**Standard:** `snake_case` for all columns

**Examples:**
```php
// ✅ DO - From posts migration
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
    $table->string('post_title', 150);
    $table->integer('order_code')->nullable();
    $table->text('content')->nullable();
    $table->char('status', 1);
    $table->foreignId('created_by')->constrained('users');
    $table->foreignId('updated_by')->constrained('users');
    $table->timestamps();
});

// ✅ DO - From comments migration
Schema::create('comments', function (Blueprint $table) {
    $table->id();
    $table->text('comment_text');
    $table->json('comment_images')->nullable();
    $table->decimal('rating', 5, 2);
    $table->string('difficulty_level', 20);
    $table->text('explanation')->nullable();
    $table->foreignId('post_id')->constrained()->restrictOnDelete();
    $table->foreignId('user_id')->nullable()->constrained()->restrictOnDelete();
    $table->char('status', 1)->default('1');
    $table->foreignId('created_by')->constrained('users');
    $table->foreignId('updated_by')->constrained('users');
    $table->timestamps();
});

// ❌ DON'T
Schema::create('users', function (Blueprint $table) {
    $table->string('firstName');      // Wrong
    $table->string('emailAddress');   // Wrong
    $table->boolean('isActive');      // Wrong
});
```

### 5.2 Eloquent Model Fillable

**Standard:** `snake_case` for all fillable attributes

**Examples:**
```php
// ✅ DO - From Post.php
class Post extends Model
{
    protected $fillable = [
        'post_title',
        'order_code',
        'content',
        'short_name',
        'category_id',
        'status',
    ];
}

// ✅ DO - From Category.php
class Category extends Model
{
    protected $fillable = [
        'category_name',
        'category_code',
        'status',
    ];
}

// ❌ DON'T
class User extends Model
{
    protected $fillable = [
        'firstName',      // Wrong
        'emailAddress',   // Wrong
        'isActive',       // Wrong
    ];
}
```

### 5.3 Eloquent Accessors/Mutators

**Standard:** `camelCase` for accessor/mutator method names

**Examples:**
```php
// ✅ DO - From TimestampsTrait.php
trait TimestampsTrait
{
    protected function getEmailVerifiedAtAttribute($value): ?string
    {
        return $value ? Date::createFromFormat('Y-m-d H:i:s', $value)->format(config('panel.date_format').' '.config('panel.time_format')) : null;
    }

    protected function setEmailVerifiedAtAttribute($value): void
    {
        $this->attributes['email_verified_at'] = $value ? Date::createFromFormat(config('panel.date_format').' '.config('panel.time_format'), $value)->format('Y-m-d H:i:s') : null;
    }

    protected function setPasswordAttribute($input): void
    {
        if ($input) {
            $this->attributes['password'] = App::make('hash')->needsRehash($input) ? Hash::make($input) : $input;
        }
    }
}

// Usage
$user = new User();
echo $user->emailVerifiedAt;      // camelCase property
$user->password = 'new_password'; // camelCase property

// ❌ DON'T
class User extends Model
{
    public function get_full_name_attribute(): string  // Wrong naming
    {
        // ...
    }
}
```

### 5.4 Relationship Methods

**Standard:** `camelCase` for relationship method names

**Examples:**
```php
// ✅ DO - From Post.php
class Post extends Model
{
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}

// ✅ DO - From Comment.php
class Comment extends Model
{
    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }
}

// ✅ DO - From Question.php (in module)
class Question extends Model
{
    public function questionOptions()
    {
        return $this->hasMany(McqOption::class, 'question_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }
}

// ❌ DON'T
class User extends Model
{
    public function user_posts(): HasMany  // Wrong
    {
        return $this->hasMany(Post::class);
    }
}
```

### 5.5 Model Casts

**Standard:** `snake_case` for cast keys

**Examples:**
```php
// ✅ DO - From Permission.php
class Permission extends Model
{
    protected function casts(): array
    {
        return ['created_at' => 'datetime', 'updated_at' => 'datetime', 'deleted_at' => 'datetime'];
    }
}

// ✅ DO - From User model (trait)
trait TimestampsTrait
{
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}

// ❌ DON'T
class User extends Model
{
    protected $casts = [
        'emailVerifiedAt' => 'datetime',  // Wrong - must match column name
    ];
}
```


## 6. Cross-Boundary Conventions

### 6.1 API Responses

**Rule:** Use `snake_case` for JSON keys

```php
// ✅ DO
class ApiUserController extends Component
{
    public function getUserData(): array
    {
        return [
            'user_id' => $this->userId,
            'first_name' => $this->firstName,
            'email_address' => $this->emailAddress,
        ];
    }
}
```

### 6.2 Third-Party Package Integration

**Rule:** Convert at boundaries

```php
// ✅ DO
class PaymentController extends Component
{
    public function processPayment(): void
    {
        $gatewayData = [
            'first_name' => $this->firstName,  // Convert to snake_case for gateway
            'email' => $this->emailAddress,
        ];
        
        $response = PaymentGateway::charge($gatewayData);
        
        $this->transactionId = $response['transaction_id'];  // Convert back to camelCase
    }
}
```

### 6.3 Legacy Code Integration

**Rule:** Maintain consistency with existing code, document exceptions

```php
// File: LegacyForm.php
// NOTE: This file uses snake_case for properties due to legacy database integration.
// New development should follow this standard. Refactor planned for Q2 2026.

class LegacyForm extends Component
{
    public string $user_name = '';  // Exception: legacy database field
    public string $email_address = '';  // Exception: legacy database field
}
```

### 6.4 Configuration and Environment

**Rule:** `UPPER_SNAKE_CASE` for env, `snake_case` for config

```php
// ✅ DO
// .env
DB_HOST=localhost
API_KEY=secret_key_here

// config/app.php
return [
    'api_version' => 'v1',
    'max_upload_size' => 1024,
];

// Accessing
$apiKey = env('API_KEY');
$dbHost = config('database.connections.mysql.host');
```


## 7. Summary Rules

### 7.1 Livewire Components
- Component class names: `PascalCase` (e.g., `CreatePost`, `PostForm`, `PostTable`)
- Component file names: Match class name exactly (e.g., `CreatePost.php`)
- Component locations: Main in `app/Livewire/`, module-specific in module directory
- Public properties: `camelCase` (e.g., `$postId`, `$postForm`, `$action`)
- Private/protected properties: `camelCase`
- Computed properties: `get{PropertyName}Property()` with `camelCase`
- Lifecycle hooks: Exact Livewire names (`mount`, `render`, `hydrate`, etc.)
- Action methods: `camelCase` with descriptive names (e.g., `create()`, `update()`, `loadPost()`)
- Method parameters: `camelCase`

### 7.2 Blade Templates
- View files: `kebab-case` (e.g., `post-form.blade.php`)
- View paths: Organized by component type (e.g., `livewire/post/post-form.blade.php`)
- Variable bindings: `camelCase` (e.g., `$title`, `$buttonText`, `$wireFunction`)
- `wire:model` bindings: `camelCase` (e.g., `wire:model="username"`)
- `wire:click` parameters: `camelCase` (e.g., `wire:click="deletePost({{ $id }})"`)
- Alpine.js data: `camelCase` (e.g., `x-data="{ isActive: @js($isActive) }"`)
- Alpine.js events: `kebab-case` for custom events (e.g., `@collapse-toggled.window`)
- Use `@js()` directive for all PHP → Alpine.js data

### 7.3 Validation
- Form Request rules: `snake_case` keys (e.g., `'post_title' => ['required']`)
- Livewire rules: `camelCase` keys matching property names (e.g., `protected $rules = ['username' => 'required']` where property is `$username`)
- Livewire Form attributes: `camelCase` property names (e.g., `#[Validate('required')] public $postTitle`)
- Validation messages: `snake_case` keys (e.g., `'post_title.required'`)
- Attribute labels: Spaces for human-readable (e.g., `'postTitle' => 'post title'`)

### 7.4 Database & Eloquent
- Database columns: `snake_case` (e.g., `post_title`, `order_code`, `category_id`)
- Model fillable: `snake_case` (e.g., `protected $fillable = ['post_title', 'order_code']`)
- Accessor methods: `get{AttributeName}Attribute()` → `camelCase` property (e.g., `getEmailVerifiedAtAttribute()` → `$user->emailVerifiedAt`)
- Mutator methods: `set{AttributeName}Attribute()` → `camelCase` property (e.g., `setPasswordAttribute()` → `$user->password = 'value'`)
- Relationship methods: `camelCase` (e.g., `category()`, `post()`, `author()`)
- Model casts: `snake_case` keys (e.g., `'email_verified_at' => 'datetime'`)

### 7.5 Cross-Boundary Conventions
- API responses: `snake_case` keys
- Third-party integrations: Convert at boundaries
- Legacy code: Maintain consistency, document exceptions
- Environment variables: `UPPER_SNAKE_CASE` (e.g., `DB_HOST`, `API_KEY`)
- Config files: `snake_case` keys (e.g., `'api_version' => 'v1'`)


## 8. Rationale Summary

### 8.1 Why camelCase for Properties?
- **Frontend Integration:** JavaScript/Alpine.js uses camelCase natively
- **Modern PHP Standard:** PSR standards favor camelCase for properties
- **Reduced Conversion:** Eliminates constant `snake_case` ↔ `camelCase` transformations
- **Framework Alignment:** Livewire v3 documentation examples use camelCase
- **Project Evidence:** All existing Livewire components use camelCase

### 8.2 Why snake_case for Database/Validation?
- **SQL Standard:** Database convention across all major RDBMS
- **Laravel Convention:** Framework core uses snake_case for these layers
- **Backward Compatibility:** Existing Laravel ecosystem tools expect snake_case
- **Clarity:** Clearly distinguishes persistence layer from application logic
- **Project Evidence:** All migrations use snake_case, validation rules match property names (camelCase)

### 8.3 Why Mixed Approach?
This standard follows the **"right tool for the right layer"** principle:
- **Application Layer (PHP/Livewire):** `camelCase` - modern, frontend-friendly
- **Persistence Layer (DB/Validation):** `snake_case` - traditional, SQL-compatible
- **Boundary Layer (APIs):** `snake_case` - JSON standard


## 9. Compliance and Review

### 9.1 Code Review Checklist

All pull requests must be reviewed against this standard. Reviewers should verify:

- [ ] **Livewire component naming and locations**
  - Classes use `PascalCase`
  - Files match class names exactly
  - Main components in `app/Livewire/`

- [ ] **Property naming in Livewire components**
  - All properties use `camelCase`
  - Form classes use `camelCase` properties with `snake_case` validation attributes

- [ ] **Blade templates for correct wire: directive usage**
  - `wire:model` uses `camelCase` properties
  - `wire:click` parameters use `camelCase`
  - Variables passed to view use `camelCase`

- [ ] **Database migrations use snake_case**
  - All column names are `snake_case`
  - Foreign keys follow pattern `table_id`

- [ ] **Eloquent accessors/mutators follow naming convention**
  - Accessors: `get{AttributeName}Attribute()` → `$model->camelCaseProperty`
  - Mutators: `set{AttributeName}Attribute()` → `$model->camelCaseProperty = 'value'`
  - Relationships: `camelCase()` methods

- [ ] **Alpine.js integration uses @js directive**
  - All PHP → Alpine.js data uses `@js()`
  - Alpine data properties use `camelCase`
  - Custom events use `kebab-case`

- [ ] **Livewire Form classes follow the mixed convention**
  - Properties: `camelCase`
  - Validation attributes: `snake_case` keys
  - Methods: `camelCase`

### 9.2 Automated Checks

Consider implementing:
- PHP CS Fixer with custom rules
- Laravel Pint configuration
- Custom Livewire linting rules


## 10. Quick Reference Table

| Layer | Convention | Example | Wrong Examples |
|-------|------------|---------|----------------|
| Livewire class | PascalCase | `CreatePost`, `PostForm` | `createPost`, `Postform` |
| Livewire property | camelCase | `$postId`, `$postForm` | `$post_id`, `$PostForm` |
| Livewire method | camelCase | `create()`, `update()` | `create_post()`, `load_post()` |
| Blade view | kebab-case | `post-form.blade.php` | `postForm.blade.php` |
| Blade variable | camelCase | `$title`, `$buttonText` | `$title_text`, `$ButtonText` |
| Validation key | camelCase (match property) | `'post_title'` | `'postTitle'` |
| Database column | snake_case | `post_title`, `order_code` | `postTitle`, `orderCode` |
| Model fillable | snake_case | `['post_title', 'order_code']` | `['postTitle', 'orderCode']` |
| Relationship | camelCase | `category()`, `post()` | `category_relation()`, `post_model()` |
| Alpine data | camelCase | `isActive`, `expandAll` | `is_active`, `expand_all` |
| API response | snake_case | `['user_id' => 123]` | `['userId' => 123]` |
| Environment | UPPER_SNAKE_CASE | `DB_HOST`, `API_KEY` | `db_host`, `ApiKey` |


**Document Version:** 2.0.0  
**Last Updated:** 2026-01-13
