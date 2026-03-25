---
title: "Rust — Core Language Concepts"
topic: "Rust beginner to advanced, borrow checker, lifetimes etc. A tutorial"
generated: "2026-03-25"
depth: "beginner"
---

# Core Language Concepts

Before we can talk about ownership (the really interesting part of Rust), we need to speak the language. This file covers the everyday building blocks: variables, types, functions, and control flow. If you know Python or Java, most of this will feel familiar — but Rust has a few twists that are worth paying close attention to.

---

## Variables: Immutable by Default

In Python, every variable is mutable by default. In Rust, every variable is **immutable by default**. This is one of Rust's most deliberate design choices.

```rust
fn main() {
    let x = 5;
    x = 6; // This is a compile error!
}
```

```
error[E0384]: cannot assign twice to immutable variable `x`
 --> src/main.rs:3:5
  |
2 |     let x = 5;
  |         - first assignment to `x`
3 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut x = 5;
  |         +++
```

To make a variable mutable, add `mut`:

```rust
fn main() {
    let mut x = 5;
    println!("x is {}", x);
    x = 6;
    println!("x is now {}", x);
}
```

> [!NOTE]
> Why immutable by default? In a large codebase, immutable data is **much easier to reason about**. If `x` can't change, you don't have to track who might have changed it. Rust forces you to explicitly opt into mutability, making mutable state visible and intentional.

### Shadowing vs Mutability

Rust has a concept called **shadowing** — you can declare a new variable with the same name as an existing one:

```rust
fn main() {
    let x = 5;
    let x = x + 1;      // shadow: new variable, also named x
    let x = x * 2;      // shadow again
    println!("x = {}", x);  // prints: x = 12
}
```

This looks weird at first. The key insight: **shadowing creates a new variable**. This means you can even change the *type*:

```rust
let spaces = "   ";       // &str (text)
let spaces = spaces.len(); // usize (number) — completely different type!
```

With `mut`, this would be a compile error because you can't change a variable's type. With shadowing, you're creating a brand new variable that happens to reuse the name.

| | `let mut x` | Shadowing (`let x` again) |
|---|---|---|
| Can change value | Yes | Yes (new variable) |
| Can change type | No | Yes |
| Original value gone? | No (overwritten) | Yes (old binding hidden) |
| Use case | Values that legitimately change | Transformations, type conversions |

---

## Scalar Types

Rust's type system is **static** (like Java) and **explicit** (more like C++ than Java — the compiler won't silently convert between types). Every value has a type, known at compile time.

### Integers

| Type | Size | Range | Notes |
|---|---|---|---|
| `i8` | 8-bit signed | −128 to 127 | |
| `i16` | 16-bit signed | −32,768 to 32,767 | |
| `i32` | 32-bit signed | −2.1B to 2.1B | **Default integer type** |
| `i64` | 64-bit signed | −9.2×10¹⁸ to 9.2×10¹⁸ | |
| `i128` | 128-bit signed | huge | |
| `isize` | Pointer-sized | Platform-dependent | Used for indexing |
| `u8` | 8-bit unsigned | 0 to 255 | Common for bytes/raw data |
| `u16` | 16-bit unsigned | 0 to 65,535 | |
| `u32` | 32-bit unsigned | 0 to 4.3B | |
| `u64` | 64-bit unsigned | 0 to 1.8×10¹⁹ | |
| `u128` | 128-bit unsigned | huge | |
| `usize` | Pointer-sized | Platform-dependent | **Used for array indexing** |

> [!WARNING]
> **Integer Overflow** behaves differently in debug vs release mode:
> - **Debug build** (`cargo build`): overflowing causes a **panic** (intentional crash) — great for catching bugs during development.
> - **Release build** (`cargo build --release`): overflowing **wraps around** silently (e.g. `255u8 + 1 == 0`). This matches C behaviour but can be a subtle bug.
>
> If you need explicit wrapping or saturating arithmetic, use methods like `u8::wrapping_add(255, 1)` or `u8::saturating_add(255, 1)`.

Integer literals can use `_` as a visual separator: `1_000_000` is the same as `1000000`. You can also specify the type as a suffix: `42u8`, `100i64`.

### Floats

| Type | Size | Precision | Notes |
|---|---|---|---|
| `f32` | 32-bit | ~7 decimal digits | Use when memory matters |
| `f64` | 64-bit | ~15 decimal digits | **Default float type** |

### Bool and Char

```rust
let is_active: bool = true;   // true or false — NOT 0/1 like C
let heart: char = '❤';        // Rust char is a Unicode scalar — 4 bytes!
```

> [!NOTE]
> Unlike most languages, Rust's `char` is **4 bytes** (a Unicode scalar value), not 1 byte. This means it can represent any Unicode character natively. A `char` is always a single Unicode scalar — you can't have a half a character.

---

## Compound Types

### Tuples

A tuple groups values of **different types** into one unit:

```rust
let point: (i32, i32, f64) = (10, 20, 3.14);

// Destructure (unpack) it:
let (x, y, z) = point;
println!("x={}, y={}, z={}", x, y, z);

// Or access by index:
println!("x={}", point.0);
```

Tuples are fixed-size and fixed-type. They're great for returning multiple values from a function:

