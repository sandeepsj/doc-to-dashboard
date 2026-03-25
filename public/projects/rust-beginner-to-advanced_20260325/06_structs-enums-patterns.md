---
title: "Rust — Structs, Enums, and Pattern Matching"
topic: "Rust beginner to advanced, borrow checker, lifetimes etc. A tutorial"
generated: "2026-03-25"
depth: "beginner"
---

Rust gives you two powerful tools for modelling the world: **structs** (named groups of related data) and **enums** (a type that is *one of several* possible variants). Together with **pattern matching**, these three features form the backbone of nearly every Rust program you will write. If you have used Python dataclasses or Java POJOs, structs will feel familiar immediately — but Rust adds some sharp ergonomic wins. Enums in Rust are far more powerful than their Java/Python counterparts because each variant can carry its own data.

---

## Structs — Naming Your Data

A struct groups related fields under a single name. Think of it as a named tuple where every slot has a label.

```rust
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

fn main() {
    let user1 = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        sign_in_count: 1,
        active: true,
    };

    // Access fields with dot notation
    println!("Hello, {}!", user1.username);
}
```

> [!NOTE]
> In Python you might write `user.username`; in Java, `user.getUsername()`. In Rust it is always `user.username` — no getter boilerplate needed.

### Struct Update Syntax (`..other`)

You often want a new struct that is *mostly* the same as an existing one but with a few fields changed. The `..other` syntax copies all remaining fields from `other`:

```rust
let user2 = User {
    email: String::from("bob@example.com"),
    ..user1  // copy username, sign_in_count, active from user1
};
```

> [!WARNING]
> `..user1` **moves** fields that do not implement `Copy` (like `String`). After this line, `user1.username` is no longer accessible — the ownership of that `String` has been transferred to `user2`. Fields that are `Copy` types (like integers and booleans) are simply copied, so `user1.sign_in_count` is still fine.

### Tuple Structs

When you want a named type but don't care about field names:

```rust
struct Point(f64, f64);
struct Color(u8, u8, u8);

let origin = Point(0.0, 0.0);
let red = Color(255, 0, 0);
println!("x={}", origin.0);
```

---

## `impl` Blocks — Adding Behaviour to Structs

Rust separates *data* (the struct definition) from *behaviour* (the `impl` block). This keeps things clean and avoids the tangled class hierarchies you might know from Java.

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // Associated function (no `self`) — acts like a static method / constructor
    fn new(width: f64, height: f64) -> Rectangle {
        Rectangle { width, height }
    }

    // Method — takes &self (read-only access to the instance)
    fn area(&self) -> f64 {
        self.width * self.height
    }

    // Method with mutable access
    fn scale(&mut self, factor: f64) {
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut rect = Rectangle::new(5.0, 3.0);
    println!("Area: {}", rect.area());
    rect.scale(2.0);
    println!("Scaled area: {}", rect.area());
}
```

> [!TIP]
> **No `->` operator.** In C++ you write `ptr->method()` to call a method through a pointer. Rust has **auto-deref**: it automatically dereferences `self` as needed, so you always use `.` whether you have a value, reference, or smart pointer.

**Associated functions** (no `self`) are called with `::` — that's why you see `String::from(...)` and `Vec::new()` everywhere. They are the Rust convention for constructors.

---

## Enums — One of Several Possibilities

An enum in Python or Java is just a list of named constants. Rust enums are algebraic data types — each variant can hold different data. This is closer to a tagged union or a Kotlin sealed class.

```rust
enum Shape {
    Circle(f64),             // radius
    Rectangle(f64, f64),     // width, height
    Triangle { base: f64, height: f64 },  // named fields
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
        Shape::Triangle { base, height } => 0.5 * base * height,
    }
}
```

---

## `Option<T>` — Rust's Answer to Null

Null references have been called "the billion-dollar mistake" by their inventor. Rust eliminates null by replacing it with `Option<T>`, a built-in enum with two variants:

```rust
enum Option<T> {
    Some(T),   // there is a value
    None,      // there is no value
}
```

This forces you to *explicitly handle* the absence of a value — the compiler won't let you use the inner value without checking first.

```rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Alice"))
    } else {
        None
    }
}

