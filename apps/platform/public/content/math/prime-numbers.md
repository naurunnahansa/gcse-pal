# Prime Numbers and Factors

## Learning Objectives

By the end of this lesson, you will be able to:
- Identify prime and composite numbers
- Find all factors of a given number
- Determine the prime factorization of any integer
- Use prime factorization to find the Greatest Common Divisor (GCD) and Least Common Multiple (LCM)

## What Are Prime Numbers?

### Definition
A **prime number** is a natural number greater than 1 that has exactly two distinct positive divisors: 1 and itself.

### Examples of Prime Numbers
- **2** (the only even prime number)
- **3, 5, 7, 11, 13, 17, 19, 23, 29...**
- Prime numbers go on infinitely!

### Key Characteristics
- Prime numbers are always positive integers greater than 1
- They cannot be divided evenly by any other numbers except 1 and themselves
- 1 is NOT considered a prime number (it only has one factor)

## Composite Numbers

### Definition
A **composite number** is a natural number greater than 1 that has more than two positive divisors.

### Examples of Composite Numbers
- **4** (factors: 1, 2, 4)
- **6** (factors: 1, 2, 3, 6)
- **8, 9, 10, 12, 14, 15...**

### Special Cases
- **0** is neither prime nor composite
- **1** is neither prime nor composite
- **2** is the smallest and only even prime number

## Finding Factors

### What are Factors?
Factors are numbers that divide evenly into another number without leaving a remainder.

### Methods to Find Factors

#### Method 1: Testing Divisibility
To find all factors of a number `n`:
1. Start with 1 and the number itself
2. Test divisibility by each integer from 2 to √n
3. If `i` divides `n` evenly, then both `i` and `n/i` are factors

#### Example: Find all factors of 24
```
√24 ≈ 4.9, so we test 2, 3, and 4

2: 24 ÷ 2 = 12 → Factors: 2, 12
3: 24 ÷ 3 = 8 → Factors: 3, 8
4: 24 ÷ 4 = 6 → Factors: 4, 6

All factors of 24: 1, 2, 3, 4, 6, 8, 12, 24
```

### Divisibility Rules

| Rule | Description |
|------|-------------|
| Divisible by 2 | Number ends in 0, 2, 4, 6, or 8 |
| Divisible by 3 | Sum of digits is divisible by 3 |
| Divisible by 4 | Last two digits form a number divisible by 4 |
| Divisible by 5 | Number ends in 0 or 5 |
| Divisible by 6 | Divisible by both 2 and 3 |
| Divisible by 9 | Sum of digits is divisible by 9 |
| Divisible by 10 | Number ends in 0 |

## Prime Factorization

### Definition
**Prime factorization** is expressing a number as a product of prime numbers.

### Factor Tree Method
Example: Prime factorization of 48
```
      48
     /  \
    2   24
       /  \
      2   12
         /  \
        2   6
           / \
          2   3

48 = 2 × 2 × 2 × 2 × 3 = 2⁴ × 3
```

### Division Method
Example: Prime factorization of 84
```
84 ÷ 2 = 42
42 ÷ 2 = 21
21 ÷ 3 = 7
7 ÷ 7 = 1

84 = 2 × 2 × 3 × 7 = 2² × 3 × 7
```

## Applications: GCD and LCM

### Greatest Common Divisor (GCD)
The **GCD** of two or more numbers is the largest number that divides all of them without remainder.

#### Finding GCD using Prime Factorization
1. Find prime factorization of each number
2. Take the lowest power of each common prime factor
3. Multiply these together

**Example:** GCD of 36 and 48
```
36 = 2² × 3²
48 = 2⁴ × 3

Common factors: 2² × 3 = 4 × 3 = 12
GCD(36, 48) = 12
```

### Least Common Multiple (LCM)
The **LCM** of two or more numbers is the smallest number that is a multiple of all of them.

#### Finding LCM using Prime Factorization
1. Find prime factorization of each number
2. Take the highest power of each prime factor
3. Multiply these together

**Example:** LCM of 36 and 48
```
36 = 2² × 3²
48 = 2⁴ × 3

Highest powers: 2⁴ × 3² = 16 × 9 = 144
LCM(36, 48) = 144
```

## Euclidean Algorithm for GCD

A more efficient method for finding GCD:

```python
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

# Example: gcd(48, 36)
# 48 % 36 = 12 → (48, 36) = (36, 12)
# 36 % 12 = 0  → (36, 12) = (12, 0)
# Result: 12
```

## Practice Problems

### Problem 1: Identify Prime Numbers
Which of the following are prime numbers?
- 17 ✓ (prime)
- 27 ✗ (divisible by 3)
- 31 ✓ (prime)
- 45 ✗ (divisible by 5)

### Problem 2: Find All Factors
Find all factors of 36:
```
√36 = 6, test 2, 3, 4, 5, 6

2: 36 ÷ 2 = 18 → 2, 18
3: 36 ÷ 3 = 12 → 3, 12
4: 36 ÷ 4 = 9  → 4, 9
6: 36 ÷ 6 = 6  → 6, 6

All factors: 1, 2, 3, 4, 6, 9, 12, 18, 36
```

### Problem 3: Prime Factorization
Find the prime factorization of 72:
```
72 = 2³ × 3²
```

### Problem 4: GCD and LCM
Find GCD and LCM of 30 and 45:
```
30 = 2 × 3 × 5
45 = 3² × 5

GCD(30, 45) = 3 × 5 = 15
LCM(30, 45) = 2 × 3² × 5 = 90
```

## Real-World Applications

### Cryptography
- Prime numbers are essential in modern cryptography
- RSA encryption uses large prime numbers for secure communication
- Computer security relies on the difficulty of factoring large numbers

### Computer Science
- Hashing algorithms use prime numbers
- Memory allocation and data structures often use prime numbers
- Random number generation and testing

### Engineering and Design
- Gear ratios often use prime numbers to reduce wear
- Musical harmonies are based on prime number ratios
- Chemical molecular structures follow patterns related to prime numbers

## Key Takeaways

1. **Prime numbers** have exactly two factors (1 and themselves)
2. **Composite numbers** have more than two factors
3. **Prime factorization** breaks down numbers into their prime components
4. **GCD** uses common factors with the lowest powers
5. **LCM** uses all factors with the highest powers
6. **Euclidean algorithm** provides an efficient way to find GCD

## Next Steps

In the next lesson, we'll explore more advanced number theory concepts including:
- Modular arithmetic
- Number patterns and sequences
- Mathematical induction
- Set theory basics

Remember: Mastering prime numbers and factors is fundamental to understanding higher mathematics!