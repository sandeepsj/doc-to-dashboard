# Variables & Types

*After this page, you'll know how Rust handles variables, mutability, and its core data types.*

## Variables Are Immutable by Default

In Rust, variables can't be changed once assigned — unless you opt in.

```rust
fn main() {
    let x = 5;
    println!("x is {x}");

    // x = 10;  // This won't compile!
}
```

This is a deliberate design choice. Immutability prevents accidental changes and makes code easier to reason about.

To make a variable mutable, add `mut`:

```rust
let mut x = 5;
x = 10; // This works
```

## Shadowing

You can declare a new variable with the same name. This is called **shadowing** — it creates a fresh variable, even allowing a different type.

```rust
let name = "Rust";      // &str
let name = name.len();  // usize — same name, different type
```

## Scalar Types

Rust has four scalar types:

| Type | Examples | Notes |
|------|----------|-------|
| Integer | `i32`, `u64`, `i8` | `i` = signed, `u` = unsigned, number = bits |
| Float | `f32`, `f64` | Default is `f64` |
| Boolean | `true`, `false` | Type is `bool` |
| Character | `'a'`, `'🦀'` | 4 bytes, supports Unicode |

The default integer type is `i32` — a good general-purpose choice.

## Compound Types

**Tuples** group different types together with a fixed size:

```rust
let point: (f64, f64) = (3.0, 4.5);
let x = point.0; // Access by index
```

**Arrays** hold multiple values of the same type with a fixed size:

```rust
let nums: [i32; 3] = [1, 2, 3];
let first = nums[0];
```

> [!tip]
> Use tuples for quick groupings of mixed types. Use arrays when you have a fixed-size collection of the same type. For growable lists, you'll use `Vec<T>` later.
