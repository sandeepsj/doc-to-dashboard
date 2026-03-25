# Borrowing & References

*After this page, you'll know how to let functions use data without taking ownership of it.*

## The Problem

If every function call moves ownership, code gets awkward fast:

```rust
fn print_length(s: String) {
    println!("Length: {}", s.len());
}  // `s` is dropped here!

fn main() {
    let name = String::from("Rust");
    print_length(name);
    // println!("{name}");  // Error — name was moved
}
```

You'd have to pass data in and return it back out every time. That's tedious.

## References to the Rescue

Instead of giving ownership, you can **lend** a reference using `&`:

```rust
fn print_length(s: &String) {
    println!("Length: {}", s.len());
}

fn main() {
    let name = String::from("Rust");
    print_length(&name);  // Borrow, don't move
    println!("{name}");   // Still valid!
}
```

This is called **borrowing**. The function borrows the data, uses it, and gives it back when it's done.

## Mutable References

By default, references are read-only. To modify borrowed data, use `&mut`:

```rust
fn add_exclaim(s: &mut String) {
    s.push('!');
}

fn main() {
    let mut greeting = String::from("Hello");
    add_exclaim(&mut greeting);
    println!("{greeting}");  // "Hello!"
}
```

## The Borrowing Rules

Rust enforces two rules at compile time:

| Rule | What It Means |
|------|---------------|
| Many `&` OR one `&mut` | You can have multiple immutable references, or exactly one mutable reference — never both at the same time |
| References must be valid | A reference can never outlive the data it points to (no dangling pointers) |

These rules prevent data races and use-after-free bugs — at compile time.

> [!note]
> **Self-check:** Why can't you have an `&` and `&mut` to the same data at the same time? Think about what would happen if one piece of code is reading data while another is changing it.

> [!tip]
> When a function only needs to read data, take `&T`. When it needs to modify it, take `&mut T`. Only take ownership (`T`) when the function genuinely needs to own the data.
