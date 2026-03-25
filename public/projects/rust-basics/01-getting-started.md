# Getting Started

*After this page, you'll have Rust installed and your first program running.*

## Why Rust?

Rust gives you the speed of C with the safety of a garbage-collected language — without actually having a garbage collector. It catches bugs at compile time that other languages only catch at runtime (or never).

Companies like Mozilla, Google, Microsoft, and Amazon use Rust in production for performance-critical systems.

## Installing Rust

The official way to install Rust is through **rustup**, which manages your Rust versions and tooling.

Open your terminal and run:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Follow the prompts, then restart your terminal. Verify it worked:

```bash
rustc --version
# rustc 1.94.0 (or newer)
```

## Your First Project

Rust's build tool and package manager is **Cargo**. It handles compiling, dependencies, and project structure.

```bash
cargo new hello-rust
cd hello-rust
cargo run
```

```
   Compiling hello-rust v0.1.0
    Finished `dev` profile target(s)
     Running `target/debug/hello-rust`
Hello, world!
```

That's it — you just compiled and ran a Rust program.

## What Cargo Created

```
hello-rust/
├── Cargo.toml   # Project metadata & dependencies
└── src/
    └── main.rs  # Your code starts here
```

The `main.rs` file contains a `fn main()` function — the entry point of every Rust program.

> [!tip]
> Use `cargo run` to compile and run in one step. Use `cargo build` if you only want to compile, and `cargo check` for a fast syntax/type check without producing a binary.
