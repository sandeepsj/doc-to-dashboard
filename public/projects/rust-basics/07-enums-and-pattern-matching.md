# Enums & Pattern Matching

*After this page, you'll know how to model choices with enums and handle them with `match`.*

## Enums

An **enum** defines a type that can be one of several variants:

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

let heading = Direction::North;
```

Unlike enums in many languages, Rust enums can **carry data**:

```rust
enum Shape {
    Circle(f64),           // radius
    Rectangle(f64, f64),   // width, height
    Triangle(f64, f64, f64), // three sides
}

let s = Shape::Circle(5.0);
```

This is powerful — each variant can hold different types and amounts of data.

## Pattern Matching with Match

`match` is the natural companion to enums. You destructure each variant to access its data:

```rust
fn describe(shape: &Shape) -> String {
    match shape {
        Shape::Circle(r) => format!("Circle with radius {r}"),
        Shape::Rectangle(w, h) => format!("{w}x{h} rectangle"),
        Shape::Triangle(_, _, _) => String::from("A triangle"),
    }
}
```

## The Option Type

Rust has no `null`. Instead, it uses `Option<T>` — an enum built into the language:

```rust
enum Option<T> {
    Some(T),  // There's a value
    None,     // There's no value
}
```

Any time a value might be absent, you use `Option`:

```rust
fn find_first_even(numbers: &[i32]) -> Option<i32> {
    for &n in numbers {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}

match find_first_even(&[1, 3, 4, 7]) {
    Some(n) => println!("Found: {n}"),
    None => println!("No even numbers"),
}
```

## If Let — A Shortcut

When you only care about one variant, `if let` is cleaner than a full `match`:

```rust
if let Some(n) = find_first_even(&[1, 3, 4]) {
    println!("Found: {n}");
}
```

> [!warning]
> Because there's no `null`, you can never get a null pointer exception in Rust. If a value might be absent, the type system *forces* you to handle that case. This catches an entire category of bugs at compile time.
