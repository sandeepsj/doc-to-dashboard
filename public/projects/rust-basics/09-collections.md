# Collections

*After this page, you'll know how to work with growable lists and key-value stores in Rust.*

## Vectors

A `Vec<T>` is a growable list — Rust's equivalent of an ArrayList or Python list.

```rust
let mut numbers: Vec<i32> = Vec::new();
numbers.push(10);
numbers.push(20);
numbers.push(30);

println!("{:?}", numbers); // [10, 20, 30]
```

The `vec!` macro is a shorthand for creating vectors with initial values:

```rust
let numbers = vec![10, 20, 30];
```

Access elements by index or safely with `.get()`:

```rust
let second = numbers[1];          // Panics if out of bounds
let maybe = numbers.get(5);       // Returns Option<&i32>
```

## Iterating

`for` loops work naturally with vectors:

```rust
for n in &numbers {
    println!("{n}");
}
```

Use `&numbers` to borrow the vector — otherwise the loop would take ownership and you couldn't use it afterward.

## HashMap

`HashMap<K, V>` stores key-value pairs:

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert("Alice", 95);
scores.insert("Bob", 87);

if let Some(score) = scores.get("Alice") {
    println!("Alice scored {score}");
}
```

Useful methods:

| Method | What It Does |
|--------|-------------|
| `insert(k, v)` | Add or overwrite a key |
| `get(k)` | Returns `Option<&V>` |
| `contains_key(k)` | Returns `bool` |
| `entry(k).or_insert(v)` | Insert only if key is absent |

## The Entry Pattern

A common pattern: insert a default value only if the key doesn't exist yet.

```rust
let mut word_count = HashMap::new();

for word in "hello world hello".split_whitespace() {
    let count = word_count.entry(word).or_insert(0);
    *count += 1;
}
// {"hello": 2, "world": 1}
```

> [!tip]
> Use `Vec` when you care about order and access by index. Use `HashMap` when you need fast lookups by key. Both are heap-allocated and grow as needed.
