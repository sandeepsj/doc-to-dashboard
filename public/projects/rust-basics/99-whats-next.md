# What's Next

*You've covered the fundamentals — here's where to go from here.*

## What You've Learned

You now understand the building blocks of Rust:

- **Ownership & borrowing** — Rust's core memory safety model
- **Structs & enums** — how to model data
- **Pattern matching** — how to handle enums and `Option`/`Result`
- **Traits & generics** — how to write flexible, reusable code
- **Error handling** — the `Result` + `?` pattern

These concepts form the foundation for everything else in Rust.

## Topics to Explore Next

| Topic | Why It Matters |
|-------|---------------|
| **Lifetimes** | Explicit annotations for how long references live — needed for complex borrowing |
| **Iterators & closures** | Functional-style data processing with `.map()`, `.filter()`, `.collect()` |
| **Modules & crates** | Organize larger projects and use external libraries |
| **Testing** | Built-in `#[test]` framework with `cargo test` |
| **Concurrency** | Fearless concurrency with threads, `Arc`, `Mutex` |
| **Async/await** | Non-blocking I/O with `tokio` or `async-std` |

## Recommended Resources

- **The Rust Book** — the official, comprehensive guide at `doc.rust-lang.org/book`
- **Rustlings** — small exercises that teach Rust concepts interactively
- **Rust by Example** — learn through annotated code examples at `doc.rust-lang.org/rust-by-example`
- **Exercism Rust Track** — mentored coding exercises for practice

## Build Something!

The best way to solidify what you've learned is to build a small project:

- A CLI to-do list app (structs, enums, file I/O)
- A number guessing game (random numbers, input parsing, loops)
- A word frequency counter (HashMap, file reading, iterators)

Start small, lean on the compiler's error messages, and look things up as you go. The Rust compiler is your best teacher.

> [!tip]
> Feeling frustrated by the borrow checker? That's completely normal. Every Rust developer goes through it. Each compiler error you fix is teaching you something that prevents real bugs in production. It gets easier — and then it feels like a superpower.
