# Traits & Generics

*After this page, you'll know how to write flexible, reusable code with traits and generic types.*

## Traits — Shared Behavior

A **trait** defines a set of methods that types can implement. Think of it as an interface.

```rust
trait Describable {
    fn describe(&self) -> String;
}
```

Any type can implement this trait:

```rust
struct Dog { name: String }
struct Car { make: String }

impl Describable for Dog {
    fn describe(&self) -> String {
        format!("A dog named {}", self.name)
    }
}

impl Describable for Car {
    fn describe(&self) -> String {
        format!("A {} car", self.make)
    }
}
```

Now both `Dog` and `Car` share the `describe` behavior, even though they're completely different types.

## Common Built-in Traits

Rust has traits you'll see everywhere:

| Trait | What It Does | How to Get It |
|-------|-------------|---------------|
| `Debug` | Enables `{:?}` printing | `#[derive(Debug)]` |
| `Clone` | Enables `.clone()` deep copy | `#[derive(Clone)]` |
| `PartialEq` | Enables `==` comparison | `#[derive(PartialEq)]` |
| `Display` | Enables `{}` printing | Must implement manually |

`derive` auto-generates implementations for simple cases:

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point { x: f64, y: f64 }
```

## Generics

Generics let you write functions that work with multiple types:

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut biggest = &list[0];
    for item in &list[1..] {
        if item > biggest {
            biggest = item;
        }
    }
    biggest
}
```

The `<T: PartialOrd>` means "any type `T` that can be compared." This function works with integers, floats, strings — anything that implements `PartialOrd`.

## Trait Bounds in Practice

You can also write trait bounds with the `where` clause for readability:

```rust
fn print_info<T>(item: &T)
where
    T: Describable + Debug,
{
    println!("{:?}: {}", item, item.describe());
}
```

> [!tip]
> Traits + generics are Rust's answer to polymorphism. Instead of class hierarchies, you define shared behavior with traits and write generic code that works with any type implementing those traits. This is more flexible and avoids the pitfalls of deep inheritance chains.