```rust
fn min_max(numbers: &[i32]) -> (i32, i32) {
    // returns (minimum, maximum)
    (*numbers.iter().min().unwrap(), *numbers.iter().max().unwrap())
}
```

### Arrays

Arrays in Rust are **fixed-size** and all elements must be the **same type**:

```rust
let days: [&str; 7] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
//         type  ^ ^ length — part of the type!

println!("First day: {}", days[0]);
println!("Length: {}", days.len());
```

> [!WARNING]
> Accessing an array out of bounds causes a **panic** at runtime in Rust (not undefined behaviour like in C). This is safer, but you should still guard indices. Prefer iterators over manual indexing whenever possible.

For a growable list (like Python's `list` or Java's `ArrayList`), use **`Vec<T>`** (pronounced "vector"):

```rust
let mut scores: Vec<i32> = Vec::new();
scores.push(10);
scores.push(20);
scores.push(30);

// Or use the vec! macro shorthand:
let scores = vec![10, 20, 30];

println!("Scores: {:?}", scores);   // {:?} is debug formatting
```

| | Array `[T; N]` | Vector `Vec<T>` |
|---|---|---|
| Size | Fixed at compile time | Grows at runtime |
| Memory | Stack-allocated | Heap-allocated |
| Use when | Size known, small, performance-critical | Size varies or unknown |
| Python analogy | Tuple (fixed) | List (growable) |

---

## Functions

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b   // no semicolon = this is the return value
}

fn greet(name: &str) {
    println!("Hello, {}!", name);
    // no return value — function returns () (called "unit")
}
```

### Statements vs Expressions — The No-Semicolon Return Rule

This is one of the most distinctive features of Rust. Understanding it will save you hours of confusion.

In Rust:
- A **statement** performs an action and does **not** produce a value. Most statements end with `;`.
- An **expression** evaluates to a value. Expressions do **not** end with `;`.

The last expression in a function (without a semicolon) is the return value:

```rust
fn double(n: i32) -> i32 {
    n * 2   // expression — no semicolon — this IS the return value
}

fn broken_double(n: i32) -> i32 {
    n * 2;  // statement — WITH semicolon — returns () not i32 — COMPILE ERROR
}
```

```
error[E0308]: mismatched types
 --> src/main.rs:5:26
  |
5 | fn broken_double(n: i32) -> i32 {
  |                             ^^^ expected `i32`, found `()`
```

You can also use `return` explicitly for early returns:

```rust
fn absolute(n: i32) -> i32 {
    if n < 0 {
        return -n;  // early return
    }
    n  // implicit return for the happy path
}
```

> [!TIP]
> Idiomatic Rust prefers the implicit return (no semicolon on last expression) for the normal return path, and explicit `return` only for early returns. This is not just style — it trains you to think of functions as expressions that evaluate to values.

---

## Control Flow

### `if` as an Expression

Unlike in most languages, `if` in Rust is an **expression** — it produces a value:

```rust
let number = 7;
let description = if number % 2 == 0 { "even" } else { "odd" };
println!("{} is {}", number, description);
```

This is similar to Python's ternary operator (`"even" if n % 2 == 0 else "odd"`) but arguably cleaner. Both branches must return the same type.

> [!WARNING]
> There is no `condition ? a : b` ternary operator in Rust. Use `if`/`else` as an expression instead — it does the same thing and is more readable.

### Loops

Rust has three looping constructs:

```rust
// 1. loop — infinite loop, exit with break
let mut count = 0;
let result = loop {
    count += 1;
    if count == 10 {
        break count * 2;  // break can return a value!
    }
};
println!("result = {}", result);  // 20

// 2. while — condition-based
let mut n = 1;
while n < 100 {
    n *= 2;
}
println!("n = {}", n);  // 128

// 3. for — iterate over a collection (prefer this!)
let fruits = ["mango", "banana", "guava"];
for fruit in &fruits {
    println!("{}", fruit);
}

// Ranges
for i in 0..5 {
    println!("{}", i);  // 0 1 2 3 4
}

for i in 0..=5 {
    println!("{}", i);  // 0 1 2 3 4 5  (inclusive)
}
```

> [!TIP]
> Prefer `for` over `while` whenever you're iterating over a known range or collection. It's safer (no off-by-one errors) and more idiomatic. The Rust iterator system is powerful and expressive — you'll explore it in depth later in this tutorial.

---

## Rust Has No Null

One of the most famous sources of bugs in other languages is `null` (or `None`, `nil`, `undefined`). Tony Hoare, who invented null references, famously called it his "billion-dollar mistake."

Rust does not have `null`. **Period.** Instead, it has the `Option<T>` enum:

```rust
let some_number: Option<i32> = Some(42);
let no_number: Option<i32> = None;
```

This forces you to *explicitly* handle the "no value" case before you can use the value. You can't accidentally call a method on something that might be null — the compiler won't let you.

> [!NOTE]
> We'll cover `Option<T>` properly later in this tutorial. For now, just know that Rust makes the possibility of "no value" explicit in the type system. If a function returns `Option<i32>`, you *know* it might not return anything, and the compiler will force you to handle that case.

---

## What's Next

In **03_ownership.md**, we get to the heart of what makes Rust unique. Ownership is Rust's mechanism for managing memory without a garbage collector — and understanding it will unlock everything else. It's the most important concept in the entire language.
