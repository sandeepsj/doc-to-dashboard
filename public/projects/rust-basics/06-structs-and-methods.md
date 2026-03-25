# Structs & Methods

*After this page, you'll know how to define custom data types and attach behavior to them.*

## Defining a Struct

A **struct** groups related data under a single name. Think of it like a class without inheritance.

```rust
struct Rectangle {
    width: f64,
    height: f64,
}
```

Create an instance by filling in all fields:

```rust
let rect = Rectangle {
    width: 10.0,
    height: 5.0,
};

println!("Width: {}", rect.width);
```

## Adding Methods

Methods are defined inside an `impl` block. The first parameter is `&self` (a reference to the instance):

```rust
impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn is_square(&self) -> bool {
        self.width == self.height
    }
}
```

Call methods with dot syntax:

```rust
println!("Area: {}", rect.area());
```

## Associated Functions (Constructors)

Functions in an `impl` block that **don't** take `self` are called associated functions. They're often used as constructors:

```rust
impl Rectangle {
    fn square(size: f64) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }
}

let sq = Rectangle::square(5.0);
```

Notice the `::` syntax — like calling a static method in other languages.

## Printing Structs

By default, structs can't be printed. Add `#[derive(Debug)]` to enable debug output:

```rust
#[derive(Debug)]
struct Rectangle {
    width: f64,
    height: f64,
}

let rect = Rectangle { width: 10.0, height: 5.0 };
println!("{:?}", rect);
// Rectangle { width: 10.0, height: 5.0 }
```

> [!tip]
> Rust doesn't have classes or inheritance. Instead, you compose behavior using structs + `impl` blocks + traits (covered soon). This "composition over inheritance" approach leads to more flexible code.
