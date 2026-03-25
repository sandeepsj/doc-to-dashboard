# Error Handling

*After this page, you'll know how Rust handles errors without exceptions — and why it's better.*

## No Exceptions

Rust doesn't have `try/catch`. Instead, it uses two mechanisms:

- **`panic!`** — for unrecoverable errors (program crashes)
- **`Result<T, E>`** — for recoverable errors (you decide what to do)

## Panic

`panic!` immediately stops the program. Use it for situations that should never happen:

```rust
panic!("Something went terribly wrong");
```

You rarely call `panic!` directly. It happens automatically on things like out-of-bounds array access.

## The Result Type

`Result` is an enum, just like `Option`:

```rust
enum Result<T, E> {
    Ok(T),   // Success, contains the value
    Err(E),  // Failure, contains the error
}
```

Functions that can fail return `Result`:

```rust
use std::fs;

fn main() {
    match fs::read_to_string("config.txt") {
        Ok(contents) => println!("{contents}"),
        Err(e) => println!("Error: {e}"),
    }
}
```

## Unwrap — The Quick and Dirty Way

`unwrap()` extracts the `Ok` value, but panics on `Err`:

```rust
let contents = fs::read_to_string("config.txt").unwrap();
```

Fine for quick scripts and prototypes. Don't use it in production code — it crashes instead of handling the error.

## The ? Operator — The Elegant Way

The `?` operator propagates errors up to the caller. If the result is `Ok`, it unwraps the value. If it's `Err`, it returns the error from the current function.

```rust
fn read_config() -> Result<String, std::io::Error> {
    let contents = fs::read_to_string("config.txt")?;
    Ok(contents)
}
```

This is equivalent to the `match` version but much cleaner. You can chain multiple `?` calls for concise error handling.

> [!tip]
> Start with `unwrap()` when prototyping, then replace with `?` as your code matures. The `?` operator is idiomatic Rust for error propagation.

> [!note]
> **Self-check:** What's the difference between `Option<T>` and `Result<T, E>`? When would you use each?
