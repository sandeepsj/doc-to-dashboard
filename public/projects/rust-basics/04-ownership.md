# Ownership

*After this page, you'll understand the concept that makes Rust unique — and why the compiler is so strict about it.*

## The Big Idea

Most languages manage memory in one of two ways: garbage collection (Go, Java, Python) or manual allocation (C, C++). Rust takes a third path: **ownership**.

The compiler tracks who "owns" each piece of data and automatically frees memory when the owner goes out of scope. No garbage collector. No manual `free()`. No memory leaks.

## The Analogy

Think of ownership like a physical book. A book can only have **one owner** at a time. You can:

- **Give it away** (transfer ownership)
- **Lend it** (let someone borrow it temporarily)
- **Drop it** (it gets destroyed when you're done)

But two people can't both own the same book.

## The Three Rules

1. Each value has exactly **one owner**
2. When the owner goes out of scope, the value is **dropped** (freed)
3. Assigning a value to another variable **moves** ownership

## Moves in Action

```rust
fn main() {
    let name = String::from("Rust");
    let other = name;  // ownership MOVES to `other`

    // println!("{name}");  // Error! `name` is no longer valid
    println!("{other}");    // Works fine
}
```

After `let other = name`, the variable `name` is no longer usable. Rust calls this a **move**. The data wasn't copied — ownership was transferred.

## Why Not Just Copy?

Simple types like integers *are* copied automatically:

```rust
let a = 5;
let b = a;  // copied, not moved
println!("{a} and {b}");  // Both work!
```

Integers live on the stack and are cheap to copy. But heap-allocated types like `String` are moved by default to avoid expensive implicit copies.

> [!warning]
> The "use of moved value" error is the most common Rust beginner mistake. When you see it, ask yourself: "Who owns this data right now?"

> [!tip]
> Ownership is Rust's killer feature. It guarantees memory safety at compile time with zero runtime cost. The compiler is strict, but it's protecting you from bugs that crash programs in other languages.
