# Functions & Control Flow

*After this page, you'll know how to write functions, make decisions, and loop in Rust.*

## Functions

Functions are declared with `fn`. Rust uses snake_case for function names. You must declare parameter types explicitly.

```rust
fn greet(name: &str) {
    println!("Hello, {name}!");
}

fn add(a: i32, b: i32) -> i32 {
    a + b  // No semicolon = this is the return value
}
```

Notice `add` returns a value without the `return` keyword. In Rust, the last expression in a function is implicitly returned. Adding a semicolon would turn it into a statement and break the return.

## If / Else

Straightforward, but no parentheses needed around the condition:

```rust
let temp = 35;

if temp > 30 {
    println!("Hot!");
} else if temp > 20 {
    println!("Nice.");
} else {
    println!("Cold.");
}
```

`if` is an expression in Rust, so you can use it on the right side of `let`:

```rust
let status = if temp > 30 { "hot" } else { "fine" };
```

## Loops

Rust has three loop types:

```rust
// Infinite loop (break to exit)
loop {
    println!("forever");
    break;
}

// Conditional loop
while count < 5 {
    count += 1;
}

// Iterate over a range or collection
for i in 0..5 {
    println!("{i}");
}
```

`for` loops are the most common. The range `0..5` gives you 0 through 4. Use `0..=5` to include 5.

## Match

`match` is Rust's powerful pattern matching. Think of it as a supercharged `switch`:

```rust
let grade = 'B';

match grade {
    'A' => println!("Excellent"),
    'B' | 'C' => println!("Good"),
    'D' => println!("Passing"),
    _ => println!("Failing"),  // _ = catch-all
}
```

> [!important]
> `match` must be **exhaustive** — you must handle every possible value. The `_` wildcard catches anything you haven't explicitly listed.