fn main() {
    match find_user(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("User not found"),
    }
}
```

### Comparison: Handling Absence Across Languages

| Language | Absence Value | Accidental null access | Compiler enforced? |
|----------|--------------|------------------------|-------------------|
| Java     | `null`       | `NullPointerException` at runtime | No |
| Python   | `None`       | `AttributeError` at runtime | No |
| C++      | `nullptr`    | Undefined behaviour (crash/corruption) | No |
| Rust     | `Option::None` | Compile error — must handle `None` | **Yes** |

> [!NOTE]
> Common `Option` helpers: `unwrap_or(default)`, `map(|v| ...)`, `and_then(|v| ...)`. These let you chain transformations without explicit `match` every time.

---

## `Result<T, E>` — A First Glimpse

`Result` is like `Option` but for operations that can fail with an *error value*:

```rust
enum Result<T, E> {
    Ok(T),   // success with value T
    Err(E),  // failure with error E
}
```

You will use `Result` constantly in Rust. File I/O, network calls, parsing — they all return `Result`. File `08_error-handling.md` covers this deeply.

---

## Pattern Matching

Pattern matching is one of Rust's most beloved features. The `match` expression forces you to handle every possible case — the compiler enforces **exhaustiveness**.

### Basic `match`

```rust
let number = 7;

match number {
    1 => println!("one"),
    2 | 3 | 5 | 7 => println!("prime"),
    4..=6 => println!("four to six"),
    _ => println!("something else"),  // catch-all arm
}
```

If you forget a case, the compiler stops you:

```
error[E0004]: non-exhaustive patterns: `None` not covered
  --> src/main.rs:4:11
   |
4  |     match opt_val {
   |           ^^^^^^^ pattern `None` not covered
```

This kind of error saves you from entire classes of runtime bugs.

### Destructuring Structs and Enums

```rust
struct Point { x: i32, y: i32 }

let p = Point { x: 3, y: 7 };

match p {
    Point { x: 0, y } => println!("on Y-axis at {}", y),
    Point { x, y: 0 } => println!("on X-axis at {}", x),
    Point { x, y }    => println!("at ({}, {})", x, y),
}
```

### Ignoring Values: `_` and `..`

```rust
// _ ignores a single value
let (a, _, c) = (1, 2, 3);  // ignore the middle element

struct Config { debug: bool, verbose: bool, log_level: u8 }

let cfg = Config { debug: true, verbose: false, log_level: 3 };

// .. ignores the rest of the fields
match cfg {
    Config { debug: true, .. } => println!("Debug mode on"),
    _ => println!("Normal mode"),
}
```

### Match Guards

Add a conditional check to a pattern arm:

```rust
let num = Some(4);

match num {
    Some(x) if x < 5 => println!("small: {}", x),
    Some(x)           => println!("large: {}", x),
    None              => println!("nothing"),
}
```

### `@` Bindings

Bind a value *and* test it in the same arm:

```rust
let n = 15;
match n {
    x @ 1..=12 => println!("month {}", x),
    x @ 13..=19 => println!("teen {}", x),
    x => println!("other {}", x),
}
```

### `if let` — Sugar for a Single Pattern

When you only care about one variant, `match` with a catch-all `_` can feel verbose. `if let` is cleaner:

```rust
let some_value: Option<i32> = Some(7);

// Verbose match
match some_value {
    Some(v) => println!("Got {}", v),
    _ => {}
}

// Equivalent, cleaner if let
if let Some(v) = some_value {
    println!("Got {}", v);
}
```

> [!TIP]
> `while let` works the same way — keep looping as long as a pattern matches. Very useful for draining a stack or channel.

---

## What's Next

You now know how to model data with structs and enums, and how to extract it with pattern matching. The next logical step is **abstraction**: how do you write code that works for *multiple* types? Rust's answer is traits and generics — the topic of file `07_traits-generics.md`.
